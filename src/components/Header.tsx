"use client";
import { useSession } from "next-auth/react";

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { data: session } = useSession();
  const now = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
        <p className="text-xs text-gray-400 capitalize">{now}</p>
      </div>
    </header>
  );
}
