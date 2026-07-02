// pwa-install.js
// Save to: C:\AuditDNA\frontend\public\pwa-install.js
// Loaded by index.html — registers service worker silently
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('[PWA] Service worker registered'))
      .catch((e) => console.warn('[PWA] SW registration failed:', e.message));
  });
}
