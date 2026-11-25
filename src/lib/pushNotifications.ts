import { SupabaseClient } from '@supabase/supabase-js';
import { AppNotification } from '@/utils/donationRules';

// Chave Pública VAPID P-256 (Formato URL-Safe Base64) para Web Push Nativo
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BFzmYIr7qrRpwsm8Gdch2Gz0IUFTkGdZO_9H2TmbOGIVWmz1n1HcSbiwZd-A6hDhDy3o3Uk64IQvHZRBkQ8MP_A';

const PUSH_SUBS_GUIDE_TITLE = '[PUSH_SUBS]';

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
  return 'Notification' in window;
}

/**
 * Retorna o status atual da permissão de notificações do sistema operacional
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Garante que o Service Worker (/sw.js) esteja registrado e ativo antes de criar assinatura Push
 * ou exibir notificação na barra do aparelho.
 */
export async function ensureServiceWorkerReady(timeoutMs = 3500): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<ServiceWorkerRegistration | null>((resolve) =>
      setTimeout(() => resolve(reg || null), timeoutMs)
    );
    return (await Promise.race([readyPromise, timeoutPromise])) || reg || null;
  } catch (err) {
    console.warn('Service Worker indisponível no momento:', err);
    return null;
  }
}

/**
 * Sincroniza silenciosamente a assinatura Web Push caso o usuário já tenha autorizado o Chrome anteriormente.
 * Assim, mesmo que ele tenha clicado em "Permitir" na barra do Chrome, o aparelho fica registrado para receber Push fora do app.
 */
export async function ensurePushSubscriptionSynced(
  supabase: SupabaseClient,
  userId?: string
): Promise<PushSubscription | null> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;
  try {
    const registration = await ensureServiceWorkerReady();
    if (!registration || !('pushManager' in registration)) return null;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    if (subscription && userId) {
      const syncKey = `oba_push_synced_${userId}`;
      const lastEndpoint = sessionStorage.getItem(syncKey);
      if (lastEndpoint !== subscription.endpoint) {
        await saveUserPushSubscription(supabase, userId, subscription);
        sessionStorage.setItem(syncKey, subscription.endpoint);
      }
    }
    return subscription;
  } catch (err) {
    console.warn('Não foi possível sincronizar PushManager em segundo plano:', err);
    return null;
  }
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
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

    if (permission !== 'granted') {
      return {
        granted: false,
        error: 'Permissão de notificação negada nas configurações do navegador.',
      };
    }

    const registration = await ensureServiceWorkerReady();
    let subscription: PushSubscription | null = null;

    if (registration && 'pushManager' in registration) {
      try {
        subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey as unknown as BufferSource,
          });
        }
      } catch (subErr) {
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
 * e também sincroniza no store de push em donation_guides para alcance imediato.
 */
export async function saveUserPushSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscription: PushSubscription | null
): Promise<void> {
  if (!userId) return;
  const subJson = subscription ? subscription.toJSON() : null;

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

  // Salva também no store compartilhado de assinaturas caso o usuário seja ADM ou a tabela permita
  if (subJson && subJson.endpoint) {
    try {
      const { data: storeRow } = await supabase
        .from('donation_guides')
        .select('id, content')
        .eq('title', PUSH_SUBS_GUIDE_TITLE)
        .maybeSingle();

      const mapObj: Record<string, any[]> =
        storeRow?.content && storeRow.content.startsWith('{')
          ? JSON.parse(storeRow.content)
          : {};

      const userSubs = Array.isArray(mapObj[userId]) ? mapObj[userId] : [];
      mapObj[userId] = [
        subJson,
        ...userSubs.filter((s) => s && s.endpoint && s.endpoint !== subJson.endpoint),
      ].slice(0, 5);

      if (storeRow?.id) {
        await supabase
          .from('donation_guides')
          .update({ content: JSON.stringify(mapObj), updated_by: userId })
          .eq('id', storeRow.id);
      } else {
        await supabase
          .from('donation_guides')
          .insert([{ title: PUSH_SUBS_GUIDE_TITLE, content: JSON.stringify(mapObj), updated_by: userId }]);
      }
    } catch {}
  }
}

/**
 * Dispara uma notificação nativa imediatamente na barra de status do celular/computador
 * usando o Service Worker ativo ou a Notification API direta do Chrome/Windows/Android.
 */
export async function showSystemTrayNotification(
  notif: AppNotification,
  options?: { force?: boolean }
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const traySentKey = 'oba_tray_notified_ids_v2';
    const alreadySent: string[] = JSON.parse(localStorage.getItem(traySentKey) || '[]');
    if (!options?.force && alreadySent.includes(notif.id)) {
      return false;
    }

    const targetUrl = notif.link || '/doador';
    const tag = notif.id.startsWith('oba-') ? notif.id : `oba-${notif.id}`;

    let displayed = false;

    // 1. Tenta via Service Worker Registration (padrão Android/Chrome e PWA)
    const registration = await ensureServiceWorkerReady(2500);
    if (registration && typeof registration.showNotification === 'function') {
      try {
        await registration.showNotification(notif.title, {
          body: notif.message,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag,
          renotify: true,
          requireInteraction: false,
          vibrate: notif.is_urgent ? [300, 100, 300] : [200, 100, 200],
          data: {
            url: targetUrl,
            id: notif.id,
          },
        } as NotificationOptions);
        displayed = true;
      } catch (swErr) {
        console.warn('Fallback de ServiceWorker.showNotification para Notification direta:', swErr);
      }
    }

    // 2. Fallback direto via window.Notification (garante exibição no Chrome Desktop/Mobile mesmo sem SW ativo)
    if (!displayed) {
      const directNotif = new Notification(notif.title, {
        body: notif.message,
        icon: '/icons/icon-192.png',
        tag,
      });
      directNotif.onclick = () => {
        window.focus();
        window.location.href = targetUrl;
        directNotif.close();
      };
      displayed = true;
    }

    if (displayed && !options?.force) {
      const updatedSent = Array.from(new Set([notif.id, ...alreadySent])).slice(0, 150);
      localStorage.setItem(traySentKey, JSON.stringify(updatedSent));
    }

    return displayed;
  } catch (err) {
    console.warn('Não foi possível exibir notificação na barra do sistema:', err);
    return false;
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
}): Promise<{ ok: boolean; sent?: number }> {
  if (typeof window === 'undefined') return { ok: false };
  try {
    let accessToken: string | undefined;
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token;
    } catch {}

    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    return { ok: Boolean(data?.ok), sent: data?.sent || 0 };
  } catch {
    return { ok: false };
  }
}
