"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Calendar, Activity, PlusCircle, Heart, ChevronDown, Award } from 'lucide-react';
import { calculateBadge, getBadgeColors, BadgeType } from '@/utils/donationRules';

export default function DoacoesDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [newDate, setNewDate] = useState('');
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setUserProfile(profile);

    const { data: donations } = await supabase.from('donations').select('*').eq('profile_id', session.user.id).order('donation_date', { ascending: false });
    if (donations) setHistory(donations);
    
    setLoading(false);
  }

  const handleRegisterDonation = async () => {
    if (!newDate) return alert("Selecione a data da doação.");
    setRegistering(true);
    const { error } = await supabase.from('donations').insert({ profile_id: userProfile.id, donation_date: newDate });
    if (error) alert("Erro: " + error.message);
    else {
      alert("Doação registrada!");
      setNewDate('');
      await loadData();
    }
    setRegistering(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32 bg-red-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      </div>
    );
  }

  const isApto = userProfile?.is_active && (!userProfile?.next_donation_date || new Date(userProfile.next_donation_date) <= new Date());

  // Lógica de Agrupamento por Ano para Selos e Histórico
  const donationsByYear: Record<string, any[]> = {};
  history.forEach(d => {
    const year = new Date(d.donation_date).getFullYear().toString();
    if (!donationsByYear[year]) donationsByYear[year] = [];
    donationsByYear[year].push(d);
  });

  const availableYears = Object.keys(donationsByYear).sort((a, b) => Number(b) - Number(a));

  // Lógica de Filtro
  const filteredHistory = history.filter(d => {
    const date = new Date(d.donation_date);
    const yearMatch = selectedYear === 'Todos' || date.getFullYear().toString() === selectedYear;
    const monthMatch = selectedMonth === 'Todos' || (date.getMonth() + 1).toString() === selectedMonth;
    return yearMatch && monthMatch;
  });

  return (
    <div className="flex flex-col min-h-full bg-white pb-12">
      
      {/* Header Red Style */}
      <div className="bg-red-600 px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500 rounded-full opacity-50 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Doações</h1>
          <p className="text-red-100 text-sm mt-1 opacity-90">Sua jornada salvando vidas.</p>
        </div>

        {/* Card de Status Suspenso */}
        <div className="bg-white rounded-3xl p-5 shadow-xl mt-6 flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Atual</p>
            <p className={`text-lg font-black tracking-tight ${isApto ? 'text-emerald-600' : 'text-red-600'}`}>
              {isApto ? 'Apto para Doar' : 'Aguardando Prazo'}
            </p>
          </div>
          <div className="text-right border-l border-slate-100 pl-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Próxima Data</p>
            <p className="text-base font-bold text-slate-800">
              {userProfile.next_donation_date ? new Date(userProfile.next_donation_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Liberado!'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-10">

        {/* Botão Registrar Doação */}
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100 relative overflow-hidden">
          <Heart className="absolute -right-4 -bottom-4 text-red-100/50 w-32 h-32" />
          
          {!newDate && !registering ? (
            <div className="relative z-10 flex flex-col items-start gap-3">
              <h2 className="text-sm font-bold text-red-900 flex items-center gap-2">
                <PlusCircle size={18} className="text-red-600" /> Adicionar nova doação
              </h2>
              <button 
                onClick={() => setNewDate(new Date().toISOString().split('T')[0])}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-sm text-sm"
              >
                Registrar Doação
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-start gap-3 w-full">
              <h2 className="text-sm font-bold text-red-900 flex items-center gap-2">
                <Calendar size={18} className="text-red-600" /> Data da Doação
              </h2>
              <div className="flex gap-2 w-full">
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-slate-900 text-sm font-medium"
                />
                <button 
                  onClick={handleRegisterDonation}
                  disabled={registering}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-sm disabled:opacity-70"
                >
                  Salvar
                </button>
              </div>
              <button 
                onClick={() => setNewDate('')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 mt-1 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Histórico com Filtros */}
        <div>
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Histórico</h2>
            
            <div className="flex gap-2">
              <div className="relative">
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:border-red-400"
                >
                  <option value="Todos">Mês</option>
                  {Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:border-red-400"
                >
                  <option value="Todos">Ano</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 border border-slate-100 border-dashed rounded-3xl">
              <p className="text-sm text-slate-400 font-medium">Nenhuma doação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((donation, idx) => (
                <div key={donation.id} className="bg-white p-5 rounded-3xl border border-red-50 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-red-200 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-l-3xl"></div>
                  <div className="pl-2">
                    <p className="text-lg font-black text-slate-800 tracking-tight">
                      {new Date(donation.donation_date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).replace(' de ', '/')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
