// MotoDrive Service Worker - versioned cache with aggressive cleanup
const CACHE_NAME = 'motodrive-v1.3-auth-fix';
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
self.addEventListener('push', event => { let data = { title: 'MotoDrive الجزائر', body: 'تنبيه جديد من التطبيق' }; try { if (event.data) data = event.data.json(); } catch (_) { if (event.data) data.body = event.data.text(); } event.waitUntil(self.registration.showNotification(data.title || 'MotoDrive', { body: data.body, icon: '/assets/aistudio/pwa-icon.png', badge: '/assets/aistudio/pwa-icon.png', vibrate: [200,100,200], data, actions: [{ action: 'open', title: 'فتح التطبيق' }] })); });
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => list.find(client => client.url && 'focus' in client)?.focus() || clients.openWindow?.('/'))); });
