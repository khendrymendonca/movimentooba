"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  Calendar,
  PlusCircle,
  Heart,
  ChevronDown,
  Clock,
  CheckCircle2,
  HeartHandshake,
  Trash2,
} from 'lucide-react';
import {
  calculateNextDonationDate,
  calculateUpcomingEligibleDates,
  checkEligibilityForDate,
  getDonationIntervalDays,
  getMaxDonationsPerYear,
  GroupCampaign,
  parseSafeDate,
  validateNewDonation,
} from '@/utils/donationRules';
import { fetchGroupCampaigns, syncGlobalDonationsCount } from '@/lib/campaigns';

export default function DoacoesDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [{ data: profile }, { data: donations }, loadedCampaigns] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase
        .from('donations')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('donation_date', { ascending: false }),
      fetchGroupCampaigns(supabase),
    ]);

    setUserProfile(profile);
    if (donations) setHistory(donations);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCampaigns(
      loadedCampaigns.filter((c) => {
        const d = parseSafeDate(c.campaign_date);
        return d && d >= today;
      })
    );

    setLoading(false);
  }

  const syncProfileDates = async (updatedDonations: any[], profile: any) => {
    const latestDateStr = updatedDonations.length > 0 ? updatedDonations[0].donation_date : null;
    const nextDateObj = calculateNextDonationDate(profile.sex || 'M', latestDateStr);
    const nextDateStr = nextDateObj ? nextDateObj.toISOString().split('T')[0] : null;

    // Janela deslizante de 12 meses conforme regulamento:
    // Uma doação realizada em Julho só deixa de contar em Julho do ano seguinte.
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const countInRolling12Months = updatedDonations.filter((d) => {
      const parsed = parseSafeDate(d.donation_date);
      return parsed && parsed > oneYearAgo;
    }).length;

    await supabase
      .from('profiles')
      .update({
        last_donation_date: latestDateStr,
        next_donation_date: nextDateStr,
        donations_this_year: countInRolling12Months,
      })
      .eq('id', profile.id);
  };

  const handleRegisterDonation = async () => {
    setFeedback(null);
    if (!newDate) {
      setFeedback({ type: 'error', msg: 'Selecione a data da doação.' });
      return;
    }

    // Validação estrita de intervalo biológico e limite de 12 meses
    const validation = validateNewDonation(userProfile.sex, history, newDate);
    if (!validation.allowed) {
      setFeedback({
        type: 'error',
        msg: validation.reason || 'Você não pode registrar uma doação fora do período permitido.',
      });
      return;
    }

    setRegistering(true);
    const { error } = await supabase
      .from('donations')
      .insert({ profile_id: userProfile.id, donation_date: newDate });

    if (error) {
      setFeedback({
        type: 'error',
        msg: 'Não foi possível registrar a doação. Verifique suas permissões ou tente novamente.',
      });
    } else {
      const { data: updatedDonations } = await supabase
        .from('donations')
        .select('*')
        .eq('profile_id', userProfile.id)
        .order('donation_date', { ascending: false });

      if (updatedDonations) {
        await syncProfileDates(updatedDonations, userProfile);
      }

      setNewDate('');
      setFeedback({
        type: 'success',
        msg: 'Doação registrada com sucesso! Seu ciclo e próximas datas foram atualizados.',
      });
      syncGlobalDonationsCount(supabase);
      await loadData();
    }
    setRegistering(false);
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm('Deseja remover este registro de doação?')) return;
    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (!error) {
      const remaining = history.filter((d) => d.id !== id);
      await syncProfileDates(remaining, userProfile);
      syncGlobalDonationsCount(supabase);
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-4"></div>
      </div>
    );
  }

  const userSex = userProfile?.sex || 'M';
  const intervalDays = getDonationIntervalDays(userSex);
  const maxPerYear = getMaxDonationsPerYear(userSex);
  const latestDonationDate =
    history.length > 0 ? history[0].donation_date : userProfile?.last_donation_date;

  const eligibility = checkEligibilityForDate(userSex, latestDonationDate, new Date());
  const upcomingDates = calculateUpcomingEligibleDates(userSex, latestDonationDate, 3);

  const donationsByYear: Record<string, any[]> = {};
  history.forEach((d) => {
    const parsed = parseSafeDate(d.donation_date);
    const year = parsed ? parsed.getFullYear().toString() : 'Outros';
    if (!donationsByYear[year]) donationsByYear[year] = [];
    donationsByYear[year].push(d);
  });

  const availableYears = Object.keys(donationsByYear).sort((a, b) => Number(b) - Number(a));

  const filteredHistory = history.filter((d) => {
    const date = parseSafeDate(d.donation_date);
    if (!date) return false;
    const yearMatch = selectedYear === 'Todos' || date.getFullYear().toString() === selectedYear;
    const monthMatch =
      selectedMonth === 'Todos' || (date.getMonth() + 1).toString() === selectedMonth;
    return yearMatch && monthMatch;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fa] pb-12">
      {/* Topo Limpo e Sutil */}
      <div className="bg-white px-5 pt-8 pb-5 border-b border-slate-200/80 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Doações
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Intervalo biológico de {intervalDays} dias ({userSex === 'F' ? 'Mulheres' : 'Homens'})
            </p>
          </div>
          <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            Máx. {maxPerYear}x / ano
          </span>
        </div>

        {/* Card de Status Hoje */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mt-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-normal">Situação hoje</p>
            <p
              className={`text-base font-medium mt-0.5 ${
                eligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {eligibility.isEligible
                ? 'Apto para Doar'
                : `Aguardar ${eligibility.daysRemaining} dias`}
            </p>
          </div>
          <div className="text-right border-l border-slate-200 pl-4">
            <p className="text-xs text-slate-500 font-normal">Liberado a partir de</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {eligibility.nextEligibleDate
                ? eligibility.nextEligibleDate.toLocaleDateString('pt-BR')
                : 'Hoje'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-normal border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Registrar Doação */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
          {!newDate && !registering ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <PlusCircle size={16} className="text-red-600" /> Doou recentemente?
                </h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Atualize sua data para recalcular seu prazo.
                </p>
              </div>
              <button
                onClick={() => setNewDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-normal text-xs transition-colors shrink-0"
              >
                Registrar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-xs font-medium text-slate-800">
                Informe a data da doação realizada:
              </h2>
              <div className="flex gap-2">
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-normal"
                />
                <button
                  onClick={handleRegisterDonation}
                  disabled={registering || (Boolean(newDate) && !validateNewDonation(userProfile.sex, history, newDate).allowed)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-normal transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {registering ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => setNewDate('')}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-normal"
                >
                  Cancelar
                </button>
              </div>

              {/* Feedback em tempo real caso a data viole intervalo ou limite de 12 meses */}
              {newDate && !validateNewDonation(userProfile.sex, history, newDate).allowed && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed font-normal">
                  ⚠️ {validateNewDonation(userProfile.sex, history, newDate).reason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Simulador de Próximas Datas Individuais (60d Homem / 120d Mulher) */}
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
            Suas Próximas Janelas de Doação ({intervalDays} em {intervalDays} dias)
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {upcomingDates.map((d, index) => (
              <div
                key={index}
                className={`p-3 rounded-2xl border text-center ${
                  index === 0
                    ? 'bg-white border-red-200 shadow-sm'
                    : 'bg-white/70 border-slate-200/70'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-1">
                  {index === 0 ? '1ª Janela' : `${index + 1}ª Janela`}
                </span>
                <span className="text-xs font-black text-slate-900 block">
                  {d.toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Compatibilidade com as Próximas Doações em Massa do Grupo */}
        {campaigns.length > 0 && (
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
              <HeartHandshake size={15} className="text-red-500" />
              Datas das Doações em Massa do Grupo
            </h2>
            <div className="space-y-2.5">
              {campaigns.map((camp) => {
                const check = checkEligibilityForDate(
                  userSex,
                  latestDonationDate,
                  camp.campaign_date
                );
                const dObj = parseSafeDate(camp.campaign_date);
                return (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{camp.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {dObj ? dObj.toLocaleDateString('pt-BR') : camp.campaign_date} •{' '}
                        {camp.location}
                      </p>
                    </div>
                    {check.isEligible ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={12} /> Você pode ir!
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                        <Clock size={12} /> Em pausa ({check.daysRemaining}d)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico com Filtros */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Seu Histórico ({history.length})
            </h2>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:border-red-400"
                >
                  <option value="Todos">Mês</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-2 text-slate-400 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:border-red-400"
                >
                  <option value="Todos">Ano</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 border border-slate-100 border-dashed rounded-3xl">
              <p className="text-sm text-slate-400 font-medium">Nenhuma doação registrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((donation) => {
                const parsed = parseSafeDate(donation.donation_date);
                return (
                  <div
                    key={donation.id}
                    className="bg-white p-4 rounded-2xl border border-red-50 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-red-200 transition-colors"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-l-2xl"></div>
                    <div className="pl-3">
                      <p className="text-base font-black text-slate-800 tracking-tight">
                        {parsed
                          ? parsed.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })
                          : donation.donation_date}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Doação voluntária registrada
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDonation(donation.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      title="Remover registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
