const CACHE_NAME = "fits-shell-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];
const MAX_ENTRIES = 100;

function cacheable(response) {
  return response.ok && !response.redirected && response.type !== "opaqueredirect";
}

// Store ok responses only, then drop the oldest non-shell entries beyond MAX_ENTRIES.
function store(key, response) {
  return caches
    .open(CACHE_NAME)
    .then((cache) =>
      cache
        .put(key, response)
        .then(() => cache.keys())
        .then((keys) => {
          const shell = APP_SHELL.map((p) => new URL(p, self.location.origin).href);
          const old = keys.filter((k) => !shell.includes(new URL(k.url).href));
          return Promise.all(old.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((k) => cache.delete(k)));
        })
    )
    .catch(() => {});
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Query-less key so /train?workoutId=a and =b share one entry.
    const key = url.origin + url.pathname;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cacheable(response)) event.waitUntil(store(key, response.clone()));
          return response;
        })
        .catch(() => caches.match(key, { ignoreSearch: true }).then((cached) => cached ?? caches.match("/")))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (cacheable(response)) event.waitUntil(store(request, response.clone()));
            return response;
          })
      )
    );
  }
});
