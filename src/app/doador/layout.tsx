"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Heart, User, IdCard } from 'lucide-react';
import Image from 'next/image';

export default function DoadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/doador', icon: Home, label: 'Início' },
    { href: '/doador/doacoes', icon: Heart, label: 'Doações' },
    { href: '/doador/carteirinha', icon: IdCard, label: 'Carteirinha' },
    { href: '/doador/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] flex flex-col md:flex-row">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shadow-sm fixed h-full z-40">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <Image src="/logo.png" alt="O Bom Amigo" width={32} height={32} className="object-contain" />
          <span className="font-bold text-lg tracking-tight text-slate-800">O Bom Amigo</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50 hover:text-red-500'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 relative min-h-[100dvh]">
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-100/50 px-4 py-3 flex justify-between items-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group w-16">
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-red-600 scale-110' : 'text-slate-400 group-hover:text-red-400'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-red-600' : 'text-slate-400'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
