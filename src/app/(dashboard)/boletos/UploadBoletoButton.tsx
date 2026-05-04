"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface BoletoExtracted {
  beneficiario: string;
  valor: number;
  dataVencimento: string;
  linhaDigitavel: string;
  codigoBarras: string;
}

type Step = "idle" | "uploading" | "review" | "saving";

export default function UploadBoletoButton() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<{ extracted: BoletoExtracted; imagemPath: string; imagemNome: string } | null>(null);
  const [form, setForm] = useState<Partial<BoletoExtracted>>({});
  const [notaFiscalId, setNotaFiscalId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep("uploading");
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/extract/boleto", { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok) { setError(json.error || "Erro na extração"); setStep("idle"); return; }

    setData(json);
    setForm(json.extracted);
    setStep("review");
    e.target.value = "";
  }

  function setField(key: keyof BoletoExtracted, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!data) return;
    setStep("saving");

    const f = form as BoletoExtracted;
    const payload = {
      beneficiario: f.beneficiario,
      valor: Number(f.valor),
      dataVencimento: f.dataVencimento,
      linhaDigitavel: f.linhaDigitavel || null,
      codigoBarras: f.codigoBarras || null,
      imagemPath: data.imagemPath,
      imagemNome: data.imagemNome,
      notaFiscalId: notaFiscalId ? Number(notaFiscalId) : null,
    };

    const res = await fetch("/api/boletos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) { setError("Erro ao salvar"); setStep("review"); return; }

    setStep("idle");
    setData(null);
    setForm({});
    setNotaFiscalId("");
    router.refresh();
  }

  function cancel() { setStep("idle"); setData(null); setForm({}); setError(""); }

  const f = form as BoletoExtracted;

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current?.click()} disabled={step === "uploading"}
        className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
        {step === "uploading" ? "Extraindo..." : "+ Novo Boleto"}
      </button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {step === "review" && data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Confirmar dados do Boleto</h3>
              <button onClick={cancel} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Beneficiário</label>
                <input className="input" value={f.beneficiario || ""} onChange={(e) => setField("beneficiario", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Valor (R$)</label>
                  <input className="input" type="number" step="0.01" value={f.valor || ""} onChange={(e) => setField("valor", e.target.value)} />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input className="input" type="date" value={f.dataVencimento?.slice(0, 10) || ""} onChange={(e) => setField("dataVencimento", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Linha Digitável</label>
                <input className="input font-mono text-xs" value={f.linhaDigitavel || ""} onChange={(e) => setField("linhaDigitavel", e.target.value)} />
              </div>
              <div>
                <label className="label">Número da NF vinculada (opcional)</label>
                <input className="input" type="number" placeholder="ID da NF" value={notaFiscalId}
                  onChange={(e) => setNotaFiscalId(e.target.value)} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={cancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button onClick={handleSave} disabled={step === "saving"}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60">
                {step === "saving" ? "Salvando..." : "Salvar Boleto"}
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
