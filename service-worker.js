const CACHE_NAME = "offline-calculator-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/startup.png",
  "./src/app.js",
  "./src/calculator-core.js",
  "./src/styles.css",
];
const APP_SHELL_URLS = new Set(
  APP_SHELL.map((path) => new URL(path, self.registration.scope).href),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (!APP_SHELL_URLS.has(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request.url, responseCopy);
        });
        return networkResponse;
      });
    }),
  );
});
