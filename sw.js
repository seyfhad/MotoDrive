// MotoDrive Service Worker - versioned cache with aggressive cleanup
const CACHE_NAME = 'motodrive-v2.0-strict-user-app';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/assets/aistudio/pwa-icon.png', '/favicon.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => undefined))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol.startsWith('chrome') || url.origin.includes('googleapis.com') || url.origin.includes('supabase.co') || url.origin.includes('facebook.com')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && response.type === 'basic') caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.headers.get('accept')?.includes('text/html') ? caches.match('/index.html') : undefined))));
});

