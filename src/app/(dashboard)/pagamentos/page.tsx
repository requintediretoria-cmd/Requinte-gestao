import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import PagarBoletoButton from "./PagarBoletoButton";
import PagarCompraButton from "./PagarCompraButton";

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

  const [boletos, compras] = await Promise.all([
    prisma.boleto.findMany({
      where: { status: "pendente", dataVencimento: { gte: inicio, lte: fim } },
      orderBy: { dataVencimento: "asc" },
      include: { notaFiscal: { select: { numero: true, emitenteNome: true } } },
    }),
    prisma.compraManual.findMany({
      where: { status: "pendente", dataVencimento: { gte: inicio, lte: fim } },
      orderBy: { dataVencimento: "asc" },
    }),
  ]);

  const totalBoletos = boletos.reduce((s, b) => s + b.valor, 0);
  const totalCompras = compras.reduce((s, c) => s + c.valor, 0);
  const totalGeral   = totalBoletos + totalCompras;

  return (
    <div>
      <Header
        title="Pagamentos"
        subtitle={`O que vence em ${nomeProximoMes()}`}
      />

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
          <p className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-1">Total a Pagar</p>
          <p className="text-3xl font-bold text-brand-900">{formatBRL(totalGeral)}</p>
          <p className="text-xs text-brand-600 mt-1">{boletos.length + compras.length} compromisso(s)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Boletos</p>
          <p className="text-2xl font-bold text-gray-900">{formatBRL(totalBoletos)}</p>
          <p className="text-xs text-gray-400 mt-1">{boletos.length} boleto(s)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Compras s/ NF</p>
          <p className="text-2xl font-bold text-gray-900">{formatBRL(totalCompras)}</p>
          <p className="text-xs text-gray-400 mt-1">{compras.length} item(ns)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Boletos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Boletos</h3>
          </div>
          {boletos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Nenhum boleto para o próximo mês</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {boletos.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.beneficiario}</p>
                    <p className="text-xs text-gray-400">
                      {b.notaFiscal ? `NF ${b.notaFiscal.numero} · ` : ""}
                      Vence {formatDate(b.dataVencimento)}
                    </p>
                    {b.linhaDigitavel && (
                      <p className="text-xs font-mono text-gray-400 truncate mt-0.5">{b.linhaDigitavel}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-gray-900">{formatBRL(b.valor)}</p>
                    <PagarBoletoButton boletoId={b.id} valor={b.valor} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {boletos.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl flex justify-between text-sm">
              <span className="text-gray-500">Total boletos</span>
              <span className="font-bold text-gray-900">{formatBRL(totalBoletos)}</span>
            </div>
          )}
        </div>

        {/* Compras manuais */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Compras sem NF</h3>
          </div>
          {compras.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Nenhuma compra para o próximo mês</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {compras.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.fornecedor}</p>
                    <p className="text-xs text-gray-400">
                      {c.descricao} · <span className="text-brand-600">{c.categoria}</span>
                    </p>
                    {c.dataVencimento && (
                      <p className="text-xs text-gray-400">Vence {formatDate(c.dataVencimento)}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-gray-900">{formatBRL(c.valor)}</p>
                    <PagarCompraButton compraId={c.id} valor={c.valor} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {compras.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl flex justify-between text-sm">
              <span className="text-gray-500">Total compras s/ NF</span>
              <span className="font-bold text-gray-900">{formatBRL(totalCompras)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
