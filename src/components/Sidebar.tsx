"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard",  label: "Dashboard",      icon: "⊞" },
  { href: "/receitas",   label: "Receitas",       icon: "💰" },
  { href: "/notas",      label: "Notas Fiscais",  icon: "📄" },
  { href: "/boletos",    label: "Boletos",        icon: "🏦" },
  { href: "/compras",    label: "Compras s/ NF",  icon: "🛒" },
  { href: "/pagamentos", label: "Pagamentos",     icon: "📅" },
  { href: "/dre",        label: "DRE",            icon: "📈" },
  { href: "/relatorio",  label: "Relatório",      icon: "📊" },
  { href: "/tributos",   label: "Tributos",       icon: "⚖️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-brand-800 text-white flex flex-col z-10">
      <div className="px-6 py-5 border-b border-brand-700">
        <p className="text-xs font-medium uppercase tracking-widest text-brand-300">Restaurante</p>
        <h1 className="text-xl font-bold text-white mt-0.5">Requinte</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-brand-200 hover:bg-brand-700 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-brand-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-300 hover:bg-brand-700 hover:text-white transition-colors"
        >
          <span>↩</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
