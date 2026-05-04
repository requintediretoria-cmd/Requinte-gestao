import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate, daysUntil } from "@/lib/formatters";
import UploadBoletoButton from "./UploadBoletoButton";
import BoletoStatusButton from "./BoletoStatusButton";

export default async function BoletosPage() {
  const boletos = await prisma.boleto.findMany({
    orderBy: { dataVencimento: "asc" },
    include: { notaFiscal: { select: { numero: true, emitenteNome: true } } },
  });

  const pendentes = boletos.filter((b) => b.status === "pendente");
  const pagos = boletos.filter((b) => b.status === "pago");
  const totalPendente = pendentes.reduce((s, b) => s + b.valor, 0);
  const totalPago = pagos.reduce((s, b) => s + (b.valorPago ?? b.valor), 0);

  return (
    <div>
      <Header title="Boletos" subtitle="Controle de boletos e pagamentos" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl p-5">
          <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-800">{formatBRL(totalPendente)}</p>
          <p className="text-xs text-yellow-600">{pendentes.length} boleto(s)</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Pagos</p>
          <p className="text-2xl font-bold text-green-800">{formatBRL(totalPago)}</p>
          <p className="text-xs text-green-600">{pagos.length} boleto(s)</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatBRL(totalPendente + totalPago)}</p>
          <p className="text-xs text-gray-500">{boletos.length} boleto(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Todos os Boletos</h3>
          <UploadBoletoButton />
        </div>

        {boletos.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🏦</p>
            <p className="font-medium">Nenhum boleto cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3">Beneficiário</th>
                  <th className="px-6 py-3">NF Vinculada</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {boletos.map((boleto) => {
                  const dias = daysUntil(boleto.dataVencimento);
                  const vencido = dias < 0 && boleto.status === "pendente";
                  return (
                    <tr key={boleto.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{boleto.beneficiario}</p>
                        {boleto.linhaDigitavel && (
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{boleto.linhaDigitavel}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {boleto.notaFiscal ? (
                          <span className="text-xs">NF {boleto.notaFiscal.numero}<br />{boleto.notaFiscal.emitenteNome}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800">{formatDate(boleto.dataVencimento)}</p>
                        {boleto.status === "pendente" && (
                          <span className={`text-xs font-medium ${vencido ? "text-red-600" : dias <= 3 ? "text-orange-600" : "text-gray-400"}`}>
                            {vencido ? `${Math.abs(dias)}d em atraso` : dias === 0 ? "Vence hoje" : `${dias}d`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatBRL(boleto.valor)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          boleto.status === "pago" ? "bg-green-100 text-green-800" :
                          vencido ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {vencido ? "Vencido" : boleto.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <BoletoStatusButton boletoId={boleto.id} currentStatus={boleto.status} valor={boleto.valor} />
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
