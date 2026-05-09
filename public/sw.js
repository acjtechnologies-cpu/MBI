const CACHE = 'f3f-pit-v2';
const ASSETS = [
  '/MBI/',
  '/MBI/index.html',
  '/MBI/manifest.json',
  '/MBI/icon-192.png',
  '/MBI/icon-512.png',
  '/MBI/assets/index-D4x_kqjk.js',
  '/MBI/assets/index-qX-kYOTi.css',
  '/MBI/assets/mamba_s-CH0qYdh0.png',
  '/MBI/assets/pike_precision2-B1C2EXV4.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
