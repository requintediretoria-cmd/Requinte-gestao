import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const boleto = await prisma.boleto.update({
    where: { id: Number(params.id) },
    data: {
      status: body.status,
      dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : undefined,
      valorPago: body.valorPago !== undefined ? Number(body.valorPago) : undefined,
      notaFiscalId: body.notaFiscalId !== undefined ? (body.notaFiscalId ? Number(body.notaFiscalId) : null) : undefined,
      observacoes: body.observacoes,
    },
  });

  return NextResponse.json(boleto);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.boleto.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
