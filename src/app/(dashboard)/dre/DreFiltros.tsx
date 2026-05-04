"use client";
import { useRouter } from "next/navigation";

interface Props {
  mesSelecionado:  number;
  anoSelecionado:  number;
  regimeSelecionado: "caixa" | "competencia";
  aliquota: string;
}

export default function DreFiltros({ mesSelecionado, anoSelecionado, regimeSelecionado, aliquota }: Props) {
  const router = useRouter();

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const anos  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  function navegar(mes: number, ano: number, regime: string, aliq: string) {
    const params = new URLSearchParams({ mes: String(mes), ano: String(ano), regime });
    if (aliq) params.set("aliquota", aliq);
    router.push(`/dre?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select value={mesSelecionado}
        onChange={(e) => navegar(Number(e.target.value), anoSelecionado, regimeSelecionado, aliquota)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white">
        {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
      </select>

      <select value={anoSelecionado}
        onChange={(e) => navegar(mesSelecionado, Number(e.target.value), regimeSelecionado, aliquota)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white">
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {(["competencia","caixa"] as const).map((r) => (
          <button key={r}
            onClick={() => navegar(mesSelecionado, anoSelecionado, r, aliquota)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              regimeSelecionado === r
                ? r === "caixa" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}>
            {r === "caixa" ? "Caixa" : "Competência"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 whitespace-nowrap">Alíquota DAS (%):</label>
        <input
          type="number" step="0.1" min="0" max="100"
          placeholder="auto"
          defaultValue={aliquota}
          className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          onBlur={(e) => navegar(mesSelecionado, anoSelecionado, regimeSelecionado, e.target.value)}
        />
      </div>
    </div>
  );
}
