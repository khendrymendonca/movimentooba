"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Heart, User, IdCard, Award, Smartphone, ArrowLeft, ShieldAlert, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabase';

export default function DoadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkViewport = () => {
        setIsMobileOrTablet(window.innerWidth <= 1024);
      };
      checkViewport();
      window.addEventListener('resize', checkViewport);
      return () => window.removeEventListener('resize', checkViewport);
    }
  }, []);

  useEffect(() => {
    async function verifySession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', session.user.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }

      if (profile?.role === 'ADM') {
        setIsAdmin(true);
      }

      setCheckingAuth(false);
    }
    verifySession();
  }, [router, supabase]);

  const navItems = [
    { href: '/doador', icon: Home, label: 'Início' },
    { href: '/doador/doacoes', icon: Heart, label: 'Doações' },
    { href: '/doador/carteirinha', icon: IdCard, label: 'Carteirinha' },
    { href: '/doador/colecao', icon: Award, label: 'Medalhas' },
    { href: '/doador/perfil', icon: User, label: 'Perfil' },
    ...(isAdmin ? [{ href: '/dashboard', icon: LayoutDashboard, label: 'Gestão' }] : []),
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mb-3"></div>
        <p className="text-xs text-slate-400 font-normal">
          Carregando ambiente...
        </p>
      </div>
    );
  }

  // Bloqueio para desktop apenas para não-administradores
  if (!isMobileOrTablet && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/30">
            <Smartphone size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3">
            <ShieldAlert size={14} /> Proteção de Dispositivo Ativa
          </div>
          <h1 className="text-2xl font-extrabold mb-3">
            Área Exclusiva para Celular e Tablet
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            A Área de Membros do Doador foi projetada para uso exclusivo em dispositivos móveis (telas de tablet ou menores). Acesse pelo seu celular para visualizar sua Carteirinha Digital e seus prazos de doação.
          </p>

          <div className="bg-white p-5 rounded-3xl inline-flex flex-col items-center mb-6 shadow-inner">
            <QRCode
              value={typeof window !== 'undefined' ? window.location.href : 'https://movimentooba.vercel.app/doador'}
              size={140}
              fgColor="#0f172a"
              bgColor="transparent"
            />
            <span className="text-[10px] font-extrabold text-slate-500 mt-3 uppercase tracking-widest">
              Abra a câmera do seu celular
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar para o Site Institucional
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] flex flex-col">
      {/* Conteúdo Principal Mobile/Tablet */}
      <div className="flex-1 flex flex-col relative min-h-[100dvh]">
        <main className="flex-1 pb-24">
          <div className="max-w-2xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Barra de Navegação Inferior Fixa para Celulares e Tablets */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-slate-200/80 px-3 py-2 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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
                    ? 'text-red-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span
                className={`text-[10px] transition-colors ${
                  isActive ? 'text-red-600 font-medium' : 'text-slate-400 font-normal'
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
