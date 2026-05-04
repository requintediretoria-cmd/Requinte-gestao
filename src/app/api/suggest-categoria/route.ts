import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIAS } from "@/lib/categorias";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { fornecedor, descricao } = await req.json();
  if (!fornecedor && !descricao) return NextResponse.json({ categoria: "Outros" });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 50,
    messages: [
      {
        role: "user",
        content: `Você é um assistente de categorização para um restaurante brasileiro.

Fornecedor: "${fornecedor || ""}"
Descrição: "${descricao || ""}"

Com base nessas informações, qual é a categoria mais adequada? Responda com APENAS o nome exato de uma das opções abaixo, sem nenhum outro texto:

${CATEGORIAS.join("\n")}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "Outros";
  const categoria = CATEGORIAS.find((c) => c === text) ?? "Outros";

  return NextResponse.json({ categoria });
}
