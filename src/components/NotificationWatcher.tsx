"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  X,
  AlertTriangle,
  Calendar,
  Newspaper,
  Award,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  fetchUnifiedNotifications,
  getUserDismissedNotificationIds,
  persistDismissedNotifications,
} from '@/lib/campaigns';
import { AppNotification } from '@/utils/donationRules';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestAndSubscribePush,
  showSystemTrayNotification,
} from '@/lib/pushNotifications';

function renderMessageWithLinks(text?: string) {
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
            onClick={(e) => e.stopPropagation()}
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

export function NotificationWatcher() {
  const supabase = createClient();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [popupQueue, setPopupQueue] = useState<AppNotification[]>([]);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [activatingPush, setActivatingPush] = useState(false);

  // Suporte a arrastar para o lado (swipe) para ignorar facilmente
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState<number>(0);

  const profileRef = useRef<any>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const perm = getNotificationPermission();
    setPermissionState(perm);

    const promptDismissedSession = sessionStorage.getItem('oba_push_prompt_dismissed');
    if (perm === 'default' && !promptDismissedSession) {
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Sincroniza notificações enviadas pelo Admin e notificações programadas:
   * 1. Envia para a barra de notificações do celular/computador (uma única vez por notificação).
   * 2. Exibe no pop-up ao entrar no app (mesmo que o usuário tenha limpado da barra do celular),
   *    mas se o usuário escolher fechar/ignorar o pop-up, respeita a escolha dele e não exibe novamente.
   */
  const syncNotifications = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        isCheckingRef.current = false;
        return;
      }

      const userId = session.user.id;
      let currentProf = profileRef.current;

      if (!currentProf || currentProf.id !== userId) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (profData) {
          currentProf = profData;
          profileRef.current = profData;
          setUserProfile(profData);
        }
      }

      const allNotifs = await fetchUnifiedNotifications(supabase, currentProf || { id: userId });

      // IDs que o usuário já viu, fechou ou ignorou no app
      const dbClearedIds = getUserDismissedNotificationIds(currentProf);
      const localClearedIds: string[] = JSON.parse(
        localStorage.getItem('cleared_notif_ids') || '[]'
      );
      const localReadIds: string[] = JSON.parse(
        localStorage.getItem('read_notif_ids') || '[]'
      );
      const dismissedPopupIds: string[] = JSON.parse(
        localStorage.getItem('dismissed_popup_ids') || '[]'
      );

      const alreadyHandledSet = new Set([
        ...dbClearedIds,
        ...localClearedIds,
        ...localReadIds,
        ...dismissedPopupIds,
      ]);

      const pendingForUser = allNotifs.filter((n) => !alreadyHandledSet.has(n.id));

      // 1. Dispara na barra de notificações do aparelho (caso o usuário tenha dado permissão)
      if (getNotificationPermission() === 'granted') {
        for (const notif of pendingForUser) {
          await showSystemTrayNotification(notif);
        }
      }

      // 2. Coloca na fila do pop-up do app apenas as notificações que o usuário ainda não viu nem ignorou
      setPopupQueue(pendingForUser);
    } catch (e) {
      console.warn('Erro ao sincronizar notificações:', e);
    } finally {
      isCheckingRef.current = false;
    }
  }, [supabase]);

  useEffect(() => {
    syncNotifications();

    const channel = supabase
      .channel('oba-realtime-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation_guides' },
        () => {
          syncNotifications();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        () => {
          syncNotifications();
        }
      )
      .subscribe();

    // Checa a cada 30s para disparar notificações programadas assim que o horário agendado chegar
    const interval = setInterval(() => {
      syncNotifications();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncNotifications();
      }
    };
    window.addEventListener('focus', syncNotifications);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('oba-notifications-updated', syncNotifications);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', syncNotifications);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('oba-notifications-updated', syncNotifications);
    };
  }, [supabase, syncNotifications]);

  const handleEnableSystemNotifications = async () => {
    setActivatingPush(true);
    const res = await requestAndSubscribePush(supabase, userProfile?.id);
    setActivatingPush(false);
    setPermissionState(getNotificationPermission());

    if (res.granted) {
      setShowPermissionPrompt(false);
      await showSystemTrayNotification({
        id: `welcome-push-${Date.now()}`,
        type: 'sistema',
        title: '🔔 Notificações Ativadas!',
        message: 'Agora você receberá avisos de mutirões, SOS Sangue e medalhas direto na barra do seu celular.',
        created_at: new Date().toISOString(),
        is_urgent: false,
      });
      syncNotifications();
    } else if (res.error) {
      alert(res.error);
    }
  };

  /**
   * Fecha ou ignora o pop-up definitivamente (seja clicando no X, fora do card, arrastando para o lado,
   * clicando em "Ignorar / Fechar" ou "Ver Detalhes"). Não volta a incomodar o usuário!
   * A notificação continua acessível no ícone do sino caso ele queira consultar depois.
   */
  const handleCloseOrIgnorePopup = (notif: AppNotification, navigateToLink: boolean = false) => {
    setDragOffsetX(0);
    setPopupQueue((prev) => prev.filter((item) => item.id !== notif.id));

    const dismissedPopups: string[] = JSON.parse(
      localStorage.getItem('dismissed_popup_ids') || '[]'
    );
    const updatedPopups = Array.from(new Set([...dismissedPopups, notif.id]));
    localStorage.setItem('dismissed_popup_ids', JSON.stringify(updatedPopups));

    if (navigateToLink && notif.link) {
      const readIds: string[] = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
      localStorage.setItem('read_notif_ids', JSON.stringify(Array.from(new Set([...readIds, notif.id]))));
      window.dispatchEvent(new Event('oba-notifications-updated'));
      router.push(notif.link);
    }
  };

  const currentPopup = popupQueue[0] || null;

  return (
    <>
      {/* 1. CONVITE DISCRETO PARA ATIVAR NOTIFICAÇÕES NA BARRA DO CELULAR */}
      {isNotificationSupported() && permissionState === 'default' && showPermissionPrompt && (
        <div className="fixed bottom-20 left-3 right-3 z-[60] max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 print:hidden">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-white/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-xs">
                <BellRing size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white leading-tight">
                  Receber Avisos na Barra do Celular
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Ative para ser avisado de mutirões, SOS Sangue e medalhas mesmo fora do app.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={activatingPush}
                onClick={handleEnableSystemNotifications}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {activatingPush ? 'Ativando...' : 'Ativar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPermissionPrompt(false);
                  sessionStorage.setItem('oba_push_prompt_dismissed', 'true');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Agora não"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. POP-UP DE NOTIFICAÇÃO NO APP (PODE SER FECHADO OU IGNORADO LIVREMENTE PELO USUÁRIO) */}
      {currentPopup && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
          onClick={() => handleCloseOrIgnorePopup(currentPopup, false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchMove={(e) => {
              if (touchStartX === null) return;
              setDragOffsetX(e.touches[0].clientX - touchStartX);
            }}
            onTouchEnd={() => {
              if (Math.abs(dragOffsetX) > 85) {
                // Se o usuário arrastar para o lado, fecha e ignora definitivamente!
                handleCloseOrIgnorePopup(currentPopup, false);
              } else {
                setDragOffsetX(0);
              }
              setTouchStartX(null);
            }}
            style={{
              transform: dragOffsetX ? `translateX(${dragOffsetX}px)` : undefined,
              opacity: dragOffsetX ? Math.max(0.3, 1 - Math.abs(dragOffsetX) / 240) : 1,
            }}
            className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden transition-transform"
          >
            {/* Topo do Pop-up com Botão X para fechar/ignorar */}
            <div
              className={`px-5 py-3.5 flex items-center justify-between gap-2 ${
                currentPopup.is_urgent || currentPopup.type === 'sos'
                  ? 'bg-red-600 text-white'
                  : currentPopup.type === 'medalha'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                  : currentPopup.type === 'chamado'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {currentPopup.type === 'sos' ? (
                  <AlertTriangle size={17} className="shrink-0" />
                ) : currentPopup.type === 'medalha' ? (
                  <Award size={17} className="shrink-0" />
                ) : currentPopup.type === 'chamado' ? (
                  <LifeBuoy size={17} className="shrink-0" />
                ) : currentPopup.type === 'mutirao' ? (
                  <Calendar size={17} className="shrink-0" />
                ) : currentPopup.type === 'noticia' ? (
                  <Newspaper size={17} className="shrink-0" />
                ) : (
                  <BellRing size={17} className="shrink-0" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider truncate">
                  {currentPopup.type === 'sos'
                    ? 'Rede de Apoio SOS'
                    : currentPopup.type === 'medalha'
                    ? 'Nova Medalha!'
                    : currentPopup.type === 'chamado'
                    ? 'Retorno do Chamado'
                    : currentPopup.type === 'mutirao'
                    ? 'Lembrete de Mutirão'
                    : currentPopup.type === 'noticia'
                    ? 'Mural de Notícias'
                    : 'Comunicado do Movimento'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCloseOrIgnorePopup(currentPopup, false)}
                className="p-1 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Fechar e ignorar"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>

            {/* Conteúdo do Pop-up */}
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 font-normal block mb-1">
                  {new Date(currentPopup.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {currentPopup.title}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-2 max-h-48 overflow-y-auto pr-1">
                  {renderMessageWithLinks(currentPopup.message)}
                </div>
              </div>

              {/* Ações: Visualizar ou Ignorar/Fechar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCloseOrIgnorePopup(currentPopup, false)}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Agora não
                </button>

                {currentPopup.link ? (
                  <button
                    type="button"
                    onClick={() => handleCloseOrIgnorePopup(currentPopup, true)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      currentPopup.is_urgent || currentPopup.type === 'sos'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <span>Visualizar</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCloseOrIgnorePopup(currentPopup, false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    OK, fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
