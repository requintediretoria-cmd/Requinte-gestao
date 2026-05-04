import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface NFExtracted {
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  emitenteCNPJ: string;
  emitenteNome: string;
  emitenteUF: string;
  valorProdutos: number;
  valorFrete: number;
  valorDesconto: number;
  valorTotal: number;
  baseICMS: number;
  valorICMS: number;
  valorICMSST: number;
  baseIPI: number;
  valorIPI: number;
  valorPIS: number;
  valorCOFINS: number;
  valorDIFAL: number;
  itens: ItemExtracted[];
}

export interface ItemExtracted {
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  baseICMS: number;
  aliqICMS: number;
  valorICMS: number;
  valorICMSST: number;
  aliqPIS: number;
  valorPIS: number;
  aliqCOFINS: number;
  valorCOFINS: number;
}

export async function extractNFFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<NFExtracted> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
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
            text: `Você está analisando um DANFE (Documento Auxiliar da Nota Fiscal Eletrônica) brasileiro ou uma nota fiscal de compra.

Extraia TODOS os dados disponíveis e retorne APENAS um JSON válido, sem nenhum texto adicional, no seguinte formato:

{
  "numero": "número da NF",
  "serie": "série",
  "chaveAcesso": "chave de acesso de 44 dígitos ou vazia",
  "dataEmissao": "YYYY-MM-DD",
  "emitenteCNPJ": "CNPJ formatado",
  "emitenteNome": "razão social do emitente",
  "emitenteUF": "UF de 2 letras",
  "valorProdutos": 0.00,
  "valorFrete": 0.00,
  "valorDesconto": 0.00,
  "valorTotal": 0.00,
  "baseICMS": 0.00,
  "valorICMS": 0.00,
  "valorICMSST": 0.00,
  "baseIPI": 0.00,
  "valorIPI": 0.00,
  "valorPIS": 0.00,
  "valorCOFINS": 0.00,
  "valorDIFAL": 0.00,
  "itens": [
    {
      "descricao": "nome do produto",
      "ncm": "código NCM",
      "cfop": "código CFOP",
      "unidade": "UN/KG/LT/CX etc",
      "quantidade": 0.00,
      "valorUnitario": 0.00,
      "valorTotal": 0.00,
      "baseICMS": 0.00,
      "aliqICMS": 0.00,
      "valorICMS": 0.00,
      "valorICMSST": 0.00,
      "aliqPIS": 0.00,
      "valorPIS": 0.00,
      "aliqCOFINS": 0.00,
      "valorCOFINS": 0.00
    }
  ]
}

Use 0 para campos não encontrados. Retorne SOMENTE o JSON, nada mais.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Não foi possível extrair os dados da nota fiscal.");

  return JSON.parse(jsonMatch[0]) as NFExtracted;
}
