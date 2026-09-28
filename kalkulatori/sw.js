const VERSION = "hisol-v19";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;

// Relative to this script's own location, so this works whether the app is
// served from a domain root or a subpath (e.g. GitHub Pages project sites).
const PRECACHE_URLS = [
  "./",
  "index.html",
  "css/styles.css",
  "../i18n.js",
  "js/app.js",
  "js/calculator.js",
  "js/format.js",
  "js/catalog.js",
  "js/pdf.js",
  "vendor/pdf-lib.min.js",
  "manifest.webmanifest",
  "assets/favicon.svg",
  "assets/hisol-logo-header.png",
  "assets/hisol-logo-pdf.png",
  "assets/app-icon-180.png",
  "assets/app-icon-192.png",
  "assets/app-icon-512.png",
];

// App code that affects pricing/behavior: always prefer a fresh copy over
// the network when online, falling back to the cached copy only offline.
// Large, rarely-changing assets (logos, datasheets, pdf-lib) stay cache-first
// below, since they don't need to be instantly fresh.
const NETWORK_FIRST_URLS = new Set(
  ["css/styles.css", "../i18n.js", "js/app.js", "js/calculator.js", "js/format.js", "js/catalog.js", "js/pdf.js"].map(
    (path) => new URL(path, self.location.href).pathname
  )
);

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
  // Only a genuinely OK response is cached as the offline fallback — caching an
  // error/redirect here would otherwise "brick" the app for repeat visitors even
  // after the real problem (e.g. a transient CDN hiccup) is fixed.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PRECACHE).then((cache) => cache.put("index.html", clone));
          }
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // App code (JS/CSS): network-first, so an online visitor always runs the
  // latest logic; only falls back to the cached copy when offline.
  if (NETWORK_FIRST_URLS.has(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PRECACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
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
