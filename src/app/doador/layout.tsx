"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Heart, User, IdCard } from 'lucide-react';

export default function DoadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-[100dvh] bg-[#f8f9fa] flex justify-center">
      {/* Container Mobile */}
      <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Conteúdo Dinâmico das Rotas */}
        <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-100/50 px-4 py-3 flex justify-between items-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-50">
          
          <Link href="/doador" className="flex flex-col items-center gap-1 group w-16">
            <div className={`p-2 rounded-xl transition-all duration-300 ${pathname === '/doador' ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-red-400'}`}>
              <Home size={22} strokeWidth={pathname === '/doador' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-medium transition-colors ${pathname === '/doador' ? 'text-red-600' : 'text-slate-400'}`}>Início</span>
          </Link>

          <Link href="/doador/doacoes" className="flex flex-col items-center gap-1 group w-16">
            <div className={`p-2 rounded-xl transition-all duration-300 ${pathname === '/doador/doacoes' ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-red-400'}`}>
              <Heart size={22} strokeWidth={pathname === '/doador/doacoes' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-medium transition-colors ${pathname === '/doador/doacoes' ? 'text-red-600' : 'text-slate-400'}`}>Doações</span>
          </Link>

          <Link href="/doador/carteirinha" className="flex flex-col items-center gap-1 group w-16">
            <div className={`p-2 rounded-xl transition-all duration-300 ${pathname === '/doador/carteirinha' ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-red-400'}`}>
              <IdCard size={22} strokeWidth={pathname === '/doador/carteirinha' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-medium transition-colors ${pathname === '/doador/carteirinha' ? 'text-red-600' : 'text-slate-400'}`}>Carteirinha</span>
          </Link>

          <Link href="/doador/perfil" className="flex flex-col items-center gap-1 group w-16">
            <div className={`p-2 rounded-xl transition-all duration-300 ${pathname === '/doador/perfil' ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-red-400'}`}>
              <User size={22} strokeWidth={pathname === '/doador/perfil' ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-medium transition-colors ${pathname === '/doador/perfil' ? 'text-red-600' : 'text-slate-400'}`}>Perfil</span>
          </Link>

        </nav>

      </div>
    </div>
  );
}
