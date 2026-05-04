"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";

const EMPTY = {
  fornecedor: "", produto: "", categoria: "",
  valor: "", dataCompra: new Date().toISOString().slice(0, 10),
  dataVencimento: "", observacoes: "",
};

export default function NovaCompraButton() {
  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState({ ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [suggesting, setSugg]     = useState(false);
  const [error, setError]         = useState("");
  const router = useRouter();

  function set(k: keyof typeof EMPTY, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const suggestCategoria = useCallback(async (fornecedor: string, produto: string) => {
    if (!produto && !fornecedor) return;
    setSugg(true);
    try {
      const res = await fetch("/api/suggest-categoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fornecedor, descricao: produto }),
      });
      const json = await res.json();
      if (json.categoria) {
        setForm((p) => ({ ...p, categoria: json.categoria }));
      }
    } finally {
      setSugg(false);
    }
  }, []);

  async function handleSave() {
    if (!form.fornecedor || !form.produto || !form.valor || !form.dataCompra) {
      setError("Preencha fornecedor, produto, valor e data.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      fornecedor:     form.fornecedor,
      descricao:      form.produto,
      categoria:      form.categoria || "Outros",
      valor:          Number(form.valor),
      dataCompra:     form.dataCompra,
      dataVencimento: form.dataVencimento || null,
      observacoes:    form.observacoes || null,
    };

    const res = await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { setError("Erro ao salvar."); setSaving(false); return; }

    setSaving(false);
    setOpen(false);
    setForm({ ...EMPTY });
    router.refresh();
  }

  function handleClose() {
    setOpen(false);
    setForm({ ...EMPTY });
    setError("");
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        + Nova Compra
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Nova Compra sem NF</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Fornecedor *</label>
                <input
                  className="input"
                  placeholder="Ex: Hortifruti Central"
                  value={form.fornecedor}
                  onChange={(e) => set("fornecedor", e.target.value)}
                />
              </div>

              <div>
                <label className="label">Produto *</label>
                <input
                  className="input"
                  placeholder="Ex: Tomate, Frango, Detergente..."
                  value={form.produto}
                  onChange={(e) => set("produto", e.target.value)}
                  onBlur={() => suggestCategoria(form.fornecedor, form.produto)}
                />
                <p className="text-xs text-gray-400 mt-1">A categoria será sugerida automaticamente ao sair do campo</p>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  Categoria
                  {suggesting && (
                    <span className="text-xs text-brand-500 font-normal animate-pulse">sugerindo...</span>
                  )}
                </label>
                <select
                  className="input"
                  value={form.categoria}
                  onChange={(e) => set("categoria", e.target.value)}
                >
                  <option value="">Selecione ou aguarde sugestão</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Valor (R$) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={(e) => set("valor", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Data da Compra *</label>
                  <input
                    className="input"
                    type="date"
                    value={form.dataCompra}
                    onChange={(e) => set("dataCompra", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Vencimento (opcional)</label>
                <input
                  className="input"
                  type="date"
                  value={form.dataVencimento}
                  onChange={(e) => set("dataVencimento", e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Aparece na agenda de pagamentos do próximo mês</p>
              </div>

              <div>
                <label className="label">Observações</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={handleClose} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">Cancelar</button>
              <button onClick={handleSave} disabled={saving || suggesting}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .label { display: flex; font-size: 0.7rem; font-weight: 500; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .input { width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; outline: none; background: white; }
        .input:focus { border-color: #b86e20; box-shadow: 0 0 0 2px #faefd9; }
      `}</style>
    </>
  );
}
