import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import NovaReceitaButton from "./NovaReceitaButton";
import ReceitaActions from "./ReceitaActions";

const formaColor: Record<string, string> = {
  "Dinheiro":       "bg-green-100 text-green-800",
  "Cartão Débito":  "bg-blue-100 text-blue-800",
  "Cartão Crédito": "bg-purple-100 text-purple-800",
  "PIX":            "bg-cyan-100 text-cyan-800",
  "Outros":         "bg-gray-100 text-gray-700",
};

export default async function ReceitasPage() {
  const hoje   = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim    = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const [receitasMes, receitasRecentes] = await Promise.all([
    prisma.receita.findMany({ where: { data: { gte: inicio, lte: fim } } }),
    prisma.receita.findMany({ orderBy: { data: "desc" }, take: 50 }),
  ]);

  const totalMes = receitasMes.reduce((s, r) => s + r.valor, 0);

  const porForma: Record<string, number> = {};
  for (const r of receitasMes) {
    porForma[r.formaPagamento] = (porForma[r.formaPagamento] || 0) + r.valor;
  }

  const mesNome = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <Header title="Receitas" subtitle={`Faturamento — ${mesNome}`} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-2 bg-gray-900 text-white rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">Faturamento do Mês</p>
          <p className="text-3xl font-bold">{formatBRL(totalMes)}</p>
          <p className="text-xs opacity-50 mt-1">{receitasMes.length} lançamento(s)</p>
        </div>
        {Object.entries(porForma).sort(([,a],[,b]) => b-a).slice(0, 2).map(([forma, val]) => (
          <div key={forma} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{forma}</p>
            <p className="text-xl font-bold text-gray-900">{formatBRL(val)}</p>
            <p className="text-xs text-gray-400">{totalMes > 0 ? ((val/totalMes)*100).toFixed(1) : 0}% do total</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Lançamentos</h3>
            <NovaReceitaButton />
          </div>

          {receitasRecentes.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">💰</p>
              <p className="font-medium">Nenhuma receita lançada</p>
              <p className="text-sm mt-1">Clique em "+ Nova Receita" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3">Forma</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {receitasRecentes.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-700">{formatDate(r.data)}</td>
                      <td className="px-6 py-3 text-gray-600">{r.descricao || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${formaColor[r.formaPagamento] ?? formaColor["Outros"]}`}>
                          {r.formaPagamento}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">{formatBRL(r.valor)}</td>
                      <td className="px-6 py-3">
                        <ReceitaActions receita={r} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Por Forma de Pgto — {mesNome}</h3>
          </div>
          {Object.keys(porForma).length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Sem lançamentos no mês</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(porForma).sort(([,a],[,b]) => b-a).map(([forma, val]) => {
                const pct = totalMes > 0 ? (val / totalMes) * 100 : 0;
                return (
                  <div key={forma} className="px-6 py-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{forma}</span>
                      <span className="text-sm font-bold text-gray-900">{formatBRL(val)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>
                  </div>
                );
              })}
              <div className="flex justify-between items-center px-6 py-3 bg-gray-50 rounded-b-xl">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-sm font-bold text-gray-900">{formatBRL(totalMes)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
