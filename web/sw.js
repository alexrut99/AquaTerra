// AquaTerra service worker: keeps the app usable offline once it has been opened.
// The page is fetched network-first so a new deploy shows up on the next visit;
// libraries, fonts and icons come from the cache. Map tiles are never cached.
const CACHE = 'aquaterra-shell-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'favicon.png', 'icon-192.png', 'icon-512.png',
  'fonts/fonts.css',
  'vendor/chart.umd.js', 'vendor/hammer.min.js', 'vendor/chartjs-plugin-zoom.min.js',
  'vendor/xlsx.full.min.js', 'vendor/jszip.min.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // tiles and other sites go straight to the network

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
