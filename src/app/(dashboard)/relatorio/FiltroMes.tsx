"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function FiltroMes({ mesSelecionado, anoSelecionado }: { mesSelecionado: number; anoSelecionado: number }) {
  const router = useRouter();

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  function navegar(mes: number, ano: number) {
    router.push(`/relatorio?mes=${mes}&ano=${ano}`);
  }

  return (
    <div className="flex items-center gap-3 no-print">
      <select
        value={mesSelecionado}
        onChange={(e) => navegar(Number(e.target.value), anoSelecionado)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
      >
        {meses.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={anoSelecionado}
        onChange={(e) => navegar(mesSelecionado, Number(e.target.value))}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
      >
        {anos.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}
