"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FORMAS_PAGAMENTO } from "@/lib/categorias";

const EMPTY = {
  data:           new Date().toISOString().slice(0, 10),
  valor:          "",
  descricao:      "",
  formaPagamento: "Dinheiro",
};

export default function NovaReceitaButton() {
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const router = useRouter();

  function set(k: keyof typeof EMPTY, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.valor || !form.data) { setError("Preencha data e valor."); return; }
    setSaving(true);
    setError("");

    const res = await fetch("/api/receitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valor: Number(form.valor) }),
    });

    if (!res.ok) { setError("Erro ao salvar."); setSaving(false); return; }

    setSaving(false);
    setOpen(false);
    setForm({ ...EMPTY });
    router.refresh();
  }

  function handleClose() { setOpen(false); setForm({ ...EMPTY }); setError(""); }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        + Nova Receita
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Lançar Receita</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input className="input" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor (R$) *</label>
                  <input className="input" type="number" step="0.01" placeholder="0,00"
                    value={form.valor} onChange={(e) => set("valor", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Forma de Pagamento</label>
                <select className="input" value={form.formaPagamento} onChange={(e) => set("formaPagamento", e.target.value)}>
                  {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Descrição (opcional)</label>
                <input className="input" placeholder="Ex: Vendas do almoço"
                  value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={handleClose} className="text-sm text-gray-600 px-4 py-2">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60">
                {saving ? "Salvando..." : "Lançar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .label { display: block; font-size: 0.7rem; font-weight: 500; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .input { width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; outline: none; background: white; }
        .input:focus { border-color: #b86e20; box-shadow: 0 0 0 2px #faefd9; }
      `}</style>
    </>
  );
}
