"use client";

import { useEffect, useState } from 'react';
import { Users, CreditCard, AlertCircle, FileText, Droplets } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    doadoresAtivos: 0,
    carteirinhasPendentes: 0,
    novosMembros: 0,
    guias: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      // Puxa total de doadores ativos (Role = User e is_active = true)
      const { count: doadoresCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'User')
        .eq('is_active', true);

      // Puxa novos membros (cadastrados nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: novosMembrosCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Carteirinhas com status diferente de Ativa
      const { count: pendentesCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Ativa');

      // Total de guias
      const { count: guiasCount } = await supabase
        .from('donation_guides')
        .select('*', { count: 'exact', head: true });

      setStats({
        doadoresAtivos: doadoresCount || 0,
        carteirinhasPendentes: pendentesCount || 0,
        novosMembros: novosMembrosCount || 0,
        guias: guiasCount || 0
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
      Sincronizando métricas...
    </div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"></div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Droplets className="text-red-500" /> Visão Geral
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Acompanhe as métricas principais e atividades recentes do projeto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border-t-4 border-t-red-500 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Doadores Ativos</h3>
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-inner">
              <Users size={22} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats.doadoresAtivos.toLocaleString('pt-BR')}</div>
          <div className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1 relative z-10">Membros aptos</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-t-4 border-t-amber-500 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Cartões Pendentes</h3>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
              <AlertCircle size={22} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats.carteirinhasPendentes.toLocaleString('pt-BR')}</div>
          <div className="text-sm text-amber-600 font-bold mt-2 relative z-10">Aguardando aprovação</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-t-4 border-t-emerald-500 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Novos Membros</h3>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
              <FileText size={22} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats.novosMembros.toLocaleString('pt-BR')}</div>
          <div className="text-sm text-emerald-600 font-bold mt-2 relative z-10">Nos últimos 30 dias</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-t-4 border-t-blue-500 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Guias Ativos</h3>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
              <CreditCard size={22} />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 relative z-10">{stats.guias.toLocaleString('pt-BR')}</div>
          <div className="text-sm text-slate-500 font-bold mt-2 relative z-10">Prontos para doadores</div>
        </div>
      </div>
    </div>
  );
}
