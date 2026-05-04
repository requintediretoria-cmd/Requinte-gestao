import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import FiltroMes from "./FiltroMes";
import PrintButton from "./PrintButton";

interface Props {
  searchParams: { mes?: string; ano?: string };
}

export default async function RelatorioPage({ searchParams }: Props) {
  const hoje  = new Date();
  const mes   = Number(searchParams.mes  ?? hoje.getMonth() + 1);
  const ano   = Number(searchParams.ano  ?? hoje.getFullYear());

  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);

  const nomeMes = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const [notas, comprasManuais] = await Promise.all([
    prisma.notaFiscal.findMany({
      where: { dataEmissao: { gte: inicio, lte: fim } },
      orderBy: { dataEmissao: "asc" },
    }),
    prisma.compraManual.findMany({
      where: { dataCompra: { gte: inicio, lte: fim } },
      orderBy: { dataCompra: "asc" },
    }),
  ]);

  // Build unified list
  type Linha = {
    id: string; data: Date; fornecedor: string; descricao: string;
    categoria: string; valor: number; tipo: "NF" | "Manual";
    referencia: string;
  };

  const linhas: Linha[] = [
    ...notas.map((n) => ({
      id:         `nf-${n.id}`,
      data:       n.dataEmissao,
      fornecedor: n.emitenteNome,
      descricao:  `NF ${n.numero}/${n.serie}`,
      categoria:  n.categoria,
      valor:      n.valorTotal,
      tipo:       "NF" as const,
      referencia: n.numero,
    })),
    ...comprasManuais.map((c) => ({
      id:         `cm-${c.id}`,
      data:       c.dataCompra,
      fornecedor: c.fornecedor,
      descricao:  c.descricao,
      categoria:  c.categoria,
      valor:      c.valor,
      tipo:       "Manual" as const,
      referencia: "—",
    })),
  ].sort((a, b) => a.data.getTime() - b.data.getTime());

  // Group by categoria
  const grupos: Record<string, Linha[]> = {};
  for (const l of linhas) {
    if (!grupos[l.categoria]) grupos[l.categoria] = [];
    grupos[l.categoria].push(l);
  }
  const categoriasOrdenadas = Object.keys(grupos).sort((a, b) =>
    grupos[b].reduce((s, l) => s + l.valor, 0) - grupos[a].reduce((s, l) => s + l.valor, 0)
  );

  const totalGeral   = linhas.reduce((s, l) => s + l.valor, 0);
  const totalNF      = notas.reduce((s, n) => s + n.valorTotal, 0);
  const totalManual  = comprasManuais.reduce((s, c) => s + c.valor, 0);

  return (
    <div>
      <Header title="Relatório de Compras" subtitle={`Todas as compras de ${nomeMes}`} />

      <div className="flex items-center justify-between mb-6">
        <FiltroMes mesSelecionado={mes} anoSelecionado={ano} />
        <PrintButton />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4 mb-8 print:grid-cols-4">
        <div className="bg-gray-900 text-white rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">Total Geral</p>
          <p className="text-2xl font-bold">{formatBRL(totalGeral)}</p>
          <p className="text-xs opacity-60">{linhas.length} item(ns)</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Com NF</p>
          <p className="text-2xl font-bold text-blue-900">{formatBRL(totalNF)}</p>
          <p className="text-xs text-blue-600">{notas.length} nota(s)</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-5">
          <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Sem NF</p>
          <p className="text-2xl font-bold text-orange-900">{formatBRL(totalManual)}</p>
          <p className="text-xs text-orange-600">{comprasManuais.length} compra(s)</p>
        </div>
        <div className="bg-brand-50 rounded-xl p-5">
          <p className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-1">Categorias</p>
          <p className="text-2xl font-bold text-brand-900">{categoriasOrdenadas.length}</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">Nenhuma compra em {nomeMes}</p>
        </div>
      ) : (
        <>
          {/* Resumo por categoria */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Resumo por Categoria</h3>
            </div>
            <div className="p-6 grid grid-cols-3 gap-3">
              {categoriasOrdenadas.map((cat) => {
                const itens  = grupos[cat];
                const total  = itens.reduce((s, l) => s + l.valor, 0);
                const pct    = totalGeral > 0 ? (total / totalGeral) * 100 : 0;
                return (
                  <div key={cat} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-gray-800">{cat}</p>
                      <span className="text-xs text-gray-400">{itens.length}×</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">{formatBRL(total)}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% do total</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalhe por categoria */}
          <div className="space-y-4 print:space-y-6">
            {categoriasOrdenadas.map((cat) => {
              const itens = grupos[cat];
              const total = itens.reduce((s, l) => s + l.valor, 0);
              return (
                <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm print:shadow-none print:border print:border-gray-300">
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 rounded-t-xl border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800">{cat}</h4>
                    <span className="font-bold text-gray-900">{formatBRL(total)}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                        <th className="px-6 py-2">Data</th>
                        <th className="px-6 py-2">Fornecedor</th>
                        <th className="px-6 py-2">Descrição</th>
                        <th className="px-6 py-2">Tipo</th>
                        <th className="px-6 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((l) => (
                        <tr key={l.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-6 py-2.5 text-gray-500">{formatDate(l.data)}</td>
                          <td className="px-6 py-2.5 font-medium text-gray-900">{l.fornecedor}</td>
                          <td className="px-6 py-2.5 text-gray-500">{l.descricao}</td>
                          <td className="px-6 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              l.tipo === "NF" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {l.tipo === "NF" ? "Com NF" : "Sem NF"}
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-right font-bold text-gray-900">{formatBRL(l.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-2.5 text-sm font-semibold text-gray-600">
                          Total {cat}
                        </td>
                        <td className="px-6 py-2.5 text-right font-bold text-gray-900">{formatBRL(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Totalizador final */}
          <div className="mt-6 bg-gray-900 text-white rounded-xl p-5 flex justify-between items-center print:mt-4">
            <div>
              <p className="text-sm font-medium opacity-70">Total Geral — {nomeMes}</p>
              <p className="text-xs opacity-50">{notas.length} NF(s) + {comprasManuais.length} compra(s) manual(is)</p>
            </div>
            <p className="text-3xl font-bold">{formatBRL(totalGeral)}</p>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          aside { display: none !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
