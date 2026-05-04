"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BoletoStatusButton({
  boletoId, currentStatus, valor,
}: { boletoId: number; currentStatus: string; valor: number }) {
  const [open, setOpen] = useState(false);
  const [valorPago, setValorPago] = useState(String(valor));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (currentStatus === "pago") return <span className="text-xs text-gray-400">—</span>;

  async function markPaid() {
    setSaving(true);
    await fetch(`/api/boletos/${boletoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pago",
        dataPagamento: new Date().toISOString(),
        valorPago: Number(valorPago),
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs text-brand-700 hover:text-brand-900 font-medium border border-brand-300 hover:border-brand-500 px-3 py-1 rounded-lg transition-colors">
        Marcar pago
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <h3 className="font-semibold text-gray-900 mb-4">Confirmar Pagamento</h3>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Valor pago (R$)</label>
              <input type="number" step="0.01" value={valorPago} onChange={(e) => setValorPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Cancelar</button>
              <button onClick={markPaid} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-60">
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
