/* Manual APS offline — cache integral, independente de API. */
const ROOT=new URL('./',self.location.href).href;
const PREFIX='manual-aps-offline-';
const CACHE=PREFIX+'20261116-v1:'+ROOT;
const ASSETS=['index.html','manifest.webmanifest','icon-192.png','icon-512.png'].map(f=>new URL(f,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key.endsWith(':'+ROOT)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  const exact=url.origin+url.pathname;
  const index=ASSETS[0];
  if(request.mode==='navigate'&&(exact===ROOT||exact===index)){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);return (await cache.match(index))||fetch(request)})());return;
  }
  if(ASSETS.includes(exact))event.respondWith((async()=>{const cache=await caches.open(CACHE);return (await cache.match(exact))||fetch(request)})());
});
