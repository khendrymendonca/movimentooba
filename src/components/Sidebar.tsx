import Link from 'next/link';
import { Users, CreditCard, Info, LayoutDashboard } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-red-100 text-slate-700 flex flex-col min-h-screen">
      <div className="p-6 border-b border-red-50">
        <h2 className="text-xs font-bold tracking-widest text-red-800/60 uppercase">Menu Principal</h2>
      </div>
      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-2">
          <li>
            <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-medium transition-colors">
              <LayoutDashboard size={20} strokeWidth={2.5} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/membros" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50/50 hover:text-red-700 rounded-xl font-medium transition-colors">
              <Users size={20} strokeWidth={2} />
              <span>Membros</span>
            </Link>
          </li>
          <li>
            <Link href="/carteirinhas" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50/50 hover:text-red-700 rounded-xl font-medium transition-colors">
              <CreditCard size={20} strokeWidth={2} />
              <span>Carteirinhas</span>
            </Link>
          </li>
          <li>
            <Link href="/guia" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50/50 hover:text-red-700 rounded-xl font-medium transition-colors">
              <Info size={20} strokeWidth={2} />
              <span>Guia para Doação</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
