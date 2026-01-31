import { Request, Response } from "express";

export async function analyzeText(req: Request, res: Response) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: "Texto é obrigatório",
    });
  }

  // depois aqui você chama a IA
  return res.json({
    result: "Análise recebida com sucesso",
    input: text,
  });
}
