import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { formatBRL, formatDate } from "@/lib/formatters";
import Link from "next/link";
import NotaActions from "./NotaActions";

export default async function NotaDetailPage({ params }: { params: { id: string } }) {
  const nota = await prisma.notaFiscal.findUnique({
    where: { id: Number(params.id) },
    include: {
      itens: true,
      boletos: true,
      creditos: { orderBy: { tipo: "asc" } },
    },
  });

  if (!nota) notFound();

  const creditosSimples = nota.creditos.filter((c) => c.regime === "SIMPLES");
  const creditosLP = nota.creditos.filter((c) => c.regime === "LP");

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/notas" className="hover:text-brand-600">Notas Fiscais</Link>
        <span>/</span>
        <span className="text-gray-900">NF {nota.numero}/{nota.serie}</span>
      </div>

      <Header
        title={`NF ${nota.numero} — ${nota.emitenteNome}`}
        subtitle={`Emitida em ${formatDate(nota.dataEmissao)} · CNPJ ${nota.emitenteCNPJ}`}
      />

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Dados da NF */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Valores da Nota</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Produtos", nota.valorProdutos],
              ["Frete", nota.valorFrete],
              ["Desconto", nota.valorDesconto],
              ["Total NF", nota.valorTotal],
              ["ICMS", nota.valorICMS],
              ["ICMS-ST", nota.valorICMSST],
              ["IPI", nota.valorIPI],
              ["PIS", nota.valorPIS],
              ["COFINS", nota.valorCOFINS],
              ["DIFAL", nota.valorDIFAL],
            ].map(([label, val]) => (
              <div key={String(label)} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="font-bold text-gray-900">{formatBRL(Number(val))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status e ações */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Status</h3>
          <NotaActions notaId={nota.id} currentStatus={nota.status} />

          {nota.imagemPath && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Imagem da NF</p>
              <a href={nota.imagemPath} target="_blank" rel="noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200">
                <img src={nota.imagemPath} alt="NF" className="w-full object-cover max-h-48" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Itens */}
      {nota.itens.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Itens da Nota</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3">NCM / CFOP</th>
                  <th className="px-6 py-3 text-right">Qtd</th>
                  <th className="px-6 py-3 text-right">Unitário</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">ICMS</th>
                  <th className="px-6 py-3 text-right">ICMS-ST</th>
                </tr>
              </thead>
              <tbody>
                {nota.itens.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{item.descricao}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{item.ncm} / {item.cfop}</td>
                    <td className="px-6 py-3 text-right">{item.quantidade} {item.unidade}</td>
                    <td className="px-6 py-3 text-right">{formatBRL(item.valorUnitario)}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatBRL(item.valorTotal)}</td>
                    <td className="px-6 py-3 text-right text-blue-700">{formatBRL(item.valorICMS)}</td>
                    <td className="px-6 py-3 text-right text-orange-700">{formatBRL(item.valorICMSST)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Análise Tributária */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-600 font-bold text-sm px-2 py-0.5 bg-green-50 rounded">Simples Nacional</span>
            <span className="text-xs text-gray-500">Regime atual</span>
          </div>
          {creditosSimples.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum crédito identificado nesta NF</p>
          ) : (
            <div className="space-y-3">
              {creditosSimples.map((c) => (
                <div key={c.id} className={`p-3 rounded-lg ${c.aproveitavel ? "bg-green-50" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-gray-800">{c.descricao}</p>
                    <p className={`text-sm font-bold ${c.aproveitavel ? "text-green-700" : "text-gray-500"}`}>
                      {formatBRL(c.valor)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">{c.fundamentacao}</p>
                  {!c.aproveitavel && (
                    <span className="text-xs text-red-600 font-medium">Sem crédito no Simples</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-600 font-bold text-sm px-2 py-0.5 bg-blue-50 rounded">Lucro Presumido</span>
            <span className="text-xs text-gray-500">Simulação</span>
          </div>
          {creditosLP.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados para simulação</p>
          ) : (
            <div className="space-y-3">
              {creditosLP.map((c) => (
                <div key={c.id} className={`p-3 rounded-lg ${c.aproveitavel ? "bg-blue-50" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-gray-800">{c.descricao}</p>
                    <p className={`text-sm font-bold ${c.aproveitavel ? "text-blue-700" : "text-gray-500"}`}>
                      {formatBRL(c.valor)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">{c.fundamentacao}</p>
                  {!c.aproveitavel && (
                    <span className="text-xs text-orange-600 font-medium">Não gera crédito no LP</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Boletos vinculados */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Boletos Vinculados</h3>
        {nota.boletos.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum boleto vinculado a esta NF</p>
        ) : (
          <div className="space-y-2">
            {nota.boletos.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{b.beneficiario}</p>
                  <p className="text-xs text-gray-500">Vence {formatDate(b.dataVencimento)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatBRL(b.valor)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "pago" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
