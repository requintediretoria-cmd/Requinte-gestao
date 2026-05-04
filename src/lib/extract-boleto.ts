import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface BoletoExtracted {
  beneficiario: string;
  valor: number;
  dataVencimento: string;
  linhaDigitavel: string;
  codigoBarras: string;
}

export async function extractBoletoFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<BoletoExtracted> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
          },
          {
            type: "text",
            text: `Você está analisando um boleto bancário brasileiro.

Extraia os dados e retorne APENAS um JSON válido, sem texto adicional:

{
  "beneficiario": "nome do beneficiário/cedente",
  "valor": 0.00,
  "dataVencimento": "YYYY-MM-DD",
  "linhaDigitavel": "linha digitável completa",
  "codigoBarras": "código de barras numérico"
}

Use string vazia para campos não encontrados. Retorne SOMENTE o JSON.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Não foi possível extrair os dados do boleto.");

  return JSON.parse(jsonMatch[0]) as BoletoExtracted;
}
