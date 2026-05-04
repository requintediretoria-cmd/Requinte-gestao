import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL, formatDate, daysUntil } from "@/lib/formatters";

export default async function PagamentosPage() {
  const boletos = await prisma.boleto.findMany({
    where: { status: "pendente" },
    orderBy: { dataVencimento: "asc" },
    include: { notaFiscal: { select: { numero: true, emitenteNome: true, emitenteCNPJ: true } } },
  });

  const pagos = await prisma.boleto.findMany({
    where: { status: "pago" },
    orderBy: { dataPagamento: "desc" },
    take: 20,
    include: { notaFiscal: { select: { numero: true, emitenteNome: true } } },
  });

  // Group pending by urgency
  const hoje = boletos.filter((b) => daysUntil(b.dataVencimento) === 0);
  const atrasados = boletos.filter((b) => daysUntil(b.dataVencimento) < 0);
  const proximos = boletos.filter((b) => daysUntil(b.dataVencimento) > 0 && daysUntil(b.dataVencimento) <= 7);
  const futuros = boletos.filter((b) => daysUntil(b.dataVencimento) > 7);

  const totalPendente = boletos.reduce((s, b) => s + b.valor, 0);

  function BoletoRow({ b }: { b: typeof boletos[0] }) {
    const dias = daysUntil(b.dataVencimento);
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{b.beneficiario}</p>
          <p className="text-xs text-gray-400">
            {b.notaFiscal ? `NF ${b.notaFiscal.numero} · ${b.notaFiscal.emitenteNome}` : "Sem NF vinculada"}
          </p>
          {b.linhaDigitavel && (
            <p className="text-xs font-mono text-gray-400 mt-0.5 truncate max-w-xs">{b.linhaDigitavel}</p>
          )}
        </div>
        <div className="text-right ml-4">
          <p className="font-bold text-gray-900">{formatBRL(b.valor)}</p>
          <p className="text-xs text-gray-500">{formatDate(b.dataVencimento)}</p>
          <span className={`text-xs font-medium ${dias < 0 ? "text-red-600" : dias === 0 ? "text-orange-600" : "text-yellow-600"}`}>
            {dias < 0 ? `${Math.abs(dias)}d em atraso` : dias === 0 ? "Vence hoje" : `${dias}d restantes`}
          </span>
        </div>
      </div>
    );
  }

  function Section({ title, items, color }: { title: string; items: typeof boletos; color: string }) {
    if (items.length === 0) return null;
    return (
      <div className={`bg-white rounded-xl border shadow-sm mb-4 overflow-hidden ${color}`}>
        <div className="px-5 py-3 border-b border-inherit">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{title}</h4>
            <span className="text-sm font-bold">{formatBRL(items.reduce((s, b) => s + b.valor, 0))}</span>
          </div>
        </div>
        {items.map((b) => <BoletoRow key={b.id} b={b} />)}
      </div>
    );
  }

  return (
    <div>
      <Header title="Agenda de Pagamentos" subtitle="Boletos pendentes e histórico" />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Atrasados</p>
          <p className="text-2xl font-bold text-red-800">{atrasados.length}</p>
          <p className="text-xs text-red-600">{formatBRL(atrasados.reduce((s, b) => s + b.valor, 0))}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Vencem Hoje</p>
          <p className="text-2xl font-bold text-orange-800">{hoje.length}</p>
          <p className="text-xs text-orange-600">{formatBRL(hoje.reduce((s, b) => s + b.valor, 0))}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-1">Próximos 7 dias</p>
          <p className="text-2xl font-bold text-yellow-800">{proximos.length}</p>
          <p className="text-xs text-yellow-600">{formatBRL(proximos.reduce((s, b) => s + b.valor, 0))}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Pendente</p>
          <p className="text-2xl font-bold text-gray-900">{boletos.length}</p>
          <p className="text-xs text-gray-500">{formatBRL(totalPendente)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Pendentes</h3>
          {boletos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-medium">Nenhum boleto pendente!</p>
            </div>
          ) : (
            <>
              <Section title="⚠️ Atrasados" items={atrasados} color="border-red-100" />
              <Section title="🔴 Vencem hoje" items={hoje} color="border-orange-100" />
              <Section title="🟡 Próximos 7 dias" items={proximos} color="border-yellow-100" />
              <Section title="📅 Futuros" items={futuros} color="border-gray-100" />
            </>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Histórico de Pagamentos</h3>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            {pagos.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Nenhum pagamento registrado</div>
            ) : (
              pagos.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.beneficiario}</p>
                    <p className="text-xs text-gray-400">
                      Pago em {b.dataPagamento ? formatDate(b.dataPagamento) : "—"}
                      {b.notaFiscal ? ` · NF ${b.notaFiscal.numero}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">{formatBRL(b.valorPago ?? b.valor)}</p>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Pago</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
