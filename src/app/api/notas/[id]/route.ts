import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const nota = await prisma.notaFiscal.findUnique({
    where: { id: Number(params.id) },
    include: { itens: true, boletos: true, creditos: true },
  });

  if (!nota) return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  return NextResponse.json(nota);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const nota = await prisma.notaFiscal.update({
    where: { id: Number(params.id) },
    data: {
      status: body.status,
      observacoes: body.observacoes,
    },
  });

  return NextResponse.json(nota);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.notaFiscal.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
