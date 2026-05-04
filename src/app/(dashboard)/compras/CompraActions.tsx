"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";

interface Compra {
  id: number; fornecedor: string; descricao: string; categoria: string;
  valor: number; dataCompra: Date; observacoes: string | null;
}

export default function CompraActions({ compra }: { compra: Compra }) {
  const [menu, setMenu]     = useState(false);
  const [editOpen, setEdit] = useState(false);
  const [form, setForm]     = useState({
    fornecedor:  compra.fornecedor,
    descricao:   compra.descricao,
    categoria:   compra.categoria,
    valor:       String(compra.valor),
    dataCompra:  compra.dataCompra.toString().slice(0, 10),
    observacoes: compra.observacoes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleEdit() {
    setSaving(true);
    await fetch(`/api/compras/${compra.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valor: Number(form.valor) }),
    });
    setSaving(false);
    setEdit(false);
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
          <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-36 py-1"
            onMouseLeave={() => setMenu(false)}>
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

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Editar Compra</h3>
              <button onClick={() => setEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              {([
                ["fornecedor", "Fornecedor", "text"],
                ["descricao",  "Produto",    "text"],
                ["valor",      "Valor (R$)", "number"],
                ["dataCompra", "Data",       "date"],
              ] as [keyof typeof form, string, string][]).map(([k, lbl, type]) => (
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
