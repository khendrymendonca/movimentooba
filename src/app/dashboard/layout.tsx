"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Heart,
  User,
  IdCard,
  Award,
  LayoutDashboard,
  Shirt,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function verifyAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "ADM" || profile.is_active === false) {
        router.replace("/");
        return;
      }

      setAuthorized(true);
    }

    verifyAdmin();
  }, [router, supabase]);

  if (!authorized) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mb-3"></div>
        <p className="text-xs text-slate-400 font-normal">
          Carregando ambiente...
        </p>
      </div>
    );
  }

  const bottomNavItems = [
    { href: "/doador", icon: Home, label: "Início" },
    { href: "/doador/doacoes", icon: Heart, label: "Doações" },
    { href: "/doador/carteirinha", icon: IdCard, label: "Carteirinha" },
    { href: "/doador/colecao", icon: Award, label: "Medalhas" },
    { href: "/doador/perfil", icon: User, label: "Perfil" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Gestão" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] flex flex-col">
      {/* Barra de Sub-Navegação Administrativa no Topo (Acesso rápido a todas as áreas) */}
      <div className="bg-slate-900 text-white px-3 py-2 sticky top-0 z-40 border-b border-slate-800 flex items-center justify-between overflow-x-auto print:hidden shadow-xs">
        <div className="flex items-center gap-1.5 min-w-max mx-auto">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            Visão Geral
          </Link>

          <Link
            href="/dashboard/camisas"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
              pathname === "/dashboard/camisas"
                ? "bg-red-600 text-white shadow-xs font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Shirt size={14} />
            <span>Camisas Oficiais</span>
          </Link>

          <Link
            href="/dashboard/membros"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              pathname === "/dashboard/membros"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            Membros
          </Link>

          <Link
            href="/dashboard/noticias"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              pathname === "/dashboard/noticias"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            Mural
          </Link>

          <Link
            href="/dashboard/apoio"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              pathname === "/dashboard/apoio"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            Apoio
          </Link>
        </div>
      </div>

      {/* Conteúdo Principal Mobile/Tablet (Idêntico ao DoadorLayout) */}
      <div className="flex-1 flex flex-col relative min-h-[100dvh]">
        <main className="flex-1 pb-24">
          <div className="max-w-2xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Barra de Navegação Inferior Fixa para Celulares e Tablets */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-slate-200/80 px-3 py-2 flex justify-between items-center z-50 print:hidden">
        {bottomNavItems.map((item) => {
          const isGestaoItem = item.href === "/dashboard";
          const isActive = isGestaoItem
            ? pathname.startsWith("/dashboard") && pathname !== "/dashboard/perfil"
            : pathname === item.href ||
              (item.href === "/doador/perfil" && pathname === "/dashboard/perfil");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 group flex-1 py-1"
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "text-red-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span
                className={`text-[10px] transition-colors ${
                  isActive ? "text-red-600 font-medium" : "text-slate-400 font-normal"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
