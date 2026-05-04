import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeTaxes } from "@/lib/tax-analysis";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const notas = await prisma.notaFiscal.findMany({
    where: status ? { status } : undefined,
    include: { itens: true, boletos: true, creditos: true },
    orderBy: { dataEmissao: "desc" },
  });

  return NextResponse.json(notas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const nota = await prisma.notaFiscal.create({
    data: {
      numero: body.numero,
      serie: body.serie || "1",
      chaveAcesso: body.chaveAcesso || null,
      dataEmissao: new Date(body.dataEmissao),
      emitenteCNPJ: body.emitenteCNPJ,
      emitenteNome: body.emitenteNome,
      emitenteUF: body.emitenteUF || "",
      valorProdutos: body.valorProdutos || 0,
      valorFrete: body.valorFrete || 0,
      valorDesconto: body.valorDesconto || 0,
      valorTotal: body.valorTotal,
      baseICMS: body.baseICMS || 0,
      valorICMS: body.valorICMS || 0,
      valorICMSST: body.valorICMSST || 0,
      baseIPI: body.baseIPI || 0,
      valorIPI: body.valorIPI || 0,
      valorPIS: body.valorPIS || 0,
      valorCOFINS: body.valorCOFINS || 0,
      valorDIFAL: body.valorDIFAL || 0,
      imagemPath: body.imagemPath || null,
      imagemNome: body.imagemNome || null,
      observacoes: body.observacoes || null,
      itens: {
        create: (body.itens || []).map((item: Record<string, unknown>) => ({
          descricao: item.descricao,
          ncm: item.ncm || "",
          cfop: item.cfop || "",
          unidade: item.unidade || "UN",
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorTotal),
          baseICMS: Number(item.baseICMS) || 0,
          aliqICMS: Number(item.aliqICMS) || 0,
          valorICMS: Number(item.valorICMS) || 0,
          valorICMSST: Number(item.valorICMSST) || 0,
          aliqPIS: Number(item.aliqPIS) || 0,
          valorPIS: Number(item.valorPIS) || 0,
          aliqCOFINS: Number(item.aliqCOFINS) || 0,
          valorCOFINS: Number(item.valorCOFINS) || 0,
        })),
      },
    },
  });

  // Generate tax credits automatically
  const analysis = analyzeTaxes({
    valorICMS: nota.valorICMS,
    valorICMSST: nota.valorICMSST,
    valorDIFAL: nota.valorDIFAL,
    valorPIS: nota.valorPIS,
    valorCOFINS: nota.valorCOFINS,
    valorTotal: nota.valorTotal,
    emitenteUF: nota.emitenteUF,
  });

  const creditos = [
    ...analysis.simples.detalhes.map((d) => ({ ...d, regime: "SIMPLES" })),
    ...analysis.lp.detalhes.map((d) => ({ ...d, regime: "LP" })),
  ].filter((d) => d.valor > 0);

  if (creditos.length > 0) {
    await prisma.creditoTributario.createMany({
      data: creditos.map((c) => ({
        notaFiscalId: nota.id,
        tipo: c.tipo,
        regime: c.regime,
        valor: c.valor,
        descricao: c.descricao,
        aproveitavel: c.aproveitavel,
        fundamentacao: c.fundamentacao,
      })),
    });
  }

  return NextResponse.json(nota, { status: 201 });
}
