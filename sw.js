const CACHE = 'chord-pad-v75';
const OFFLINE_ASSETS = [
  './chord-pad.html',
  './chord-pad.css',
  './js/chord-pad.js',
  './js/midi.js',
  './js/audio.js',
  './js/seq.js',
  './js/pads.js',
  './js/kbinput.js',
  './js/pianoroll.js',
  './js/chordview.js',
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

// Big binary assets (SF2 sample bank) are immutable and ~148MB — never
// re-fetch if we already have them in cache. Everything else is network-
// first so updates land on the next refresh.
const CACHE_FIRST_PATTERNS = [/\.sf2$/i];

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (e.request.method !== 'GET') return;
  const cacheFirst = CACHE_FIRST_PATTERNS.some(re => re.test(url.pathname));
  if (cacheFirst) {
    e.respondWith(
      caches.open(CACHE).then(c => c.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) c.put(e.request, resp.clone()).catch(() => {});
          return resp;
        });
      }))
    );
    return;
  }
  // Network-first for everything else: fresh content on refresh, cache as
  // offline fallback.
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
