"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Users,
  LayoutDashboard,
  User,
  Newspaper,
  X,
  IdCard,
  Award,
  Heart,
  LifeBuoy,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-slate-900 text-white shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200/80 flex flex-col h-full fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } overflow-hidden print:hidden`}
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between lg:justify-center relative">
        <div className="flex flex-col items-center w-full">
          <Image
            src="/logo.png"
            alt="Logo O Bom Amigo"
            width={100}
            height={100}
            className="object-contain"
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        <div>
          <p className="px-4 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Gestão do Projeto
          </p>
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className={getLinkClass('/dashboard')} onClick={onClose}>
                <LayoutDashboard size={18} strokeWidth={2} />
                <span>Visão Geral & Canva</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/membros"
                className={getLinkClass('/dashboard/membros')}
                onClick={onClose}
              >
                <Users size={18} strokeWidth={2} />
                <span>Membros & Cartões</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/noticias"
                className={getLinkClass('/dashboard/noticias')}
                onClick={onClose}
              >
                <Newspaper size={18} strokeWidth={2} />
                <span>Mural de Notícias</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/apoio"
                className={getLinkClass('/dashboard/apoio')}
                onClick={onClose}
              >
                <LifeBuoy size={18} strokeWidth={2} />
                <span>Apoio & Chamados</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="px-4 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Minha Área de Doador
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/doador/carteirinha"
                className={getLinkClass('/doador/carteirinha')}
                onClick={onClose}
              >
                <IdCard size={18} strokeWidth={2} />
                <span>Minha Carteirinha</span>
              </Link>
            </li>
            <li>
              <Link
                href="/doador/doacoes"
                className={getLinkClass('/doador/doacoes')}
                onClick={onClose}
              >
                <Heart size={18} strokeWidth={2} />
                <span>Minhas Doações</span>
              </Link>
            </li>
            <li>
              <Link
                href="/doador/colecao"
                className={getLinkClass('/doador/colecao')}
                onClick={onClose}
              >
                <Award size={18} strokeWidth={2} />
                <span>Minhas Medalhas</span>
              </Link>
            </li>
            <li>
              <Link
                href="/doador/apoio"
                className={getLinkClass('/doador/apoio')}
                onClick={onClose}
              >
                <LifeBuoy size={18} strokeWidth={2} />
                <span>Apoio & Chamados</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-3.5 border-t border-slate-100 flex flex-col gap-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-normal transition-colors"
        >
          Ver Site Público
        </Link>
        <Link
          href="/dashboard/perfil"
          className={getLinkClass('/dashboard/perfil')}
          onClick={onClose}
        >
          <User size={18} strokeWidth={2} />
          <span className="flex-1">Meu Perfil</span>
        </Link>
      </div>
    </aside>
  );
}
