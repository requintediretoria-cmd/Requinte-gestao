"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/formatters";
import { CATEGORIAS } from "@/lib/categorias";

interface NFExtracted {
  numero: string; serie: string; chaveAcesso: string; dataEmissao: string;
  emitenteCNPJ: string; emitenteNome: string; emitenteUF: string;
  valorProdutos: number; valorFrete: number; valorDesconto: number; valorTotal: number;
  baseICMS: number; valorICMS: number; valorICMSST: number;
  baseIPI: number; valorIPI: number; valorPIS: number; valorCOFINS: number; valorDIFAL: number;
  itens: unknown[];
}

type Step = "idle" | "uploading" | "review" | "saving";

export default function UploadNFButton() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<{ extracted: NFExtracted; imagemPath: string; imagemNome: string } | null>(null);
  const [form, setForm] = useState<Partial<NFExtracted>>({});
  const [categoria, setCategoria] = useState("Outros");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function openPicker() {
    setError("");
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep("uploading");
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/extract/nf", { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok) { setError(json.error || "Erro na extração"); setStep("idle"); return; }

    setData(json);
    setForm(json.extracted);
    setStep("review");
    e.target.value = "";
  }

  function setField(key: keyof NFExtracted, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!data) return;
    setStep("saving");

    const payload = {
      ...data.extracted,
      ...form,
      categoria,
      imagemPath: data.imagemPath,
      imagemNome: data.imagemNome,
      valorProdutos:  Number(form.valorProdutos  ?? data.extracted.valorProdutos),
      valorFrete:     Number(form.valorFrete     ?? data.extracted.valorFrete),
      valorDesconto:  Number(form.valorDesconto  ?? data.extracted.valorDesconto),
      valorTotal:     Number(form.valorTotal     ?? data.extracted.valorTotal),
      baseICMS:       Number(form.baseICMS       ?? data.extracted.baseICMS),
      valorICMS:      Number(form.valorICMS      ?? data.extracted.valorICMS),
      valorICMSST:    Number(form.valorICMSST    ?? data.extracted.valorICMSST),
      valorIPI:       Number(form.valorIPI       ?? data.extracted.valorIPI),
      valorPIS:       Number(form.valorPIS       ?? data.extracted.valorPIS),
      valorCOFINS:    Number(form.valorCOFINS    ?? data.extracted.valorCOFINS),
      valorDIFAL:     Number(form.valorDIFAL     ?? data.extracted.valorDIFAL),
    };

    const res = await fetch("/api/notas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) { setError("Erro ao salvar"); setStep("review"); return; }

    setStep("idle");
    setData(null);
    setForm({});
    router.refresh();
  }

  function cancel() { setStep("idle"); setData(null); setForm({}); setError(""); }

  const f = form as NFExtracted;

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button onClick={openPicker} disabled={step === "uploading"}
        className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
        {step === "uploading" ? "Extraindo dados..." : "+ Nova Nota"}
      </button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {step === "review" && data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Confirmar dados extraídos</h3>
                <p className="text-xs text-gray-500 mt-0.5">Revise e corrija se necessário antes de salvar</p>
              </div>
              <button onClick={cancel} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Categoria da Compra</label>
                <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Número NF</label>
                  <input className="input" value={f.numero || ""} onChange={(e) => setField("numero", e.target.value)} />
                </div>
                <div>
                  <label className="label">Série</label>
                  <input className="input" value={f.serie || "1"} onChange={(e) => setField("serie", e.target.value)} />
                </div>
                <div>
                  <label className="label">Data Emissão</label>
                  <input className="input" type="date" value={f.dataEmissao?.slice(0, 10) || ""} onChange={(e) => setField("dataEmissao", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">Fornecedor (Emitente)</label>
                  <input className="input" value={f.emitenteNome || ""} onChange={(e) => setField("emitenteNome", e.target.value)} />
                </div>
                <div>
                  <label className="label">CNPJ</label>
                  <input className="input" value={f.emitenteCNPJ || ""} onChange={(e) => setField("emitenteCNPJ", e.target.value)} />
                </div>
              </div>

              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valores</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ["valorProdutos", "Produtos (R$)"],
                  ["valorFrete", "Frete (R$)"],
                  ["valorDesconto", "Desconto (R$)"],
                  ["valorTotal", "Total (R$)"],
                  ["valorICMS", "ICMS (R$)"],
                  ["valorICMSST", "ICMS-ST (R$)"],
                  ["valorIPI", "IPI (R$)"],
                  ["valorPIS", "PIS (R$)"],
                  ["valorCOFINS", "COFINS (R$)"],
                  ["valorDIFAL", "DIFAL (R$)"],
                ] as [keyof NFExtracted, string][]).map(([key, lbl]) => (
                  <div key={key}>
                    <label className="label">{lbl}</label>
                    <input className="input" type="number" step="0.01"
                      value={(f[key] as number) ?? 0}
                      onChange={(e) => setField(key, e.target.value)} />
                  </div>
                ))}
              </div>

              {data.extracted.itens?.length > 0 && (
                <>
                  <hr className="border-gray-100" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Itens ({data.extracted.itens.length} extraídos)
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-32 overflow-y-auto">
                    {(data.extracted.itens as Array<{ descricao: string; quantidade: number; valorTotal: number }>).map((item, i) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span>{item.descricao} × {item.quantidade}</span>
                        <span className="font-medium">{formatBRL(item.valorTotal)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={cancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={step === "saving"}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
                {step === "saving" ? "Salvando..." : "Salvar Nota Fiscal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .label { display: block; font-size: 0.7rem; font-weight: 500; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .input { width: 100%; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: #b86e20; box-shadow: 0 0 0 2px #faefd9; }
      `}</style>
    </>
  );
}
