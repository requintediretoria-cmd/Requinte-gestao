"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";
import { formatBRL } from "@/lib/formatters";

interface Compra {
  id: number; fornecedor: string; descricao: string; categoria: string;
  valor: number; dataCompra: Date; dataVencimento: Date | null;
  status: string; observacoes: string | null;
}

export default function CompraActions({ compra }: { compra: Compra }) {
  const [menu, setMenu]     = useState(false);
  const [editOpen, setEdit] = useState(false);
  const [payOpen, setPay]   = useState(false);
  const [valorPago, setVP]  = useState(String(compra.valor));
  const [form, setForm]     = useState({
    fornecedor:     compra.fornecedor,
    descricao:      compra.descricao,
    categoria:      compra.categoria,
    valor:          String(compra.valor),
    dataCompra:     compra.dataCompra.toString().slice(0, 10),
    dataVencimento: compra.dataVencimento ? compra.dataVencimento.toString().slice(0, 10) : "",
    observacoes:    compra.observacoes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleEdit() {
    setSaving(true);
    await fetch(`/api/compras/${compra.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valor: Number(form.valor), dataVencimento: form.dataVencimento || null }),
    });
    setSaving(false);
    setEdit(false);
    router.refresh();
  }

  async function handlePay() {
    setSaving(true);
    await fetch(`/api/compras/${compra.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago", dataPagamento: new Date().toISOString(), valorPago: Number(valorPago) }),
    });
    setSaving(false);
    setPay(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Excluir esta compra?")) return;
    await fetch(`/api/compras/${compra.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="relative">
        <button onClick={() => setMenu(!menu)}
          className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded transition-colors text-lg leading-none">
          ⋯
        </button>
        {menu && (
          <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-40 py-1"
            onMouseLeave={() => setMenu(false)}>
            {compra.status !== "pago" && (
              <button onClick={() => { setPay(true); setMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Marcar pago
              </button>
            )}
            <button onClick={() => { setEdit(true); setMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Editar
            </button>
            <button onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Modal Pagar */}
      {payOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-72">
            <h3 className="font-semibold text-gray-900 mb-1">Confirmar Pagamento</h3>
            <p className="text-xs text-gray-500 mb-4">Original: {formatBRL(compra.valor)}</p>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Valor pago (R$)</label>
            <input type="number" step="0.01" value={valorPago} onChange={(e) => setVP(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setPay(false)} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
              <button onClick={handlePay} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-60">
                {saving ? "..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Editar Compra</h3>
              <button onClick={() => setEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              {([ ["fornecedor","Fornecedor","text"], ["descricao","Descrição","text"], ["valor","Valor (R$)","number"], ["dataCompra","Data","date"], ["dataVencimento","Vencimento","date"] ] as [keyof typeof form, string, string][]).map(([k, lbl, type]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{lbl}</label>
                  <input type={type} step={type === "number" ? "0.01" : undefined}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Categoria</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEdit(false)} className="text-sm text-gray-600 px-4 py-2">Cancelar</button>
              <button onClick={handleEdit} disabled={saving}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
