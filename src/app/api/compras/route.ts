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
    where = { dataCompra: { gte: inicio, lte: fim } };
  }

  const compras = await prisma.compraManual.findMany({
    where,
    orderBy: { dataCompra: "desc" },
  });

  return NextResponse.json(compras);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const compra = await prisma.compraManual.create({
    data: {
      fornecedor:     body.fornecedor,
      descricao:      body.descricao,
      categoria:      body.categoria,
      valor:          Number(body.valor),
      dataCompra:     new Date(body.dataCompra),
      dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : null,
      observacoes:    body.observacoes || null,
    },
  });

  return NextResponse.json(compra, { status: 201 });
}
