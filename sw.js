// ============================================================================
// sw.js — AuditDNA Agriculture Service Worker
// Cache bump: 2026-06-13T10:10:52.002388Z
// MexaUSA Food Group, Inc.
// Save to: C:\AuditDNA\frontend\public\sw.js
// Enables: Add to Home Screen, offline shell, fast repeat loads
// ============================================================================

const CACHE_NAME   = 'auditdna-v4-jun13';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/ADNA_THELOGO.png',
  '/seabass2.jpg',
  '/saul-garcia.jpg',
  '/Salinas-Sign.png',
];

// Install — cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // Non-fatal — continue even if some assets are missing
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for API calls, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip localhost entirely — never intercept dev/agent calls
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  // Always go network-first for API calls — never serve stale data
  if (url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline — API unavailable', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Cache-first for static assets (images, JS chunks, CSS)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful GET responses for static assets
        if (
          response.ok &&
          event.request.method === 'GET' &&
          (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ico)$/) ||
           url.pathname === '/' ||
           url.pathname === '/index.html')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return cached index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
