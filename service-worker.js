// LOAF PWA Service Worker — offline-first for growers in the field
const CACHE = 'loaf-v3';
const STATIC = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(url.hostname==='localhost'||url.hostname==='127.0.0.1')return;
  if(url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if(res && res.status === 200) {
        const c = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, c));
      }
      return res;
    }))
  );
});

// Background sync — send offline inventory posts when connection returns
self.addEventListener('sync', e => {
  if(e.tag === 'loaf-inventory-sync') {
    e.waitUntil(
      self.registration.sync.getTags().then(() => {
        // Notify clients to retry pending posts
        self.clients.matchAll().then(clients =>
          clients.forEach(c => c.postMessage({ type: 'SYNC_INVENTORY' }))
        );
      })
    );
  }
});
