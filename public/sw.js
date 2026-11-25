// Service Worker do Movimento O Bom Amigo
// Habilita PWA Standalone (Sem barra de endereço de URL no navegador)
// e Notificações Web Push Nativas na Barra de Status do Celular/Computador

const CACHE_NAME = 'oba-pwa-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through seguro para permitir funcionamento offline básico
  // sem interferir nas chamadas de autenticação do Supabase ou API do Next.js
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ============================================================================
// RECEBIMENTO DE NOTIFICAÇÕES PUSH NA BARRA DE NOTIFICAÇÕES DO DISPOSITIVO
// ============================================================================
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Movimento O Bom Amigo',
    body: 'Você tem uma nova atualização no aplicativo!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'oba-notification-' + Date.now(),
    url: '/doador',
    urgent: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = {
        ...payload,
        ...data,
        title: data.title || payload.title,
        body: data.body || data.message || payload.body,
        tag: data.tag || data.id || payload.tag,
        url: data.url || data.link || payload.url,
        urgent: Boolean(data.urgent || data.is_urgent),
      };
    } catch {
      try {
        const txt = event.data.text();
        if (txt) payload.body = txt;
      } catch {}
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    tag: payload.tag,
    renotify: true,
    requireInteraction: false, // Permite que o usuário arraste para o lado e ignore normalmente na barra do celular
    vibrate: payload.urgent ? [300, 100, 300] : [200, 100, 200],
    data: {
      url: payload.url || '/doador',
      id: payload.id || payload.tag,
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir Aplicativo',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Ao tocar na notificação da barra do celular/computador, abre ou foca o aplicativo na rota/notícia exata
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawTargetUrl = (event.notification.data && event.notification.data.url) || '/doador';
  const fullTargetUrl = new URL(rawTargetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(fullTargetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullTargetUrl);
      }
    })
  );
});
