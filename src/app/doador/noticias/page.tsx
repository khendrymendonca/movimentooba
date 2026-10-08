"use client";

import { Bell, ChevronRight, Newspaper } from "lucide-react";

export default function NoticiasDoador() {
  // Dados mockados por enquanto (serão puxados da tabela news)
  const feed = [
    {
      id: 1,
      title: "Campanha de Inverno 2026",
      excerpt: "Com a chegada do frio, os estoques caem. Venha doar e ganhe uma manta exclusiva!",
      date: "05 Out, 2026",
      readTime: "2 min",
      image: "bg-blue-100 text-blue-500"
    },
    {
      id: 2,
      title: "Como se preparar para a sua doação",
      excerpt: "Dicas de alimentação e descanso para você ter uma experiência perfeita.",
      date: "28 Set, 2026",
      readTime: "4 min",
      image: "bg-amber-100 text-amber-500"
    },
    {
      id: 3,
      title: "Novo sistema de Selos e Gamificação",
      excerpt: "Agora suas doações valem selos de Ouro, Platina e Diamante no seu perfil.",
      date: "15 Set, 2026",
      readTime: "3 min",
      image: "bg-purple-100 text-purple-500"
    }
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Novidades</h1>
          <p className="text-sm text-slate-500 mt-1">Fique por dentro das atualizações.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 relative cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
      </div>

      <div className="px-6 py-4 flex-1">
        <div className="space-y-4">
          {feed.map((item) => (
            <article key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex gap-4">
                <div className={`w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center ${item.image}`}>
                  <Newspaper size={28} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.date}</span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] font-medium text-slate-400">{item.readTime} leitura</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Você chegou ao fim</p>
        </div>
      </div>
    </div>
  );
}
