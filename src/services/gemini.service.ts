import { env } from '../config/env';

type AnalyzeExamInput = {
  source: 'pdf' | 'manual';
  examType: 'hemograma';
  text: string;
};

const expectedSchema = {
  patient: {
    age: 'number | null',
  },
  values: {
    hemoglobina: { value: 'number | string | null', unit: 'g/dL', interpretation: 'string' },
    hematocrito: { value: 'number | string | null', unit: '%', interpretation: 'string' },
    rbc: { value: 'number | string | null', unit: 'milhoes/uL', interpretation: 'string' },
    vcm: { value: 'number | string | null', unit: 'fL', interpretation: 'string' },
    hcm: { value: 'number | string | null', unit: 'pg', interpretation: 'string' },
    chcm: { value: 'number | string | null', unit: 'g/dL', interpretation: 'string' },
    rdw: { value: 'number | string | null', unit: '%', interpretation: 'string' },
  },
  questions: [
    {
      id: 'number',
      question: 'string',
      options: ['string', 'string', 'string', 'string'],
      correctOptionIndex: 'number from 0 to 3',
      weakHint: 'string',
      strongHint: 'string',
      explanation: 'string',
      params: ['hemoglobina | hematocrito | rbc | vcm | hcm | chcm | rdw'],
    },
  ],
};

function buildPrompt(input: AnalyzeExamInput) {
  return `
Voce e um assistente educacional do BioApp para interpretacao didatica de hemograma.
Analise somente os dados fornecidos. Nao invente valores ausentes.
Nao de diagnostico medico definitivo, prescricao, conduta ou substituicao de consulta profissional.

Retorne exclusivamente JSON valido, sem markdown, sem comentarios e sem texto fora do JSON.
O JSON precisa seguir este formato:
${JSON.stringify(expectedSchema, null, 2)}

Regras:
- Use null quando um parametro nao for encontrado.
- Mantenha as chaves exatamente como no schema.
- Em "interpretation", escreva uma explicacao curta, educativa e prudente em portugues.
- Gere de 5 a 8 perguntas em "questions" para atividade educacional.
- Cada pergunta deve ter exatamente 4 alternativas.
- "correctOptionIndex" deve ser o indice da alternativa correta, entre 0 e 3.
- "patient.age" deve ser numero quando a idade for encontrada, caso contrario null.
- Se a data de nascimento for informada, estime a idade considerando o ano atual.

Tipo de entrada: ${input.source}
Tipo de exame: ${input.examType}

Dados do exame:
${input.text}
`;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('Gemini nao retornou JSON.');
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

export async function analyzeExamWithGemini(input: AnalyzeExamInput) {
  if (!env.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY ou AI_API_KEY nao configurada.');
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent`
  );
  url.searchParams.set('key', env.gemini.apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(input) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'Erro ao chamar Gemini.';
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('');

  if (!text) {
    throw new Error('Gemini retornou resposta vazia.');
  }

  return extractJson(text);
}
