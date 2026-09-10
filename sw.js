const VERSION = "hisol-v1";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/app.js",
  "/js/calculator.js",
  "/js/format.js",
  "/js/pdf.js",
  "/vendor/pdf-lib.min.js",
  "/manifest.webmanifest",
  "/assets/favicon.svg",
  "/assets/hisol-logo-header.png",
  "/assets/hisol-logo-pdf.png",
  "/assets/app-icon-180.png",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so users always get the latest app shell when online.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(PRECACHE).then((cache) => cache.put("/index.html", clone));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Everything else (assets, datasheets, vendor libs): cache-first, populate runtime cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
