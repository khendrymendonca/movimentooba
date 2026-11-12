// Service Worker do Movimento O Bom Amigo
// Habilita PWA Standalone (Sem barra de endereço de URL no navegador)

const CACHE_NAME = 'oba-pwa-v1';

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
