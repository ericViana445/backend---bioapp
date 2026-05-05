import { Request, Response } from 'express';
import fs from 'fs';

const pdfParse = require('pdf-parse');

export const uploadPDF = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file; // 🔥 solução aqui

    if (!file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);

    const text = pdfData.text;

    return res.json({ text });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao processar PDF' });
  }
};