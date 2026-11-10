// Padel Score service worker (from gym-coach): makes the site installable and usable offline.
// Network-first for everything; the cache is only the offline fallback.
// GitHub Pages sends max-age=600, so fetches use cache: 'no-cache' and a new release shows on the next open.
// CACHE is named after the version (checked by scripts/validate.mjs). Each release changes this file, so the
// browser installs the new worker, which takes over at once and deletes every older cache.
const CACHE = 'padel-score-0.6.2';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'match.js', 'scoring.js', 'voice.js', 'mascot.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png', 'data/lines.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (request.method !== 'GET' || (url.origin !== location.origin && !fonts)) return;
  e.respondWith(fetch(request, fonts ? {} : { cache: 'no-cache' })
    .then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
      return res;
    })
    .catch(() => caches.match(request, { ignoreSearch: true })
      .then((hit) => hit || (request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
