// Mexausa LOAF Service Worker — Offline capability for field workers
const CACHE = 'loaf-v4';
const OFFLINE_URLS = [
  '/mfginc-loaf.html',
  '/AuditDNALOGO.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only intercept same-origin GET requests — never touch Railway API or external calls
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(res => {
      if (res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => {
      return caches.match(e.request).then(cached => {
        if (cached) return cached;
        if (e.request.mode === 'navigate') {
          return caches.match('/mfginc-loaf.html');
        }
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
