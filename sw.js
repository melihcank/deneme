// Basit offline-first service worker
const CACHE_VERSION = 'planner-v1.0.1'; // ← ikonları değiştirdiğin için artırdık
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/style.css',
  './assets/app.js',
  './icons/icon-128.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        const resClone = res.clone();
        if (req.url.startsWith(self.location.origin)) {
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
