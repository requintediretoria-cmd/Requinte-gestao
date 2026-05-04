import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import Link from "next/link";
import UploadNFButton from "./UploadNFButton";

const statusLabel: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  paga:     { label: "Paga",     color: "bg-green-100 text-green-800" },
  vencida:  { label: "Vencida",  color: "bg-red-100 text-red-800" },
};

export default async function NotasPage() {
  const notas = await prisma.notaFiscal.findMany({
    orderBy: { dataEmissao: "desc" },
    include: { boletos: true, creditos: { where: { aproveitavel: true } } },
  });

  const totais = {
    valor: notas.reduce((s, n) => s + n.valorTotal, 0),
    icms: notas.reduce((s, n) => s + n.valorICMS, 0),
    icmsST: notas.reduce((s, n) => s + n.valorICMSST, 0),
    creditos: notas.reduce((s, n) => s + n.creditos.reduce((c, cr) => c + cr.valor, 0), 0),
  };

  return (
    <div>
      <Header title="Notas Fiscais" subtitle="Entradas cadastradas com análise tributária" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de compras", value: formatBRL(totais.valor), color: "text-gray-900" },
          { label: "ICMS destacado", value: formatBRL(totais.icms), color: "text-blue-700" },
          { label: "ICMS-ST pago", value: formatBRL(totais.icmsST), color: "text-orange-700" },
          { label: "Créditos identificados", value: formatBRL(totais.creditos), color: "text-green-700" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Notas Cadastradas</h3>
          <UploadNFButton />
        </div>

        {notas.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📄</p>
            <p className="font-medium">Nenhuma nota cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova Nota" para fazer o upload</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3">NF / Fornecedor</th>
                  <th className="px-6 py-3">Emissão</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">ICMS-ST</th>
                  <th className="px-6 py-3 text-right">Créditos</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Boletos</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => {
                  const s = statusLabel[nota.status] ?? statusLabel.pendente;
                  const creditoTotal = nota.creditos.reduce((s, c) => s + c.valor, 0);
                  return (
                    <tr key={nota.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">NF {nota.numero}/{nota.serie}</p>
                        <p className="text-xs text-gray-400">{nota.emitenteNome}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(nota.dataEmissao)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatBRL(nota.valorTotal)}</td>
                      <td className="px-6 py-4 text-right text-orange-700">{formatBRL(nota.valorICMSST)}</td>
                      <td className="px-6 py-4 text-right text-green-700 font-medium">{formatBRL(creditoTotal)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{nota.boletos.length} boleto(s)</td>
                      <td className="px-6 py-4">
                        <Link href={`/notas/${nota.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
