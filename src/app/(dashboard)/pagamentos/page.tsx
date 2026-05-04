import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import PagarBoletoButton from "./PagarBoletoButton";

function getProximoMes() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const fim    = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0, 23, 59, 59);
  return { inicio, fim };
}

function nomeProximoMes() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function PagamentosPage() {
  const { inicio, fim } = getProximoMes();

  const boletos = await prisma.boleto.findMany({
    where: { status: "pendente", dataVencimento: { gte: inicio, lte: fim } },
    orderBy: { dataVencimento: "asc" },
    include: { notaFiscal: { select: { numero: true, emitenteNome: true } } },
  });

  const total = boletos.reduce((s, b) => s + b.valor, 0);

  return (
    <div>
      <Header
        title="Pagamentos"
        subtitle={`O que vence em ${nomeProximoMes()}`}
      />

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
          <p className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-1">Total a Pagar</p>
          <p className="text-3xl font-bold text-brand-900">{formatBRL(total)}</p>
          <p className="text-xs text-brand-600 mt-1">{boletos.length} boleto(s)</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Forma</p>
          <p className="text-lg font-semibold text-gray-700">Boletos bancários</p>
          <p className="text-xs text-gray-400 mt-1">Compras s/ NF são à vista</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Boletos do Próximo Mês</h3>
        </div>

        {boletos.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-medium">Nenhum boleto para o próximo mês</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {boletos.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.beneficiario}</p>
                    <p className="text-xs text-gray-400">
                      {b.notaFiscal ? `NF ${b.notaFiscal.numero} · ${b.notaFiscal.emitenteNome} · ` : ""}
                      Vence {formatDate(b.dataVencimento)}
                    </p>
                    {b.linhaDigitavel && (
                      <p className="text-xs font-mono text-gray-300 truncate mt-0.5">{b.linhaDigitavel}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-gray-900">{formatBRL(b.valor)}</p>
                    <PagarBoletoButton boletoId={b.id} valor={b.valor} />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl flex justify-between text-sm font-semibold">
              <span className="text-gray-600">Total</span>
              <span className="text-gray-900">{formatBRL(total)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
