import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

import { env } from '../config/env';
import { aiRepository, pdfRepository, supabase } from '../db';
import { analyzeExamWithGemini } from '../services/gemini.service';

async function extractTextFromPdf(buffer: Buffer) {
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument(data).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '').join(' ');

    fullText += `${strings}\n`;
  }

  return fullText;
}

async function uploadToStorage(file: Express.Multer.File) {
  const extension = file.originalname.split('.').pop() || 'pdf';
  const storagePath = `pdfs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(env.supabase.storageBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype || 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro ao salvar PDF no Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(env.supabase.storageBucket)
    .getPublicUrl(data.path);

  return {
    storagePath: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}

export const uploadPDF = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Arquivo nao enviado' });
    }

    const fullText = await extractTextFromPdf(file.buffer);
    const { storagePath, publicUrl } = await uploadToStorage(file);

    const pdfUpload = await pdfRepository.createUpload({
      user_id: req.body.userId ? Number(req.body.userId) : null,
      original_name: file.originalname,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.mimetype,
      size_bytes: file.size,
      extracted_text: fullText,
    });

    const aiResult = await analyzeExamWithGemini({
      source: 'pdf',
      examType: 'hemograma',
      text: fullText,
    });

    await aiRepository.createAnalysis({
      user_id: req.body.userId ? Number(req.body.userId) : null,
      pdf_upload_id: pdfUpload.id,
      source: 'pdf',
      exam_type: 'hemograma',
      input_payload: { pdfPath: storagePath, pdfUrl: publicUrl },
      result_payload: aiResult,
    });

    return res.json(aiResult);
  } catch (err) {
    console.error('Erro ao processar PDF:', err);

    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Erro ao processar PDF',
    });
  }
};
