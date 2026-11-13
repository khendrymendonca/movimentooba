"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ArrowLeft,
  Sparkles,
  Heart,
  Shield,
  Star,
  Award,
  Crown,
  CheckCircle2,
  Calendar,
  X,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { parseSafeDate, formatSafeDate, GroupCampaign } from '@/utils/donationRules';
import {
  fetchGroupCampaigns,
  fetchUserSpecialBadges,
  UserSpecialBadges,
} from '@/lib/campaigns';

interface AnnualBadgeConfig {
  order: number; // 1, 2, 3, 4
  name: string;
  title: string;
  subtitle: string;
  description: string;
  bgGradient: string;
  borderColor: string;
  shadowColor: string;
  iconColor: string;
  IconComponent: React.ComponentType<{ size?: number; className?: string }>;
}

interface SpecialBadgeModalData {
  title: string;
  subtitle: string;
  description: string;
  bgGradient: string;
  borderColor: string;
  iconColor: string;
  IconComponent: React.ComponentType<{ size?: number; className?: string }>;
  isUnlocked: boolean;
  unlockedDate?: string;
  actionText?: string;
}

// 4 Medalhas por ano para Homens (Intervalo de 60 dias - máximo 4 doações/ano)
const MALE_ANNUAL_BADGES: AnnualBadgeConfig[] = [
  {
    order: 1,
    name: 'bronze',
    title: 'Medalha de Bronze',
    subtitle: '1ª doação',
    description: 'Conquistada na 1ª doação do ano. Você deu a partida para salvar até 4 vidas!',
    bgGradient: 'from-amber-600 via-orange-500 to-amber-700',
    borderColor: 'border-amber-400 ring-4 ring-amber-100',
    shadowColor: 'shadow-amber-600/35',
    iconColor: 'text-white',
    IconComponent: Award,
  },
  {
    order: 2,
    name: 'prata',
    title: 'Medalha de Prata',
    subtitle: '2ª doação',
    description: 'Conquistada na 2ª doação do ano. Compromisso contínuo e dedicação com a vida!',
    bgGradient: 'from-slate-200 via-zinc-400 to-slate-500',
    borderColor: 'border-slate-300 ring-4 ring-slate-100',
    shadowColor: 'shadow-slate-400/35',
    iconColor: 'text-white',
    IconComponent: Shield,
  },
  {
    order: 3,
    name: 'ouro',
    title: 'Medalha de Ouro',
    subtitle: '3ª doação',
    description: 'Conquistada na 3ª doação do ano. Um exemplo de constância e solidariedade na comunidade!',
    bgGradient: 'from-yellow-300 via-amber-400 to-yellow-600',
    borderColor: 'border-yellow-300 ring-4 ring-amber-100',
    shadowColor: 'shadow-amber-500/40',
    iconColor: 'text-white',
    IconComponent: Crown,
  },
  {
    order: 4,
    name: 'diamante',
    title: 'Medalha de Diamante',
    subtitle: '4ª doação (Meta)',
    description: 'A honraria suprema! Você atingiu o limite máximo biológico de 4 doações no ano, impactando diretamente até 16 pessoas!',
    bgGradient: 'from-cyan-300 via-sky-400 to-blue-600',
    borderColor: 'border-cyan-200 ring-4 ring-cyan-100',
    shadowColor: 'shadow-cyan-500/40',
    iconColor: 'text-white',
    IconComponent: Sparkles,
  },
];

// 3 Jóias por ano para Mulheres (Intervalo de 120 dias - máximo 3 doações/ano)
const FEMALE_ANNUAL_BADGES: AnnualBadgeConfig[] = [
  {
    order: 1,
    name: 'rubi',
    title: 'Jóia de Rubi',
    subtitle: '1ª doação',
    description: 'Conquistada na 1ª doação do ano. A chama da generosidade reacendida para iluminar vidas!',
    bgGradient: 'from-rose-500 via-red-600 to-rose-700',
    borderColor: 'border-rose-300 ring-4 ring-rose-100',
    shadowColor: 'shadow-red-500/35',
    iconColor: 'text-white',
    IconComponent: Heart,
  },
  {
    order: 2,
    name: 'pérola',
    title: 'Jóia de Pérola',
    subtitle: '2ª doação',
    description: 'Conquistada na 2ª doação do ano. Rara, pura e inestimável para os pacientes em tratamento!',
    bgGradient: 'from-pink-100 via-rose-200 to-pink-300',
    borderColor: 'border-pink-200 ring-4 ring-pink-50',
    shadowColor: 'shadow-pink-300/30',
    iconColor: 'text-rose-800',
    IconComponent: Star,
  },
  {
    order: 3,
    name: 'diamante',
    title: 'Jóia de Diamante',
    subtitle: '3ª doação (Meta)',
    description: 'A mais alta conquista anual! Você completou as 3 doações anuais permitidas para mulheres, salvando até 12 vidas!',
    bgGradient: 'from-teal-300 via-cyan-400 to-blue-500',
    borderColor: 'border-cyan-200 ring-4 ring-cyan-100',
    shadowColor: 'shadow-cyan-500/40',
    iconColor: 'text-white',
    IconComponent: Sparkles,
  },
];

export default function ColecaoDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [specialBadges, setSpecialBadges] = useState<UserSpecialBadges>({});
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<SpecialBadgeModalData | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const [{ data: profile }, { data: donations }, loadedCampaigns, userBadges] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase
            .from('donations')
            .select('*')
            .eq('profile_id', session.user.id)
            .order('donation_date', { ascending: true }),
          fetchGroupCampaigns(supabase, session.user.id),
          fetchUserSpecialBadges(supabase, session.user.id),
        ]);

      if (profile) setUserProfile(profile);
      if (donations) setHistory(donations);
      if (loadedCampaigns) setCampaigns(loadedCampaigns);
      if (userBadges) setSpecialBadges(userBadges);
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4" />
        <p className="text-xs text-slate-400 font-normal">Carregando suas conquistas...</p>
      </div>
    );
  }

  if (!userProfile) return null;

  const isFemale = userProfile.sex === 'F';
  const badgeConfig = isFemale ? FEMALE_ANNUAL_BADGES : MALE_ANNUAL_BADGES;
  const maxBadgesPerYear = badgeConfig.length;

  // Agrupa doações por ano (ordem crescente de data)
  const donationsByYear: Record<number, any[]> = {};
  history.forEach((d) => {
    const parsed = parseSafeDate(d.donation_date);
    if (parsed) {
      const y = parsed.getFullYear();
      if (!donationsByYear[y]) donationsByYear[y] = [];
      donationsByYear[y].push(d);
    }
  });

  // O projeto começou em 2026! Exibição baseada a partir de 2026.
  const PROJECT_START_YEAR = 2026;
  const currentYear = new Date().getFullYear();
  const displayedYears: number[] = [];
  for (let y = Math.max(currentYear, PROJECT_START_YEAR); y >= PROJECT_START_YEAR; y--) {
    displayedYears.push(y);
  }

  // Contagem de conquistas especiais desbloqueadas
  let specialUnlockedCount = 0;
  if (specialBadges.isFounder) specialUnlockedCount++;
  if (specialBadges.isSosHero) specialUnlockedCount++;
  const userMutiraoIds = specialBadges.mutiraoIds || [];
  specialUnlockedCount += userMutiraoIds.length;

  const totalUnlocked = history.length + specialUnlockedCount;

  return (
    <div className="flex flex-col min-h-full bg-white select-none">
      {/* Topo estilo Duolingo com Seta e Título Centralizado */}
      <div className="px-5 pt-8 pb-4 bg-white/95 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between">
        <Link
          href="/doador"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </Link>

        <h1 className="text-base font-bold text-slate-800 tracking-tight">
          {isFemale ? 'Jóias da Doadora' : 'Medalhas do Doador'}
        </h1>

        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-800">
          <Sparkles size={13} className="text-amber-500 fill-amber-500" />
          <span>{totalUnlocked}</span>
        </div>
      </div>

      <div className="px-5 py-6 pb-28 space-y-10 max-w-md mx-auto w-full">
        {/* SEÇÃO 1: MEDALHAS ESPECIAIS (Fundador, Mutirões, Rede SOS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Star size={18} className="text-amber-500 fill-amber-500" /> Medalhas Especiais
              </h2>
              <p className="text-[11px] text-slate-500 font-normal">
                Conquistas exclusivas por mutirões e pioneirismo
              </p>
            </div>
            <span className="text-[11px] font-medium text-amber-900 bg-amber-100/70 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
              {specialUnlockedCount} desbloqueada{specialUnlockedCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3.5 sm:gap-4 pt-1">
            {/* 1. Membro Fundador (2026) */}
            {(() => {
              const isUnlocked = Boolean(specialBadges.isFounder);
              return (
                <div
                  onClick={() =>
                    setSelectedBadge({
                      title: 'Membro Fundador do Movimento',
                      subtitle: 'Pioneiro Inaugural • 2026',
                      description:
                        'Concedida exclusivamente aos pioneiros que deram início ao Movimento O Bom Amigo no ano de fundação (2026). Uma homenagem perpétua pela liderança solidária!',
                      bgGradient: 'from-amber-400 via-yellow-500 to-amber-700',
                      borderColor: 'border-amber-300 ring-4 ring-amber-100',
                      iconColor: 'text-white',
                      IconComponent: Crown,
                      isUnlocked,
                      unlockedDate: specialBadges.founderGrantedAt || '2026-01-01',
                    })
                  }
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className="relative">
                    {isUnlocked ? (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-1 shadow-amber-500/40 shadow-lg border-[3.5px] border-amber-300 ring-4 ring-amber-100 flex items-center justify-center transform transition-transform group-hover:scale-105 relative overflow-hidden">
                        <div className="absolute top-1 left-2 right-2 h-6 bg-white/35 rounded-full blur-[1px] pointer-events-none" />
                        <Crown size={28} className="text-white drop-shadow-md" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/90 border-[3.5px] border-slate-200 shadow-inner flex items-center justify-center group-hover:bg-slate-200/70 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/60 shadow-xs flex items-center justify-center">
                          <Lock size={15} className="text-slate-400 stroke-[2.2]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center transition-colors ${
                      isUnlocked ? 'font-bold text-slate-800' : 'font-normal text-slate-400'
                    }`}
                  >
                    Fundador
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight text-center">
                    Pioneiro 2026
                  </span>
                </div>
              );
            })()}

            {/* 2. Herói da Rede SOS (Doação Urgente) */}
            {(() => {
              const isUnlocked = Boolean(specialBadges.isSosHero);
              return (
                <div
                  onClick={() =>
                    setSelectedBadge({
                      title: 'Herói da Rede de Apoio SOS',
                      subtitle: 'Doação de Emergência Direcionada',
                      description:
                        'Concedida ao membro que atendeu a um chamado de emergência para socorrer uma vida que precisava com urgência de sangue nos hospitais cadastrados.',
                      bgGradient: 'from-rose-500 via-red-600 to-rose-700',
                      borderColor: 'border-rose-300 ring-4 ring-rose-100',
                      iconColor: 'text-white',
                      IconComponent: Heart,
                      isUnlocked,
                      unlockedDate: specialBadges.sosHeroGrantedAt,
                    })
                  }
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className="relative">
                    {isUnlocked ? (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 p-1 shadow-red-500/40 shadow-lg border-[3.5px] border-rose-300 ring-4 ring-rose-100 flex items-center justify-center transform transition-transform group-hover:scale-105 relative overflow-hidden">
                        <div className="absolute top-1 left-2 right-2 h-6 bg-white/35 rounded-full blur-[1px] pointer-events-none" />
                        <Heart size={28} className="text-white drop-shadow-md fill-white" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/90 border-[3.5px] border-slate-200 shadow-inner flex items-center justify-center group-hover:bg-slate-200/70 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/60 shadow-xs flex items-center justify-center">
                          <Lock size={15} className="text-slate-400 stroke-[2.2]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center transition-colors ${
                      isUnlocked ? 'font-bold text-slate-800' : 'font-normal text-slate-400'
                    }`}
                  >
                    Rede SOS
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight text-center">
                    Socorro Urgente
                  </span>
                </div>
              );
            })()}

            {/* 3. Medalhas por Mutirão Cadastrado (1º Mutirão O Bom Amigo, 2º Mutirão O Bom Amigo, etc.) */}
            {campaigns.map((camp, idx) => {
              const isUnlocked = userMutiraoIds.includes(camp.id);
              const mutiraoTitle = `${idx + 1}º Mutirão O Bom Amigo`;
              const formattedDate = formatSafeDate(camp.campaign_date);

              return (
                <div
                  key={camp.id}
                  onClick={() =>
                    setSelectedBadge({
                      title: mutiraoTitle,
                      subtitle: `${formattedDate} • ${camp.location}`,
                      description: isUnlocked
                        ? `Medalha especial comemorativa concedida pela coordenação pela presença confirmada no ${mutiraoTitle}, realizado no hemocentro ${camp.location}. Juntos salvamos vidas!`
                        : `Esta medalha especial do ${mutiraoTitle} é liberada individualmente pela coordenação após a confirmação presencial de comparecimento e doação no dia do mutirão.`,
                      bgGradient: 'from-emerald-400 via-teal-500 to-cyan-600',
                      borderColor: 'border-emerald-300 ring-4 ring-emerald-100',
                      iconColor: 'text-white',
                      IconComponent: Users,
                      isUnlocked,
                      unlockedDate: camp.campaign_date,
                    })
                  }
                  className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className="relative">
                    {isUnlocked ? (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-1 shadow-teal-500/40 shadow-lg border-[3.5px] border-emerald-300 ring-4 ring-emerald-100 flex items-center justify-center transform transition-transform group-hover:scale-105 relative overflow-hidden">
                        <div className="absolute top-1 left-2 right-2 h-6 bg-white/35 rounded-full blur-[1px] pointer-events-none" />
                        <Users size={28} className="text-white drop-shadow-md" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/90 border-[3.5px] border-slate-200 shadow-inner flex items-center justify-center group-hover:bg-slate-200/70 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/60 shadow-xs flex items-center justify-center">
                          <Lock size={15} className="text-slate-400 stroke-[2.2]" />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Título da medalha sem cortes, exibido por completo */}
                  <span
                    className={`text-xs mt-2 text-center break-words leading-tight px-1 transition-colors ${
                      isUnlocked ? 'font-bold text-slate-800' : 'font-normal text-slate-400'
                    }`}
                  >
                    {mutiraoTitle}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight text-center mt-0.5">
                    {formattedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 2: MEDALHAS ANUAIS DE DOAÇÃO (A partir de 2026) */}
        {displayedYears.map((year) => {
          const yearDonations = donationsByYear[year] || [];
          const unlockedThisYear = Math.min(yearDonations.length, maxBadgesPerYear);

          return (
            <section key={year} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {isFemale ? 'Jóias de' : 'Medalhas de'} {year}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">
                    {isFemale
                      ? 'Progresso anual (máximo 3 doações por ano)'
                      : 'Progresso anual (máximo 4 doações por ano)'}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {unlockedThisYear} de {maxBadgesPerYear} desbloqueadas
                </span>
              </div>

              {/* Grid 4 Colunas para Homens ou 3 Colunas para Mulheres */}
              <div
                className={`grid ${
                  isFemale ? 'grid-cols-3 gap-4 sm:gap-6' : 'grid-cols-4 gap-2.5 sm:gap-3.5'
                }`}
              >
                {badgeConfig.map((badge, idx) => {
                  const isUnlocked = idx < yearDonations.length;
                  const donation = isUnlocked ? yearDonations[idx] : undefined;
                  const Icon = badge.IconComponent;

                  return (
                    <div
                      key={badge.name}
                      onClick={() =>
                        setSelectedBadge({
                          title: badge.title,
                          subtitle: `${badge.subtitle} • ${year}`,
                          description: isUnlocked
                            ? badge.description
                            : `Esta conquista está bloqueada para ${year}. Realize sua ${badge.order}ª doação no ano para desbloqueá-la!`,
                          bgGradient: badge.bgGradient,
                          borderColor: badge.borderColor,
                          iconColor: badge.iconColor,
                          IconComponent: badge.IconComponent,
                          isUnlocked,
                          unlockedDate: donation?.donation_date,
                        })
                      }
                      className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                    >
                      <div className="relative">
                        {isUnlocked ? (
                          <div
                            className={`${
                              isFemale ? 'w-20 h-20' : 'w-16 h-16 sm:w-18 sm:h-18'
                            } rounded-full bg-gradient-to-br ${badge.bgGradient} p-1 ${
                              badge.shadowColor
                            } shadow-lg border-[3.5px] ${
                              badge.borderColor
                            } flex items-center justify-center transform transition-transform group-hover:scale-105 relative overflow-hidden`}
                          >
                            <div className="absolute top-1 left-2 right-2 h-6 bg-white/25 rounded-full blur-[1px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center justify-center">
                              <Icon
                                size={isFemale ? 28 : 24}
                                className={`${badge.iconColor} drop-shadow-md`}
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`${
                              isFemale ? 'w-20 h-20' : 'w-16 h-16 sm:w-18 sm:h-18'
                            } rounded-full bg-gradient-to-b from-slate-100 to-slate-200/90 border-[3.5px] border-slate-200 shadow-inner flex items-center justify-center group-hover:bg-slate-200/70 transition-colors`}
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/60 shadow-xs flex items-center justify-center">
                              <Lock size={15} className="text-slate-400 stroke-[2.2]" />
                            </div>
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-xs mt-2 text-center capitalize transition-colors ${
                          isUnlocked
                            ? 'font-bold text-slate-800'
                            : 'font-normal text-slate-400'
                        }`}
                      >
                        {badge.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight text-center">
                        {badge.subtitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Modal Interativo ao Clicar em Qualquer Medalha */}
      {selectedBadge && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-5"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 text-center relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Ícone Grande Centralizado */}
            <div className="mx-auto my-3 flex justify-center">
              {selectedBadge.isUnlocked ? (
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedBadge.bgGradient} border-4 ${selectedBadge.borderColor} shadow-xl flex items-center justify-center relative`}
                >
                  <div className="absolute top-1 left-3 right-3 h-8 bg-white/25 rounded-full blur-[1px]" />
                  <selectedBadge.IconComponent
                    size={38}
                    className={`${selectedBadge.iconColor} drop-shadow-lg`}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 border-4 border-slate-200 shadow-inner flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center shadow-xs">
                    <Lock size={24} className="text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mt-2">
              {selectedBadge.subtitle}
            </span>

            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {selectedBadge.title}
            </h3>

            <p className="text-xs text-slate-600 font-normal leading-relaxed mt-2 px-2">
              {selectedBadge.description}
            </p>

            {selectedBadge.isUnlocked && selectedBadge.unlockedDate && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Conquistada em{' '}
                  {formatSafeDate(selectedBadge.unlockedDate)}
                </span>
              </div>
            )}

            <div className="pt-4 mt-2">
              {selectedBadge.isUnlocked ? (
                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold transition-colors"
                >
                  Conquista Desbloqueada!
                </button>
              ) : (
                <Link
                  href="/doador#agendamento"
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={15} /> Agendar Próxima Doação
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
