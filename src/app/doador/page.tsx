"use client";

import {
  Newspaper,
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  HeartHandshake,
  Users,
  ExternalLink,
  Bell,
  AlertTriangle,
  Heart,
  Share2,
  LifeBuoy,
  Globe,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  fetchGroupCampaigns,
  fetchSupportCampaigns,
  fetchUnifiedNotifications,
  fetchProjectConfig,
  toggleCampaignConfirmation,
  getUserDismissedNotificationIds,
  persistDismissedNotifications,
  MAX_CAMPAIGN_PARTICIPANTS,
  DEFAULT_PROJECT_CONFIG,
  ProjectConfig,
} from '@/lib/campaigns';
import {
  fetchOfficialProducts,
  fetchUserProductOrders,
  isProductVisibleToMembers,
  formatDeadlineBR,
  OfficialProduct,
  ShirtOrder,
} from '@/lib/shirtOrders';
import {
  checkEligibilityForDate,
  GroupCampaign,
  SupportCampaign,
  AppNotification,
  parseSafeDate,
  getDonationIntervalDays,
  canDonateBlood,
  parseNewsRow,
} from '@/utils/donationRules';
import { NotificationModal } from '@/components/NotificationModal';
import Image from 'next/image';
import Link from 'next/link';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z';

function renderContentWithLinks(text?: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const cleanUrl = part.replace(/[.,;!?)]+$/, '');
      const trailing = part.slice(cleanUrl.length);
      const href = cleanUrl.toLowerCase().startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      return (
        <span key={idx}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline break-all font-medium"
          >
            {cleanUrl}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function DoadorHome() {
  const [profile, setProfile] = useState<any>(null);
  const [lastDonationDate, setLastDonationDate] = useState<string | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [supportCampaigns, setSupportCampaigns] = useState<SupportCampaign[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedSupportModal, setSelectedSupportModal] = useState<SupportCampaign | null>(null);
  const [selectedNewsModal, setSelectedNewsModal] = useState<any | null>(null);
  const [officialProducts, setOfficialProducts] = useState<OfficialProduct[]>([]);
  const [userOrders, setUserOrders] = useState<ShirtOrder[]>([]);
  const [previewProductArtwork, setPreviewProductArtwork] = useState<OfficialProduct | null>(null);
  const supabase = createClient();

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let currentProfile: any = null;

    if (session && userId) {
      const [{ data: profData }, { data: donData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('donations')
          .select('donation_date')
          .eq('profile_id', userId)
          .order('donation_date', { ascending: false })
          .limit(1),
      ]);

      if (profData) {
        currentProfile = profData;
        setProfile(profData);
        const latestFromHistory = donData && donData.length > 0 ? donData[0].donation_date : null;
        setLastDonationDate(latestFromHistory || profData.last_donation_date || null);
      }
    }

    const [
      { data: newsData },
      loadedCampaigns,
      loadedSupport,
      loadedConfig,
      loadedNotifs,
      loadedProducts,
      loadedUserOrders,
    ] = await Promise.all([
      supabase.from('news').select('*').order('created_at', { ascending: false }),
      fetchGroupCampaigns(supabase, userId).catch(() => []),
      fetchSupportCampaigns(supabase).catch(() => []),
      fetchProjectConfig(supabase).catch(() => DEFAULT_PROJECT_CONFIG),
      fetchUnifiedNotifications(supabase, currentProfile || undefined).catch(() => []),
      fetchOfficialProducts(supabase).catch(() => []),
      userId ? fetchUserProductOrders(supabase, userId).catch(() => []) : Promise.resolve([]),
    ]);

    if (newsData) setFeed(newsData.map(parseNewsRow));
    if (loadedProducts) setOfficialProducts(loadedProducts.filter(isProductVisibleToMembers));
    if (loadedUserOrders) setUserOrders(loadedUserOrders);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = loadedCampaigns.filter((c) => {
      const d = parseSafeDate(c.campaign_date);
      return d && d >= today;
    });
    setCampaigns(upcoming.length > 0 ? upcoming : loadedCampaigns);
    setSupportCampaigns(loadedSupport.filter((s) => s.status === 'Ativa'));
    setConfig(loadedConfig);

    // 1. Obtém notificações limpas salvas no sistema (banco de dados)
    const dbClearedIds = getUserDismissedNotificationIds(currentProfile);

    // 2. Faz o merge com o localStorage do aparelho
    const localClearedIds: string[] = JSON.parse(localStorage.getItem('cleared_notif_ids') || '[]');
    const mergedClearedIds = Array.from(new Set([...dbClearedIds, ...localClearedIds]));

    // Atualiza o localStorage local
    localStorage.setItem('cleared_notif_ids', JSON.stringify(mergedClearedIds));

    // Se o aparelho tinha notificações limpas ainda não sincronizadas com o banco, salva no sistema
    if (userId && localClearedIds.some((id) => !dbClearedIds.includes(id))) {
      persistDismissedNotifications(supabase, userId, mergedClearedIds);
    }

    // 3. Filtra: notificações limpas NUNCA MAIS aparecem no sino
    const visibleNotifs = loadedNotifs.filter((n) => !mergedClearedIds.includes(n.id));
    setNotifications(visibleNotifs);

    // Checa notificações não lidas no localStorage dentre as ativas
    const readIds: string[] = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
    const unreadCount = visibleNotifs.filter((n) => !readIds.includes(n.id)).length;
    setHasUnreadNotifs(unreadCount > 0);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenNotifications = () => {
    setIsNotifOpen(true);
    setHasUnreadNotifs(false);
    const allIds = notifications.map((n) => n.id);
    const readIds: string[] = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
    const updated = Array.from(new Set([...readIds, ...allIds]));
    localStorage.setItem('read_notif_ids', JSON.stringify(updated));
  };

  const handleDismissNotification = (id: string) => {
    // 1. Remove da tela imediatamente
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // 2. Salva localmente
    const clearedIds: string[] = JSON.parse(localStorage.getItem('cleared_notif_ids') || '[]');
    const updated = Array.from(new Set([...clearedIds, id]));
    localStorage.setItem('cleared_notif_ids', JSON.stringify(updated));

    const readIds: string[] = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_notif_ids', JSON.stringify(readIds));
    }

    // 3. PERSISTE NO SISTEMA (BANCO DE DADOS): nunca mais reaparece
    if (profile?.id) {
      persistDismissedNotifications(supabase, profile.id, id);
    }
  };

  const handleMarkAllRead = () => {
    const idsToClear = notifications.map((n) => n.id);
    if (idsToClear.length === 0) return;

    // 1. Remove todas da tela imediatamente
    setNotifications([]);
    setHasUnreadNotifs(false);

    // 2. Salva localmente
    const clearedIds: string[] = JSON.parse(localStorage.getItem('cleared_notif_ids') || '[]');
    const updatedCleared = Array.from(new Set([...clearedIds, ...idsToClear]));
    const readIds: string[] = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
    const updatedRead = Array.from(new Set([...readIds, ...idsToClear]));

    localStorage.setItem('cleared_notif_ids', JSON.stringify(updatedCleared));
    localStorage.setItem('read_notif_ids', JSON.stringify(updatedRead));

    // 3. PERSISTE NO SISTEMA (BANCO DE DADOS): nunca mais reaparecem
    if (profile?.id) {
      persistDismissedNotifications(supabase, profile.id, idsToClear);
    }
  };

  const handleToggleRsvp = async (camp: GroupCampaign) => {
    if (!profile?.id) return;
    setConfirmingId(camp.id);
    const res = await toggleCampaignConfirmation(
      supabase,
      camp.id,
      { id: profile.id, name: profile.name || 'Doador' },
      Boolean(camp.user_confirmed)
    );
    if (!res.ok && res.error) {
      alert(res.error);
    }
    await loadAll();
    setConfirmingId(null);
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Doador';
  const userSex = profile?.sex || 'M';
  const intervalDays = getDonationIntervalDays(userSex);
  const todayEligibility = checkEligibilityForDate(userSex, lastDonationDate, new Date());

  return (
    <div className="flex flex-col min-h-full">
      {/* Header com Saudação e Sino de Notificações (Totalmente responsivo em qualquer celular) */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Foto"
              width={44}
              height={44}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-red-100 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-base sm:text-lg border-2 border-red-200 shadow-sm shrink-0">
              {firstName.charAt(0) || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-semibold text-slate-900 tracking-tight leading-tight">
              Olá, {firstName}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-normal truncate">
              {profile?.blood_type ? `Tipo ${profile.blood_type}` : 'Doador Voluntário'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Central de Apoio & Chamados */}
          <Link
            href="/doador/apoio"
            title="Central de Apoio & Chamados"
            aria-label="Central de Apoio"
            className="p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <LifeBuoy size={17} />
          </Link>

          {/* Sino de Notificações com Badge */}
          <button
            type="button"
            onClick={handleOpenNotifications}
            aria-label="Abrir notificações"
            className="relative p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Bell size={17} />
            {hasUnreadNotifs && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white ring-1 ring-red-400 animate-pulse" />
            )}
          </button>

          {/* Canal no WhatsApp */}
          <a
            href={config.whatsappGroupUrl || WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            title="Canal no WhatsApp"
            aria-label="Canal no WhatsApp"
            className="p-2 sm:px-3 sm:py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle size={17} />
            <span className="hidden sm:inline">Canal</span>
          </a>
        </div>
      </div>

      <div className="px-5 py-5 flex-1 space-y-5">
        {/* Card: Situação do Doador */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-normal">
              Intervalo de {intervalDays} dias ({userSex === 'F' ? 'Mulher' : 'Homem'})
            </span>
            <Link href="/doador/doacoes" className="text-slate-600 hover:text-slate-900 font-normal">
              Histórico →
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-xs text-slate-500 font-normal">Situação atual:</p>
              {todayEligibility.isEligible ? (
                <p className="text-base sm:text-lg font-medium text-emerald-600 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 size={18} /> Liberado para doar
                </p>
              ) : (
                <p className="text-base sm:text-lg font-medium text-amber-600 flex items-center gap-1.5 mt-0.5">
                  <Clock size={18} /> Faltam {todayEligibility.daysRemaining} dias
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1 font-normal">
                {lastDonationDate
                  ? `Última doação: ${parseSafeDate(lastDonationDate)?.toLocaleDateString('pt-BR')}`
                  : 'Nenhuma doação registrada'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-right shrink-0">
              <span className="text-[10px] text-slate-500 block font-normal">
                Livre a partir de
              </span>
              <span className="text-sm font-medium text-slate-800">
                {todayEligibility.nextEligibleDate
                  ? todayEligibility.nextEligibleDate.toLocaleDateString('pt-BR')
                  : 'Hoje'}
              </span>
            </div>
          </div>
        </div>

        {/* Produtos Oficiais (Só aparece quando o Admin habilitar o Pré-Save ou Solicitação, e some quando Encomendado) */}
        {officialProducts.length > 0 && (
          <div className="space-y-2.5">
            {officialProducts.map((prod) => {
              const myOrder = userOrders.find(
                (o) => o.productId === prod.id || (!o.productId && prod.id === officialProducts[0]?.id)
              );
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {prod.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewProductArtwork(prod)}
                        title="Clique para ampliar a arte"
                        className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                        {myOrder
                          ? `Sua solicitação: ${myOrder.quantity} un.${
                              prod.hasSizes && myOrder.size ? ` (Tam. ${myOrder.size})` : ''
                            }`
                          : prod.phase === 'pre_save'
                          ? `Pré-Save aberto${
                              prod.preSaveDeadline
                                ? ` até ${formatDeadlineBR(prod.preSaveDeadline)}`
                                : ''
                            }`
                          : `Solicitações abertas • R$ ${prod.price.toFixed(2).replace('.', ',')} / un.`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/doador/camisa?produto=${encodeURIComponent(prod.id)}`}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors shrink-0"
                  >
                    {myOrder
                      ? 'Ver Pedido'
                      : prod.phase === 'pre_save'
                      ? 'Pré-Save'
                      : 'Solicitar'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* REDE DE APOIO SOS (Campanhas de quem está precisando de sangue) */}
        {supportCampaigns.length > 0 && (
          <div id="rede-apoio" className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Heart size={16} className="text-red-600 fill-red-600" />
                Rede de Apoio: Precisando de Sangue
              </h2>
              <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                {supportCampaigns.length} {supportCampaigns.length === 1 ? 'pedido ativo' : 'pedidos ativos'}
              </span>
            </div>

            <div className="space-y-3">
              {supportCampaigns.map((sos) => {
                const isCompatible = profile?.blood_type
                  ? canDonateBlood(profile.blood_type, sos.blood_type_needed)
                  : false;
                const canDonateNow = isCompatible && todayEligibility.isEligible;

                return (
                  <div
                    key={sos.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      canDonateNow
                        ? 'bg-red-50/50 border-red-200 shadow-xs'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-600 text-white shadow-2xs">
                            Precisa-se: {sos.blood_type_needed}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {sos.urgency === 'Crítica' ? '🚨 Urgência Máxima' : 'Urgente'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                          {sos.patient_name}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 font-normal">
                          {sos.hospital} • {sos.city || 'Juiz de Fora - MG'}
                        </p>
                      </div>

                      {/* Selo de compatibilidade do usuário */}
                      {profile?.blood_type && (
                        <div className="text-right shrink-0">
                          {canDonateNow ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full font-medium">
                              🩸 Você pode doar!
                            </span>
                          ) : isCompatible ? (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-normal">
                              Compatível (em intervalo)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-normal">
                              Incompatível
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {sos.description && (
                      <p className="text-xs text-slate-600 font-normal mt-2.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200/50">
                        {sos.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedSupportModal(sos)}
                        className={`text-xs py-2 px-3.5 rounded-xl font-normal transition-colors flex-1 text-center ${
                          canDonateNow
                            ? 'bg-red-600 hover:bg-red-700 text-white font-medium'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {canDonateNow ? 'Quero Ajudar / Como Doar' : 'Ver Instruções de Doação'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const text = `🚨 *Rede de Apoio O Bom Amigo*\n${sos.patient_name} precisa com urgência de sangue tipo *${sos.blood_type_needed}* no *${sos.hospital}*.\nSe puder ajudar ou doar, participe dessa corrente!`;
                          if (navigator.share) {
                            navigator.share({ title: 'SOS Sangue', text }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(text);
                            alert('Mensagem copiada para compartilhar!');
                          }
                        }}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Compartilhar"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Próximo Mutirão de Doação em Grupo (Apenas o mais próximo na tela inicial) */}
        {campaigns.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <HeartHandshake size={16} className="text-red-500" />
                Próximo Mutirão de Doação
              </h2>
              {campaigns.length > 1 && (
                <Link
                  href="/doador/doacoes"
                  className="text-xs text-slate-600 hover:text-slate-900 font-normal"
                >
                  Ver todos ({campaigns.length}) →
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {campaigns.slice(0, 1).map((camp) => {
                const campDateObj = parseSafeDate(camp.campaign_date);
                const eligibilityOnCampaign = checkEligibilityForDate(
                  userSex,
                  lastDonationDate,
                  camp.campaign_date
                );
                const maxLimit = camp.max_participants || MAX_CAMPAIGN_PARTICIPANTS;
                const confirmedCount = camp.confirmed_count || 0;
                const isFull = confirmedCount >= maxLimit;
                const isUserConfirmed = Boolean(camp.user_confirmed);

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-slate-900">
                            {campDateObj
                              ? campDateObj.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : camp.campaign_date}
                            {camp.campaign_time ? ` às ${camp.campaign_time}` : ''}
                          </p>
                          <p className="text-xs text-slate-600 font-normal">{camp.title}</p>
                        </div>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-full text-[11px] font-normal shrink-0 ${
                          eligibilityOnCampaign.isEligible
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {eligibilityOnCampaign.isEligible ? 'Apto na data' : 'Em intervalo'}
                      </div>
                    </div>

                    {/* Barra de Vagas e Botão de Confirmação / Aviso de Limite de 20 */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1.5 font-normal">
                          <Users size={14} className="text-slate-400" />
                          Confirmados no mutirão:{' '}
                          <strong className="font-medium text-slate-900">
                            {confirmedCount}/{maxLimit}
                          </strong>
                        </span>

                        {isUserConfirmed && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-normal">
                            Presença confirmada
                          </span>
                        )}
                      </div>

                      {isFull && !isUserConfirmed ? (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <p className="text-xs text-amber-900 font-normal leading-relaxed">
                            O mutirão atingiu o limite de <strong>{maxLimit} participantes</strong>. Para doar nesta data, é necessário <strong>agendar individualmente pelo site</strong>.
                          </p>
                          <a
                            href={config.hemocenterScheduleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-normal rounded-xl inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                          >
                            Agendar pelo Site <ExternalLink size={13} />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={confirmingId === camp.id}
                            onClick={() => handleToggleRsvp(camp)}
                            className={`w-full py-2 px-4 rounded-xl text-xs font-normal transition-colors flex items-center justify-center gap-1.5 ${
                              isUserConfirmed
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            } disabled:opacity-50`}
                          >
                            {confirmingId === camp.id
                              ? 'Atualizando...'
                              : isUserConfirmed
                              ? 'Cancelar minha confirmação'
                              : 'Confirmar presença neste mutirão'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card Slim de Agendamento */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-slate-900">
              {config.hemocenterName || 'Hemominas'}
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Agendamento oficial de doações
            </p>
          </div>

          <a
            href={config.hemocenterScheduleUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-normal rounded-full transition-colors shrink-0"
          >
            Agendar
          </a>
        </div>

        {/* Feed de Notícias */}
        <div id="novidades">
          <h2 className="text-sm font-medium text-slate-800 mb-2.5 px-1">
            Novidades do Movimento
          </h2>

          {feed.length === 0 ? (
            <div className="text-center py-8 bg-white border border-slate-200/80 rounded-2xl">
              <Newspaper size={24} className="mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs text-slate-400 font-normal">Nenhuma novidade no momento.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {feed.map((item) => (
                <article
                  key={item.id}
                  onClick={() => setSelectedNewsModal(item)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt="Capa"
                        className="w-14 h-14 rounded-xl flex-shrink-0 object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100">
                        <Newspaper size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 font-normal block">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">
                        {item.subtitle || item.content}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-red-600 font-medium shrink-0">
                    Ler →
                  </span>
                </article>
              ))}
            </div>
          )}

          {/* Atalho para o Site Institucional */}
          <div className="pt-6 pb-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-normal border border-slate-200/80 transition-colors"
            >
              <Globe size={14} className="text-slate-500" />
              <span>Acessar o Site Oficial do Movimento</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes e Instruções para Doar para a Pessoa (Rede de Apoio) */}
      {selectedSupportModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSupportModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
                  Rede de Apoio SOS
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedSupportModal.patient_name}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                {selectedSupportModal.blood_type_needed}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Local de Doação / Internação:</strong> {selectedSupportModal.hospital} ({selectedSupportModal.city || 'Juiz de Fora - MG'})
              </p>
              {selectedSupportModal.contact_info && (
                <p>
                  <strong>Contato / Protocolo:</strong> {selectedSupportModal.contact_info}
                </p>
              )}
              {selectedSupportModal.description && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-slate-700">{selectedSupportModal.description}</p>
                </div>
              )}

              <div className="bg-emerald-50 text-emerald-900 p-3.5 rounded-xl border border-emerald-200 mt-2 space-y-1">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <Heart size={14} className="text-emerald-700" /> Como direcionar sua doação:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Ao comparecer ao Hemocentro, informe na recepção antes da coleta o nome do paciente: <strong>{selectedSupportModal.patient_name}</strong> e o hospital <strong>{selectedSupportModal.hospital}</strong> para que a bolsa seja direcionada a ele(a).
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSupportModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-normal"
              >
                Fechar
              </button>
              <a
                href={config.hemocenterScheduleUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-normal text-center"
              >
                Agendar Doação
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Arte do Produto na Tela Inicial */}
      {previewProductArtwork && previewProductArtwork.imageUrl && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
          onClick={() => setPreviewProductArtwork(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {previewProductArtwork.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewProductArtwork(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 flex items-center justify-center p-3 overflow-hidden">
              <img
                src={previewProductArtwork.imageUrl}
                alt={previewProductArtwork.name}
                className="max-w-full max-h-[65dvh] object-contain rounded-xl"
              />
            </div>

            <div className="shrink-0 px-4 py-3 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewProductArtwork(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Leitura Completa da Notícia */}
      {selectedNewsModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedNewsModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo Fixo */}
            <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs font-semibold text-slate-500">
                {new Date(selectedNewsModal.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
                {selectedNewsModal.author_name ? ` • Por ${selectedNewsModal.author_name}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNewsModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo da Matéria Rolável */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedNewsModal.image_url && (
                <div className="w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-64 flex items-center justify-center">
                  <img
                    src={selectedNewsModal.image_url}
                    alt={selectedNewsModal.title}
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {selectedNewsModal.title}
                </h2>
                {selectedNewsModal.subtitle && (
                  <p className="text-xs sm:text-sm text-red-600 font-medium mt-1">
                    {selectedNewsModal.subtitle}
                  </p>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 font-normal whitespace-pre-line leading-relaxed">
                {renderContentWithLinks(selectedNewsModal.content)}
              </div>

              {selectedNewsModal.attachment_url && (
                <a
                  href={selectedNewsModal.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Abrir Documento Anexo (PDF)</span>
                </a>
              )}
            </div>

            {/* Rodapé Fixo */}
            <div className="shrink-0 px-5 py-3.5 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNewsModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Central de Notificações */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
