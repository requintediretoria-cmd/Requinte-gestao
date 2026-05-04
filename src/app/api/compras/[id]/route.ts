import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const compra = await prisma.compraManual.update({
    where: { id: Number(params.id) },
    data: {
      fornecedor:     body.fornecedor,
      descricao:      body.descricao,
      categoria:      body.categoria,
      valor:          body.valor !== undefined ? Number(body.valor) : undefined,
      dataCompra:     body.dataCompra ? new Date(body.dataCompra) : undefined,
      dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : null,
      status:         body.status,
      dataPagamento:  body.dataPagamento ? new Date(body.dataPagamento) : undefined,
      valorPago:      body.valorPago !== undefined ? Number(body.valorPago) : undefined,
      observacoes:    body.observacoes,
    },
  });

  return NextResponse.json(compra);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.compraManual.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
