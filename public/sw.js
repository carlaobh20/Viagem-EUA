const CACHE = 'viagem-eua-v1';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((c) => Promise.all(c.filter((x) => x !== CACHE).map((x) => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.url.includes('supabase') || req.url.includes('/api/')) return;
  event.respondWith(fetch(req).then((res) => { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}); return res; }).catch(() => caches.match(req)));
});
