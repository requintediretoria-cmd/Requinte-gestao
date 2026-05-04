import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate, daysUntil } from "@/lib/formatters";
import Link from "next/link";

async function getStats() {
  const [totalNotas, totalBoletos, notasPendentes, boletosVencendo, creditosSimples, creditosLP] =
    await Promise.all([
      prisma.notaFiscal.count(),
      prisma.boleto.count(),
      prisma.notaFiscal.count({ where: { status: "pendente" } }),
      prisma.boleto.findMany({
        where: { status: "pendente" },
        orderBy: { dataVencimento: "asc" },
        take: 5,
        include: { notaFiscal: { select: { numero: true, emitenteNome: true } } },
      }),
      prisma.creditoTributario.aggregate({
        where: { regime: "SIMPLES", aproveitavel: true },
        _sum: { valor: true },
      }),
      prisma.creditoTributario.aggregate({
        where: { regime: "LP", aproveitavel: true },
        _sum: { valor: true },
      }),
    ]);

  const totalCompras = await prisma.notaFiscal.aggregate({ _sum: { valorTotal: true } });
  const totalPago = await prisma.boleto.aggregate({
    where: { status: "pago" },
    _sum: { valorPago: true },
  });

  return {
    totalNotas,
    totalBoletos,
    notasPendentes,
    boletosVencendo,
    creditosSimples: creditosSimples._sum.valor ?? 0,
    creditosLP: creditosLP._sum.valor ?? 0,
    totalCompras: totalCompras._sum.valorTotal ?? 0,
    totalPago: totalPago._sum.valorPago ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total de Notas Fiscais", value: stats.totalNotas, unit: "notas", color: "bg-blue-50 text-blue-700", href: "/notas" },
    { label: "Total de Boletos", value: stats.totalBoletos, unit: "boletos", color: "bg-purple-50 text-purple-700", href: "/boletos" },
    { label: "Notas Pendentes de Pagamento", value: stats.notasPendentes, unit: "pendentes", color: "bg-orange-50 text-orange-700", href: "/notas" },
    { label: "Créditos (Simples Nacional)", value: formatBRL(stats.creditosSimples), unit: "aproveitáveis", color: "bg-green-50 text-green-700", href: "/tributos" },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral da gestão fiscal" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.href + card.label} href={card.href}>
            <div className={`${card.color} rounded-xl p-5 hover:opacity-80 transition-opacity cursor-pointer`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-2">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs mt-0.5 opacity-70">{card.unit}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Boletos vencendo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Próximos Vencimentos</h3>
            <Link href="/pagamentos" className="text-xs text-brand-600 hover:underline">ver todos</Link>
          </div>
          {stats.boletosVencendo.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum boleto pendente</p>
          ) : (
            <div className="space-y-3">
              {stats.boletosVencendo.map((boleto) => {
                const dias = daysUntil(boleto.dataVencimento);
                const urgente = dias <= 3;
                return (
                  <div key={boleto.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{boleto.beneficiario}</p>
                      <p className="text-xs text-gray-400">
                        {boleto.notaFiscal ? `NF ${boleto.notaFiscal.numero}` : "Sem NF"} — vence {formatDate(boleto.dataVencimento)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatBRL(boleto.valor)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgente ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {dias === 0 ? "Hoje" : dias < 0 ? `${Math.abs(dias)}d atraso` : `${dias}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparativo tributário */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Créditos Tributários</h3>
            <Link href="/tributos" className="text-xs text-brand-600 hover:underline">análise completa</Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-green-800">Simples Nacional (atual)</p>
                <p className="text-xs text-green-600">ICMS-ST e ICMS próprio recuperáveis</p>
              </div>
              <p className="text-lg font-bold text-green-700">{formatBRL(stats.creditosSimples)}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-blue-800">Simulação Lucro Presumido</p>
                <p className="text-xs text-blue-600">ICMS sobre entradas (crédito estimado)</p>
              </div>
              <p className="text-lg font-bold text-blue-700">{formatBRL(stats.creditosLP)}</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-yellow-500 text-lg">💡</span>
              <p className="text-xs text-gray-600">
                Total de compras cadastradas: <strong>{formatBRL(stats.totalCompras)}</strong>.
                Acesse a aba <Link href="/tributos" className="text-brand-600 underline">Tributos</Link> para a análise detalhada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
