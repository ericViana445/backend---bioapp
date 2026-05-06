import { Request, Response } from 'express';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/hemograma-analisar';

export const uploadPDF = async (req: Request, res: Response) => {
  try {
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    const data = new Uint8Array(fs.readFileSync(filePath));

    const pdf = await pdfjsLib.getDocument(data).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items
        .map((item: any) => item.str || '')
        .join(' ');

      fullText += strings + '\n';
    }

    console.log('TEXTO EXTRAÍDO:\n', fullText);

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfText: fullText,
        source: 'bioapp',
        examType: 'hemograma',
      }),
    });

    console.log('STATUS N8N:', n8nResponse.status);

    const aiResult = await n8nResponse.json();
    
    console.log('RESPOSTA N8N:', JSON.stringify(aiResult, null, 2));

    if (!n8nResponse.ok) {
      return res.status(500).json({
        error: 'Erro ao analisar PDF com IA',
        details: aiResult,
      });
    }

    return res.json(aiResult);
  } catch (err) {
    console.error('Erro ao processar PDF:', err);

    return res.status(500).json({
      error: 'Erro ao processar PDF',
    });
  }
};