import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { formatBRL } from "@/lib/formatters";
import { calcularDRE } from "@/lib/dre";
import DreFiltros from "./DreFiltros";
import PrintButton from "../relatorio/PrintButton";
import type { LinhaDesp } from "@/lib/dre";

interface Props {
  searchParams: { mes?: string; ano?: string; regime?: string; aliquota?: string };
}

export default async function DrePage({ searchParams }: Props) {
  const hoje    = new Date();
  const mes     = Number(searchParams.mes     ?? hoje.getMonth() + 1);
  const ano     = Number(searchParams.ano     ?? hoje.getFullYear());
  const regime  = (searchParams.regime === "caixa" ? "caixa" : "competencia") as "caixa" | "competencia";
  const aliq    = searchParams.aliquota ? Number(searchParams.aliquota) / 100 : undefined;

  const inicio = new Date(ano, mes - 1, 1);
  const fim    = new Date(ano, mes, 0, 23, 59, 59);

  // For caixa we need a wider window on notes (payment might be in this month for older notes)
  const inicioAmplo = new Date(ano, mes - 4, 1);

  const [receitas, notas, compras] = await Promise.all([
    prisma.receita.findMany({ where: { data: { gte: inicio, lte: fim } } }),
    prisma.notaFiscal.findMany({
      where: regime === "competencia"
        ? { dataEmissao: { gte: inicio, lte: fim } }
        : { OR: [
            { dataEmissao: { gte: inicio, lte: fim } },
            { boletos: { some: { dataPagamento: { gte: inicio, lte: fim } } } },
          ]},
      include: { boletos: { select: { dataPagamento: true, valor: true } } },
    }),
    prisma.compraManual.findMany({ where: { dataCompra: { gte: inicio, lte: fim } } }),
  ]);

  const dre = calcularDRE(receitas, notas, compras, regime, aliq);

  const nomeMes = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const isPositivo = dre.resultadoOperacional >= 0;

  function Linha({ label, valor, bold, indent, color }: {
    label: string; valor: number; bold?: boolean; indent?: boolean; color?: string;
  }) {
    return (
      <div className={`flex justify-between items-center py-2 ${indent ? "pl-6" : ""} ${bold ? "font-bold" : ""}`}>
        <span className={`text-sm ${color ?? "text-gray-700"}`}>{label}</span>
        <span className={`text-sm ${color ?? "text-gray-900"} ${bold ? "font-bold" : ""}`}>{formatBRL(valor)}</span>
      </div>
    );
  }

  function Separador() {
    return <div className="border-t border-gray-200 my-1" />;
  }

  function BlocoCategoria({ linhas, titulo }: { linhas: LinhaDesp[]; titulo: string }) {
    if (linhas.length === 0) return null;
    return (
      <details className="mt-2 group">
        <summary className="text-xs text-brand-600 cursor-pointer hover:text-brand-800 list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
          {titulo} — detalhe por categoria
        </summary>
        <div className="mt-2 pl-4 space-y-1">
          {linhas.map((l) => (
            <div key={l.categoria} className="flex justify-between text-xs text-gray-500 py-0.5 border-b border-gray-50">
              <span>{l.categoria}</span>
              <span className="font-medium text-gray-700">{formatBRL(l.valor)}</span>
            </div>
          ))}
        </div>
      </details>
    );
  }

  return (
    <div>
      <Header title="DRE" subtitle={`Demonstração do Resultado — ${nomeMes}`} />

      <div className="flex items-center justify-between mb-6 no-print">
        <DreFiltros mesSelecionado={mes} anoSelecionado={ano} regimeSelecionado={regime} aliquota={searchParams.aliquota ?? ""} />
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* DRE Principal */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">DRE — {nomeMes}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Regime de <strong>{regime === "caixa" ? "Caixa" : "Competência"}</strong>
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${regime === "caixa" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
              {regime === "caixa" ? "Caixa" : "Competência"}
            </span>
          </div>

          <div className="px-6 py-4">
            {/* Receita */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Receitas</p>
            <Linha label="(+) Receita Bruta" valor={dre.receitaBruta} bold />
            <Linha
              label={`(−) DAS Simples Nacional est. (${aliq ? (aliq*100).toFixed(1) : "auto"}%)`}
              valor={-dre.deducoesSimplesEst}
              indent
              color="text-red-600"
            />
            <Separador />
            <Linha label="(=) Receita Líquida" valor={dre.receitaLiquida} bold />

            {/* CMV */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">Custos (CMV)</p>
            <Linha label="(−) Custo das Mercadorias Vendidas" valor={-dre.cmv} color="text-red-700" />
            <BlocoCategoria linhas={dre.cmvLinhas} titulo="CMV" />
            <Separador />
            <div className="flex justify-between items-center py-2 font-bold border-b-2 border-gray-300">
              <span className="text-sm text-gray-800">(=) Lucro Bruto</span>
              <div className="text-right">
                <span className={`text-base font-bold ${dre.lucroBruto >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {formatBRL(dre.lucroBruto)}
                </span>
                <p className="text-xs text-gray-400">Margem: {dre.margemBruta.toFixed(1)}%</p>
              </div>
            </div>

            {/* Despesas Operacionais */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">Despesas Operacionais</p>
            <Linha label="(−) Despesas Operacionais" valor={-dre.despesasOp} color="text-red-700" />
            <BlocoCategoria linhas={dre.despesasOpLinhas} titulo="Despesas" />
            <Separador />

            {/* Resultado */}
            <div className={`mt-3 p-4 rounded-xl ${isPositivo ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-bold ${isPositivo ? "text-green-800" : "text-red-800"}`}>
                    (=) Resultado Operacional
                  </p>
                  <p className={`text-xs mt-0.5 ${isPositivo ? "text-green-600" : "text-red-600"}`}>
                    Margem: {dre.margemOperacional.toFixed(1)}%
                  </p>
                </div>
                <p className={`text-2xl font-bold ${isPositivo ? "text-green-700" : "text-red-700"}`}>
                  {formatBRL(dre.resultadoOperacional)}
                </p>
              </div>
            </div>

            {regime === "competencia" && (
              <p className="text-xs text-gray-400 mt-3">
                * Despesas reconhecidas pela data de emissão da NF / data da compra.
                NFs com boletos ainda não pagos <strong>estão incluídas</strong>.
              </p>
            )}
            {regime === "caixa" && (
              <p className="text-xs text-gray-400 mt-3">
                * Despesas reconhecidas pela data de pagamento.
                NFs com boletos em aberto <strong>não são incluídas</strong> até o pagamento.
              </p>
            )}
          </div>
        </div>

        {/* Painel de indicadores */}
        <div className="space-y-4">
          {/* Resumo executivo */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Resumo Executivo</h3>
            <div className="space-y-3">
              {[
                { label: "Receita Bruta",       valor: dre.receitaBruta,          cor: "text-gray-900"   },
                { label: "DAS (estimado)",       valor: -dre.deducoesSimplesEst,   cor: "text-red-600"    },
                { label: "CMV",                  valor: -dre.cmv,                  cor: "text-red-700"    },
                { label: "Despesas Operac.",     valor: -dre.despesasOp,           cor: "text-red-700"    },
                { label: "Resultado Operac.",    valor: dre.resultadoOperacional,  cor: isPositivo ? "text-green-700" : "text-red-700" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-bold ${item.cor}`}>{formatBRL(item.valor)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Margem bruta</span>
                  <span className="text-sm font-bold text-gray-900">{dre.margemBruta.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Margem operacional</span>
                  <span className={`text-sm font-bold ${isPositivo ? "text-green-700" : "text-red-700"}`}>
                    {dre.margemOperacional.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Composição das despesas */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Composição das Despesas</h3>
            {dre.receitaBruta > 0 ? (
              <div className="space-y-2">
                {[
                  { label: "CMV", valor: dre.cmv, pct: dre.receitaBruta > 0 ? (dre.cmv/dre.receitaBruta)*100 : 0, color: "bg-orange-400" },
                  { label: "DAS", valor: dre.deducoesSimplesEst, pct: dre.receitaBruta > 0 ? (dre.deducoesSimplesEst/dre.receitaBruta)*100 : 0, color: "bg-red-400" },
                  { label: "Desp. Operac.", valor: dre.despesasOp, pct: dre.receitaBruta > 0 ? (dre.despesasOp/dre.receitaBruta)*100 : 0, color: "bg-yellow-400" },
                  { label: "Resultado", valor: Math.max(0, dre.resultadoOperacional), pct: dre.receitaBruta > 0 ? (Math.max(0,dre.resultadoOperacional)/dre.receitaBruta)*100 : 0, color: "bg-green-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="text-gray-700 font-medium">{item.pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Lance receitas para ver a composição</p>
            )}
          </div>

          {/* Nota DAS */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-yellow-800 mb-1">⚠️ DAS — Simples Nacional</p>
            <p className="text-xs text-yellow-700">
              O DAS é <strong>estimado automaticamente</strong> pela faixa de receita anual
              (Anexo I — Comércio). Para usar a alíquota exata do seu DAS, informe no campo
              "Alíquota DAS (%)" no filtro acima.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside { display: none !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
