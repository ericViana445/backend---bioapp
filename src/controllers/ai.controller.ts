import { Request, Response } from 'express';

import { aiRepository } from '../db';
import { analyzeExamWithGemini } from '../services/gemini.service';

export const analyzeManualExam = async (req: Request, res: Response) => {
  try {
    const {
      birthDate,
      hemoglobina,
      hematocrito,
      rbc,
      vcm,
      hcm,
      chcm,
      rdw,
      userId,
    } = req.body;

    const manualText = `
      Exame preenchido manualmente.
      Data de nascimento: ${birthDate}
      Hemoglobina: ${hemoglobina} g/dL
      Hematocrito: ${hematocrito} %
      RBC: ${rbc} milhoes/uL
      VCM: ${vcm} fL
      HCM: ${hcm} pg
      CHCM: ${chcm} g/dL
      RDW: ${rdw} %
    `;

    const aiResult = await analyzeExamWithGemini({
      source: 'manual',
      examType: 'hemograma',
      text: manualText,
    });

    await aiRepository.createAnalysis({
      user_id: userId ? Number(userId) : null,
      source: 'manual',
      exam_type: 'hemograma',
      input_payload: req.body,
      result_payload: aiResult,
    });

    return res.json(aiResult);
  } catch (error) {
    console.error('Erro ao analisar exame manual:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao analisar exame manual',
    });
  }
};
