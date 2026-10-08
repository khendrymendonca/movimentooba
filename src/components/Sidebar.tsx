"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, User, Palette, Info, Newspaper } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20 translate-x-1' 
        : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
    }`;
  };

  return (
    <aside className="w-64 bg-white border-r border-red-100 flex flex-col min-h-screen relative overflow-hidden">
      {/* Detalhe de cor abstrato no fundo da sidebar */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-50 to-transparent -z-10"></div>
      
      <div className="p-6 border-b border-red-50/50 flex flex-col items-center justify-center relative">
        <Image 
          src="/logo.png" 
          alt="Logo O Bom Amigo" 
          width={140} 
          height={140} 
          className="object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <nav className="flex-1 py-6 px-3 z-10">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              <LayoutDashboard size={20} strokeWidth={2.5} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/membros" className={getLinkClass('/dashboard/membros')}>
              <Users size={20} strokeWidth={2} />
              <span>Membros</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/noticias" className={getLinkClass('/dashboard/noticias')}>
              <Newspaper size={20} strokeWidth={2} />
              <span>Mural de Notícias</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/design-carteirinha" className={getLinkClass('/dashboard/design-carteirinha')}>
              <Palette size={20} strokeWidth={2} />
              <span>Design Carteirinha</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/guia" className={getLinkClass('/dashboard/guia')}>
              <Info size={20} strokeWidth={2} />
              <span>Guia para Doação</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-red-50/50 flex flex-col gap-2 bg-gradient-to-t from-red-50/30 to-transparent z-10">
        <Link href="/doador" className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 rounded-xl font-medium transition-all shadow-sm">
          Ver como Doador
        </Link>
        <Link href="/dashboard/perfil" className={getLinkClass('/dashboard/perfil')}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${pathname === '/dashboard/perfil' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
            <User size={16} strokeWidth={2.5} />
          </div>
          <span className="flex-1">Meu Perfil</span>
        </Link>
      </div>
    </aside>
  );
}
