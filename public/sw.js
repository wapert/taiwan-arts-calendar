// CACHE_VERSION is replaced at build time by the deploy timestamp.
// This forces the old cache to be cleared on every new deployment.
const CACHE_NAME = 'taiwan-arts-calendar-__BUILD_TIME____BUILD_TIME__';

// Core app shell files to cache on install
const PRECACHE_URLS = [
  '/',
  '/events.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/events.json, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always fetch events.json from network, fall back to cache
  if (url.pathname === '/events.json' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else (app shell, icons, fonts)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
