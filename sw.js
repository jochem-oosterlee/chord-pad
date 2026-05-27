const CACHE = 'chord-pad-v3';
const OFFLINE_ASSETS = [
  './chord-pad.html',
  './chord-pad.css',
  './chord-pad.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first: always try the network, fall back to cache only when offline
self.addEventListener('fetch', e => {
  // Only HTTP(S) requests are cacheable. Chrome-extension://, data:, blob:,
  // chrome://, etc. throw when passed to Cache.put — skip them entirely.
  const url = new URL(e.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  // Only cache GETs; PUT/POST/etc. aren't valid cache keys.
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
