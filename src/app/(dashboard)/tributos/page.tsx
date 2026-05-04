import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL } from "@/lib/formatters";

export default async function TributosPage() {
  const [notas, creditosAll] = await Promise.all([
    prisma.notaFiscal.findMany({ orderBy: { dataEmissao: "desc" } }),
    prisma.creditoTributario.findMany({
      include: { notaFiscal: { select: { numero: true, emitenteNome: true, dataEmissao: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const creditosSimples = creditosAll.filter((c) => c.regime === "SIMPLES");
  const creditosLP     = creditosAll.filter((c) => c.regime === "LP");

  const totalSimples = creditosSimples.filter((c) => c.aproveitavel).reduce((s, c) => s + c.valor, 0);
  const totalLP      = creditosLP.filter((c) => c.aproveitavel).reduce((s, c) => s + c.valor, 0);

  const totalCompras = notas.reduce((s, n) => s + n.valorTotal, 0);
  const totalICMS    = notas.reduce((s, n) => s + n.valorICMS, 0);
  const totalICMSST  = notas.reduce((s, n) => s + n.valorICMSST, 0);
  const totalPIS     = notas.reduce((s, n) => s + n.valorPIS, 0);
  const totalCOFINS  = notas.reduce((s, n) => s + n.valorCOFINS, 0);
  const totalDIFAL   = notas.reduce((s, n) => s + n.valorDIFAL, 0);

  // Group by tipo for Simples
  const byTipoSimples: Record<string, typeof creditosSimples> = {};
  for (const c of creditosSimples) {
    if (!byTipoSimples[c.tipo]) byTipoSimples[c.tipo] = [];
    byTipoSimples[c.tipo].push(c);
  }

  const tipoLabel: Record<string, string> = {
    ICMS_ST:      "ICMS-ST (Substituição Tributária)",
    ICMS_PROPRIO: "ICMS Próprio Destacado",
    DIFAL:        "DIFAL — Diferencial de Alíquota",
    PIS_COFINS:   "PIS/COFINS (sem crédito no Simples)",
    ICMS_CREDITO: "Crédito de ICMS (entradas)",
    PIS_COFINS_LP:"PIS/COFINS — Lucro Presumido",
  };

  return (
    <div>
      <Header title="Análise Tributária" subtitle="Créditos identificados e simulação de regimes" />

      {/* Resumo geral */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Tributos nas Entradas</p>
          {[
            ["Total de Compras", totalCompras, "text-gray-900"],
            ["ICMS Total",       totalICMS,    "text-blue-700"],
            ["ICMS-ST Total",    totalICMSST,  "text-orange-700"],
            ["PIS Total",        totalPIS,     "text-purple-700"],
            ["COFINS Total",     totalCOFINS,  "text-indigo-700"],
            ["DIFAL Total",      totalDIFAL,   "text-red-700"],
          ].map(([label, val, color]) => (
            <div key={String(label)} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`text-sm font-bold ${color}`}>{formatBRL(Number(val))}</span>
            </div>
          ))}
        </div>

        <div className="col-span-2 grid grid-rows-2 gap-4">
          <div className="bg-green-50 rounded-xl border border-green-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Simples Nacional — Regime Atual</p>
                <p className="text-xs text-green-600 mt-0.5">Créditos efetivamente aproveitáveis</p>
              </div>
              <p className="text-3xl font-bold text-green-800">{formatBRL(totalSimples)}</p>
            </div>
            <div className="flex gap-3 text-xs text-green-700 mt-3">
              <span className="bg-green-100 px-2 py-1 rounded">ICMS-ST: {formatBRL(totalICMSST)}</span>
              <span className="bg-green-100 px-2 py-1 rounded">ICMS próprio: {formatBRL(totalICMS)}</span>
              {totalDIFAL > 0 && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">DIFAL verificar: {formatBRL(totalDIFAL)}</span>}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Lucro Presumido — Simulação</p>
                <p className="text-xs text-blue-600 mt-0.5">Crédito de ICMS sobre entradas (PIS/COFINS cumulativo, sem crédito)</p>
              </div>
              <p className="text-3xl font-bold text-blue-800">{formatBRL(totalLP)}</p>
            </div>
            <div className="flex gap-2 text-xs mt-3">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">ICMS crédito: {formatBRL(totalICMS + totalICMSST)}</span>
              <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded">PIS 0,65% / COFINS 3% — cumulativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo */}
      {totalSimples > 0 || totalLP > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Comparativo de Regimes</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Simples Nacional (atual)</span>
                <span className="text-sm font-bold text-green-700">{formatBRL(totalSimples)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${totalLP > 0 ? (totalSimples / Math.max(totalSimples, totalLP)) * 100 : 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Lucro Presumido (simulação)</span>
                <span className="text-sm font-bold text-blue-700">{formatBRL(totalLP)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${totalSimples > 0 ? (totalLP / Math.max(totalSimples, totalLP)) * 100 : 100}%` }}
                />
              </div>
            </div>
          </div>
          {totalLP > totalSimples && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              💡 <strong>Atenção:</strong> No Lucro Presumido, o crédito de ICMS estimado é {formatBRL(totalLP - totalSimples)} maior.
              Consulte seu contador para avaliar se a migração de regime é vantajosa considerando a carga total de tributos.
            </div>
          )}
        </div>
      ) : null}

      {/* Detalhe Simples */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-green-50 rounded-t-xl">
            <h3 className="font-semibold text-green-900">Simples Nacional — Detalhes</h3>
          </div>
          {Object.keys(byTipoSimples).length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Nenhum crédito identificado. Faça upload de notas fiscais.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(byTipoSimples).map(([tipo, items]) => {
                const total = items.reduce((s, c) => s + c.valor, 0);
                const aproveitavel = items[0]?.aproveitavel;
                return (
                  <div key={tipo} className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{tipoLabel[tipo] || tipo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{items[0]?.fundamentacao}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-base font-bold ${aproveitavel ? "text-green-700" : "text-gray-400"}`}>
                          {formatBRL(total)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${aproveitavel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {aproveitavel ? "Aproveitável" : "Sem crédito"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{items.length} nota(s) com este tributo</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50 rounded-t-xl">
            <h3 className="font-semibold text-blue-900">Lucro Presumido — Simulação</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {creditosLP.length === 0 ? (
              <p className="text-sm text-gray-400 p-6">Sem dados. Faça upload de notas fiscais.</p>
            ) : (
              Object.entries(
                creditosLP.reduce((acc, c) => {
                  if (!acc[c.tipo]) acc[c.tipo] = [];
                  acc[c.tipo].push(c);
                  return acc;
                }, {} as Record<string, typeof creditosLP>)
              ).map(([tipo, items]) => {
                const total = items.reduce((s, c) => s + c.valor, 0);
                const aproveitavel = items[0]?.aproveitavel;
                return (
                  <div key={tipo} className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{tipoLabel[tipo] || tipo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{items[0]?.fundamentacao}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-base font-bold ${aproveitavel ? "text-blue-700" : "text-gray-400"}`}>
                          {formatBRL(total)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${aproveitavel ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                          {aproveitavel ? "Crédito estimado" : "Sem crédito"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{items.length} nota(s)</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500">
              ⚠️ Esta é uma <strong>simulação estimada</strong>. Os valores reais no Lucro Presumido
              dependem das alíquotas de ICMS por estado, tipo de produto (NCM) e outros fatores.
              Consulte seu contador antes de tomar decisões de planejamento tributário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
