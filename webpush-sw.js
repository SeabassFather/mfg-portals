// C:\AuditDNA\frontend\public\webpush-sw.js
// Phase 1 Day 4 - Service worker for native Web Push
// Browser registers this when grower/buyer enables push notifications.
//
// Registration happens in useWebPush.js hook.
// This file MUST be served from the root of the domain (public/ in CRA = served at /).

self.addEventListener('install', (event) => {
  // Activate immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take over open clients immediately
  event.waitUntil(clients.claim());
});

// ----------------------------------------------------------------------------
// PUSH event - server pushed a notification to this device
// ----------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = { title: 'AuditDNA', body: 'New notification', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const title = data.title || 'AuditDNA';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'auditdna',
    data: { url: data.url || '/', ...(data.data || {}) },
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ----------------------------------------------------------------------------
// CLICK event - user tapped the notification
// ----------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // If app is already open, focus it and navigate
    for (const c of all) {
      if (c.url.includes(self.location.origin)) {
        c.focus();
        if ('navigate' in c) {
          try { await c.navigate(url); } catch (e) {}
        }
        return;
      }
    }
    // Otherwise open new window
    if (clients.openWindow) await clients.openWindow(url);
  })());
});

// ----------------------------------------------------------------------------
// SUBSCRIPTION CHANGE - browser refreshed the push subscription
// ----------------------------------------------------------------------------
self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe and notify backend
  event.waitUntil((async () => {
    try {
      const reg = await self.registration;
      const oldEndpoint = event.oldSubscription && event.oldSubscription.endpoint;
      // Need to know the VAPID public key + user_id - cannot do without main thread.
      // Best practice: post a message to clients so they can re-subscribe.
      const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of all) {
        c.postMessage({ type: 'push-subscription-change', oldEndpoint });
      }
    } catch (e) {
      console.error('[sw] pushsubscriptionchange handler failed:', e);
    }
  })());
});
