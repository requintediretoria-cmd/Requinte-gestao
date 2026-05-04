import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const boletos = await prisma.boleto.findMany({
    where: status ? { status } : undefined,
    include: { notaFiscal: { select: { numero: true, emitenteNome: true } } },
    orderBy: { dataVencimento: "asc" },
  });

  return NextResponse.json(boletos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const boleto = await prisma.boleto.create({
    data: {
      notaFiscalId: body.notaFiscalId ? Number(body.notaFiscalId) : null,
      beneficiario: body.beneficiario,
      valor: Number(body.valor),
      dataVencimento: new Date(body.dataVencimento),
      linhaDigitavel: body.linhaDigitavel || null,
      codigoBarras: body.codigoBarras || null,
      imagemPath: body.imagemPath || null,
      imagemNome: body.imagemNome || null,
      observacoes: body.observacoes || null,
    },
  });

  return NextResponse.json(boleto, { status: 201 });
}
