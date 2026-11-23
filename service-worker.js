/* Manual APS offline — atualizacao automatica, com fallback offline.
   Mesma chave de cache esperada pelo index.html publicado. */
const ROOT = new URL('./', self.location.href).href;
const PREFIX = 'manual-aps-offline-';
const CACHE = PREFIX + '20261116-v3:' + ROOT;
const ASSETS = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']
  .map(file => new URL(file, ROOT).href);
const INDEX = ASSETS[0];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key.endsWith(':' + ROOT) && key !== CACHE) {
        await caches.delete(key);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const exact = url.origin + url.pathname;
  const isManualPage = request.mode === 'navigate' &&
    (exact === ROOT || exact === INDEX);
  if (!isManualPage && !ASSETS.includes(exact)) return;

  const cacheKey = exact === ROOT ? INDEX : exact;
  event.respondWith((async () => {
    let onlineResponse;
    try {
      onlineResponse = await fetch(request, {cache: 'no-cache'});
      if (onlineResponse.ok) {
        const copy = onlineResponse.clone();
        try {
          const cache = await caches.open(CACHE);
          await cache.put(cacheKey, copy);
        } catch (cacheError) {}
        return onlineResponse;
      }
    } catch (networkError) {}
    const cached = await caches.match(cacheKey);
    return cached || onlineResponse || Response.error();
  })());
});
