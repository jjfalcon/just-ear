const CACHE_NAME = 'justear-demo-cache-v1';
const urlsToCache = [
  '/',
//  '/demo.html',
//  '/demo.js',
'/favicon.ico',
'/manifest.json',
  '/JE-192.png',
  '/JE-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
