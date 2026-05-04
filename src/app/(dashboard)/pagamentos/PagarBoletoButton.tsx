"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/formatters";

export default function PagarBoletoButton({ boletoId, valor }: { boletoId: number; valor: number }) {
  const [open, setOpen] = useState(false);
  const [valorPago, setValorPago] = useState(String(valor));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function confirmar() {
    setSaving(true);
    await fetch(`/api/boletos/${boletoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago", dataPagamento: new Date().toISOString(), valorPago: Number(valorPago) }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs text-brand-700 hover:text-brand-900 font-medium mt-1 border border-brand-200 hover:border-brand-400 px-2 py-0.5 rounded transition-colors">
        Pagar
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-72">
            <h3 className="font-semibold text-gray-900 mb-1">Confirmar Pagamento</h3>
            <p className="text-xs text-gray-500 mb-4">Valor original: {formatBRL(valor)}</p>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Valor pago (R$)</label>
            <input type="number" step="0.01" value={valorPago} onChange={(e) => setValorPago(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
              <button onClick={confirmar} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-60">
                {saving ? "..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
