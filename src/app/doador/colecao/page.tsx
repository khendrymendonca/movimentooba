"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Award, Info } from 'lucide-react';
import { getBadgeColors, calculateBadge, BadgeType } from '@/utils/donationRules';

export default function ColecaoDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUserProfile(profile);

      const { data: donations } = await supabase
        .from('donations')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('donation_date', { ascending: false });
        
      if (donations) setHistory(donations);

      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Carregando coleção...</p>
      </div>
    );
  }

  if (!userProfile) return null;

  // Lógica de Agrupamento por Ano para Selos
  const donationsByYear: Record<string, any[]> = {};
  history.forEach(d => {
    const year = new Date(d.donation_date).getFullYear().toString();
    if (!donationsByYear[year]) donationsByYear[year] = [];
    donationsByYear[year].push(d);
  });
  const availableYears = Object.keys(donationsByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="px-6 pt-10 pb-4 bg-slate-50 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coleção de Selos</h1>
        <p className="text-sm text-slate-500 mt-1">Sua trajetória como doador de sangue.</p>
      </div>

      <div className="px-6 pb-24 space-y-6">
        
        {availableYears.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
            <Award size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum selo ainda</h3>
            <p className="text-sm text-slate-500">Mantenha suas doações em dia para conquistar selos anuais exclusivos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {availableYears.map(year => {
              const count = donationsByYear[year].length;
              const badge: BadgeType = calculateBadge(userProfile.sex || 'Outro', count);

              if (badge === 'Nenhum') return null;

              let bgGradient = 'from-slate-100 to-slate-300';
              let textColor = 'text-slate-800';
              let ringColor = 'border-slate-200';
              
              if (badge === 'Bronze') { bgGradient = 'from-amber-700 to-amber-900'; textColor = 'text-amber-100'; ringColor = 'border-amber-800/20'; }
              if (badge === 'Prata') { bgGradient = 'from-slate-300 to-slate-500'; textColor = 'text-white'; ringColor = 'border-slate-400/20'; }
              if (badge === 'Ouro') { bgGradient = 'from-yellow-400 to-amber-500'; textColor = 'text-white'; ringColor = 'border-yellow-500/20'; }
              if (badge === 'Platina') { bgGradient = 'from-cyan-100 to-cyan-300'; textColor = 'text-cyan-900'; ringColor = 'border-cyan-200/50'; }
              if (badge === 'Rubi') { bgGradient = 'from-red-500 to-red-700'; textColor = 'text-white'; ringColor = 'border-red-600/20'; }
              if (badge === 'Pérola') { bgGradient = 'from-stone-100 to-stone-200'; textColor = 'text-stone-700'; ringColor = 'border-stone-200/50'; }
              if (badge === 'Diamante') { bgGradient = 'from-blue-200 to-blue-400'; textColor = 'text-blue-900'; ringColor = 'border-blue-300/50'; }

              return (
                <div key={year} className={`bg-white border ${ringColor} p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center`}>
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${bgGradient} ${textColor} shadow-lg border-[4px] border-white flex items-center justify-center flex-col leading-none mb-4`}>
                    <Award size={28} className="opacity-90" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">{year}</span>
                  <span className="text-base font-black text-slate-800 tracking-tight">{badge}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">{count} {count === 1 ? 'doação' : 'doações'}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Guia de Selos */}
        <div className="mt-10">
          <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">Selos que você pode conquistar</h3>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-wrap gap-4 justify-center">
              {(userProfile.sex === 'M' 
                ? [
                    { name: 'Bronze', req: 1, bg: 'from-amber-700 to-amber-900', text: 'text-amber-100', ring: 'border-amber-800/20' },
                    { name: 'Prata', req: 2, bg: 'from-slate-300 to-slate-500', text: 'text-white', ring: 'border-slate-400/20' },
                    { name: 'Ouro', req: 3, bg: 'from-yellow-400 to-amber-500', text: 'text-white', ring: 'border-yellow-500/20' },
                    { name: 'Platina', req: 4, bg: 'from-cyan-100 to-cyan-300', text: 'text-cyan-900', ring: 'border-cyan-200/50' }
                  ]
                : [
                    { name: 'Rubi', req: 1, bg: 'from-red-500 to-red-700', text: 'text-white', ring: 'border-red-600/20' },
                    { name: 'Pérola', req: 2, bg: 'from-stone-100 to-stone-200', text: 'text-stone-700', ring: 'border-stone-200/50' },
                    { name: 'Diamante', req: 3, bg: 'from-blue-200 to-blue-400', text: 'text-blue-900', ring: 'border-blue-300/50' }
                  ]
              ).map(badge => (
                <div key={badge.name} className="flex flex-col items-center w-[80px]">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${badge.bg} ${badge.text} shadow-sm border-[3px] border-white ring-1 ${badge.ring} flex items-center justify-center mb-2`}>
                    <Award size={20} className="opacity-90" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center">{badge.name}</span>
                  <span className="text-[9px] text-slate-500 text-center">{badge.req} {badge.req === 1 ? 'doação' : 'doações'}/ano</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
