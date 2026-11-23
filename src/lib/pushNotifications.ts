import { SupabaseClient } from '@supabase/supabase-js';
import { AppNotification } from '@/utils/donationRules';

// Chave Pública VAPID P-256 (Formato URL-Safe Base64) para Web Push Nativo
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BFzmYIr7qrRpwsm8Gdch2Gz0IUFTkGdZO_9H2TmbOGIVWmz1n1HcSbiwZd-A6hDhDy3o3Uk64IQvHZRBkQ8MP_A';

/**
 * Converte uma string Base64 URL-safe em Uint8Array para o PushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica se o navegador/aparelho suporta notificações na barra de status
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Retorna o status atual da permissão de notificações do sistema operacional
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Solicita permissão do usuário para exibir notificações na barra de status do celular/PC
 * e registra a inscrição Web Push no perfil do usuário no Supabase.
 */
export async function requestAndSubscribePush(
  supabase: SupabaseClient,
  userId?: string
): Promise<{ granted: boolean; subscription?: PushSubscription | null; error?: string }> {
  if (!isNotificationSupported()) {
    return {
      granted: false,
      error: 'Seu navegador atual não suporta notificações nativas. No iPhone, adicione o app à Tela de Início primeiro.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        granted: false,
        error: 'Permissão de notificação negada nas configurações do aparelho.',
      };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription && 'pushManager' in registration) {
      try {
        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource,
        });
      } catch (subErr) {
        // Mesmo que o PushManager falhe em algum navegador restrito, a Notification API via ServiceWorker continua funcionando!
        console.warn('Aviso ao criar assinatura PushManager:', subErr);
      }
    }

    if (userId) {
      await saveUserPushSubscription(supabase, userId, subscription);
    }

    return { granted: true, subscription };
  } catch (err: any) {
    return {
      granted: false,
      error: err?.message || 'Erro ao ativar notificações no aparelho.',
    };
  }
}

/**
 * Salva a assinatura Web Push e o status de ativação em profiles.theme_preference
 */
export async function saveUserPushSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscription: PushSubscription | null
): Promise<void> {
  if (!userId) return;
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('theme_preference')
      .eq('id', userId)
      .maybeSingle();

    let existingObj: Record<string, any> = {};
    if (prof?.theme_preference && prof.theme_preference.startsWith('{')) {
      try {
        existingObj = JSON.parse(prof.theme_preference);
      } catch {}
    }

    const subJson = subscription ? subscription.toJSON() : null;
    const existingSubs: any[] = Array.isArray(existingObj.push_subscriptions)
      ? existingObj.push_subscriptions
      : [];

    let updatedSubs = existingSubs;
    if (subJson && subJson.endpoint) {
      updatedSubs = [
        subJson,
        ...existingSubs.filter((s) => s && s.endpoint && s.endpoint !== subJson.endpoint),
      ].slice(0, 5); // Mantém até 5 aparelhos por usuário
    }

    const updatedPref = JSON.stringify({
      ...existingObj,
      push_enabled: true,
      push_subscriptions: updatedSubs,
      push_updated_at: new Date().toISOString(),
    });

    await supabase
      .from('profiles')
      .update({ theme_preference: updatedPref })
      .eq('id', userId);
  } catch (e) {
    console.warn('Não foi possível salvar assinatura push no perfil:', e);
  }
}

/**
 * Dispara uma notificação nativa imediatamente na barra de status do celular/computador
 * usando o Service Worker ativo (funciona em Android, iOS PWA, Windows e Mac).
 */
export async function showSystemTrayNotification(notif: AppNotification): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Verifica se essa notificação já foi enviada para a barra de status deste aparelho
    const traySentKey = 'oba_tray_notified_ids_v1';
    const alreadySent: string[] = JSON.parse(localStorage.getItem(traySentKey) || '[]');
    if (alreadySent.includes(notif.id)) {
      return false;
    }

    // Registra como enviada para a barra de status
    const updatedSent = Array.from(new Set([notif.id, ...alreadySent])).slice(0, 150);
    localStorage.setItem(traySentKey, JSON.stringify(updatedSent));

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(notif.title, {
      body: notif.message,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `oba-${notif.id}`,
      renotify: true,
      requireInteraction: false,
      vibrate: notif.is_urgent ? [300, 100, 300] : [200, 100, 200],
      data: {
        url: notif.link || '/doador',
        id: notif.id,
      },
    } as NotificationOptions);

    return true;
  } catch (err) {
    // Fallback para Notification direta caso o ServiceWorker ainda esteja inicializando
    try {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/icons/icon-192.png',
        tag: `oba-${notif.id}`,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Envia Web Push real em segundo plano via API Route para todos os membros (ou para um membro específico)
 * que ativaram notificações na barra do aparelho, mesmo quando estão com o app fechado.
 */
export async function triggerRemotePushBroadcast(payload: {
  title: string;
  message: string;
  link?: string;
  id?: string;
  is_urgent?: boolean;
  targetUserId?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignora falha silenciosamente para não bloquear o fluxo principal
  }
}
