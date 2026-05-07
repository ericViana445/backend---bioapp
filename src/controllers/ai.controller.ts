import { Request, Response } from 'express';

const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/hemograma-analisar';

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
    } = req.body;

    const manualText = `
      Exame preenchido manualmente.
      Data de nascimento: ${birthDate}
      Hemoglobina: ${hemoglobina} g/dL
      Hematócrito: ${hematocrito} %
      RBC: ${rbc} milhões/µL
      VCM: ${vcm} fL
      HCM: ${hcm} pg
      CHCM: ${chcm} g/dL
      RDW: ${rdw} %
    `;

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        manualText,
        source: 'bioapp',
        examType: 'hemograma',
      }),
    });

    const aiResult = await n8nResponse.json();

    if (!n8nResponse.ok) {
      return res.status(500).json({
        error: 'Erro ao analisar dados manuais com IA',
        details: aiResult,
      });
    }

    return res.json(aiResult);
  } catch (error) {
    console.error('Erro ao analisar exame manual:', error);

    return res.status(500).json({
      error: 'Erro ao analisar exame manual',
    });
  }
};