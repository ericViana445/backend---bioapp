import { Request, Response } from 'express';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

export const uploadPDF = async (req: Request, res: Response) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) return res.status(400).json({ error: 'Arquivo não enviado' });

    const data = new Uint8Array(fs.readFileSync(filePath));

    // ✅ Apenas passar o data, sem worker
    const pdf = await pdfjsLib.getDocument(data).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => (item.str || '')).join(' ');
      fullText += strings + '\n';
    }

    console.log('TEXTO EXTRAÍDO:\n', fullText);

    const result = {
      hemoglobina: extract(fullText, /Hemoglobina.*?([\d.]+)/i),
      hematocrito: extract(fullText, /Hematócrito.*?([\d.]+)/i),
      rbc: extract(fullText, /Eritrócitos.*?([\d.]+)/i),
      vcm: extract(fullText, /VCM.*?([\d.]+)/i),
      hcm: extract(fullText, /HCM.*?([\d.]+)/i),
      chcm: extract(fullText, /CHCM.*?([\d.]+)/i),
      rdw: extract(fullText, /RDW.*?([\d.]+)/i),
    };

    return res.json(result);

  } catch (err) {
    console.error('Erro ao processar PDF:', err);
    return res.status(500).json({ error: 'Erro ao processar PDF' });
  }
};

function extract(text: string, regex: RegExp) {
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : null;
}