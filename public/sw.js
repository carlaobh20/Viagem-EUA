const CACHE = 'viagem-eua-v1';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.url.includes('supabase')) return;
  event.respondWith(
    fetch(req).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match(req))
  );
});
