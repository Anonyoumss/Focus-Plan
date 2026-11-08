/* Focus Plan service worker — runtime caching, no build step needed.
   Works under any base path ('/Focus-Plan/' or '/'): all URLs are resolved
   relative to this script's own location, so './' is the app root. */
const CACHE = 'focus-plan-shell-v1';
const INDEX = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const files = [INDEX, './manifest.json', './icon.svg', './favicon-32.png', './apple-touch-icon.png'];
      // precache.json is emitted by the Vite build plugin and lists every
      // hashed asset (including lazy route chunks). Missing file = dev/old
      // build; runtime caching below still covers what the page requests.
      try {
        const res = await fetch('./precache.json');
        if (res.ok) {
          const list = await res.json();
          for (const f of list) files.push('./' + f);
        }
      } catch { /* precache manifest unavailable */ }
      await Promise.all(files.map((f) => cache.add(f).catch(() => {})));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to the cached app shell so the
  // installed PWA still loads offline (timer + tasks live in localStorage).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(INDEX, copy));
          }
          return res;
        })
        .catch(() => caches.match(INDEX).then((hit) => hit || caches.match('./'))),
    );
    return;
  }

  // Same-origin assets (JS/CSS/fonts/images): cache-first, fill on miss.
  // Hashed build assets get cached on first online visit; stale entries are
  // harmless because index.html always references the current hashes.
  event.respondWith(
    caches.match(request, { ignoreVary: true, ignoreSearch: true }).then((hit) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || fetched;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
