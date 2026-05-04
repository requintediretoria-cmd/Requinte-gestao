import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const ano = searchParams.get("ano");

  let where = {};
  if (mes && ano) {
    const inicio = new Date(Number(ano), Number(mes) - 1, 1);
    const fim    = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
    where = { data: { gte: inicio, lte: fim } };
  }

  const receitas = await prisma.receita.findMany({
    where,
    orderBy: { data: "desc" },
  });

  return NextResponse.json(receitas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const receita = await prisma.receita.create({
    data: {
      data:           new Date(body.data),
      valor:          Number(body.valor),
      descricao:      body.descricao || null,
      formaPagamento: body.formaPagamento || "Outros",
    },
  });

  return NextResponse.json(receita, { status: 201 });
}
