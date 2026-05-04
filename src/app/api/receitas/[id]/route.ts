import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const receita = await prisma.receita.update({
    where: { id: Number(params.id) },
    data: {
      data:           body.data ? new Date(body.data) : undefined,
      valor:          body.valor !== undefined ? Number(body.valor) : undefined,
      descricao:      body.descricao,
      formaPagamento: body.formaPagamento,
    },
  });

  return NextResponse.json(receita);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.receita.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
