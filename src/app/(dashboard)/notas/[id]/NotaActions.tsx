"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statusOptions = [
  { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { value: "paga",     label: "Paga",     color: "bg-green-100 text-green-800" },
  { value: "vencida",  label: "Vencida",  color: "bg-red-100 text-red-800" },
];

export default function NotaActions({ notaId, currentStatus }: { notaId: number; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setSaving(true);
    await fetch(`/api/notas/${notaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
    router.refresh();
  }

  const current = statusOptions.find((s) => s.value === status);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">Status atual</p>
      <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${current?.color}`}>
        {current?.label}
      </span>
      <div className="flex flex-col gap-2 mt-3">
        {statusOptions.filter((s) => s.value !== status).map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateStatus(opt.value)}
            disabled={saving}
            className="text-sm text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors disabled:opacity-50"
          >
            Marcar como {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
