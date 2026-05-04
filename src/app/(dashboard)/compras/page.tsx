import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import NovaCompraButton from "./NovaCompraButton";
import CompraActions from "./CompraActions";

const statusColor: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  pago:     "bg-green-100 text-green-800",
};

export default async function ComprasPage() {
  const compras = await prisma.compraManual.findMany({
    orderBy: { dataCompra: "desc" },
  });

  const totalPendente = compras.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalPago     = compras.filter((c) => c.status === "pago").reduce((s, c) => s + (c.valorPago ?? c.valor), 0);

  // Group by categoria for summary
  const porCategoria: Record<string, number> = {};
  for (const c of compras) {
    porCategoria[c.categoria] = (porCategoria[c.categoria] || 0) + c.valor;
  }

  return (
    <div>
      <Header title="Compras sem Nota Fiscal" subtitle="Cadastro manual de compras" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl p-5">
          <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-1">A Pagar</p>
          <p className="text-2xl font-bold text-yellow-800">{formatBRL(totalPendente)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Pago</p>
          <p className="text-2xl font-bold text-green-800">{formatBRL(totalPago)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Cadastrado</p>
          <p className="text-2xl font-bold text-gray-900">{formatBRL(totalPendente + totalPago)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista principal */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Registros</h3>
            <NovaCompraButton />
          </div>

          {compras.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-medium">Nenhuma compra cadastrada</p>
              <p className="text-sm mt-1">Clique em "+ Nova Compra" para adicionar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-6 py-3">Fornecedor / Descrição</th>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{c.fornecedor}</p>
                        <p className="text-xs text-gray-400">{c.descricao}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full font-medium">
                          {c.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{formatDate(c.dataCompra)}</td>
                      <td className="px-6 py-3 text-gray-600">
                        {c.dataVencimento ? formatDate(c.dataVencimento) : "—"}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">{formatBRL(c.valor)}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[c.status] ?? statusColor.pendente}`}>
                          {c.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <CompraActions compra={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo por categoria */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Por Categoria</h3>
          </div>
          {Object.keys(porCategoria).length === 0 ? (
            <p className="text-sm text-gray-400 p-6">Sem dados</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(porCategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, val]) => (
                  <div key={cat} className="flex justify-between items-center px-6 py-3">
                    <span className="text-sm text-gray-700">{cat}</span>
                    <span className="text-sm font-bold text-gray-900">{formatBRL(val)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
