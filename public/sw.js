/**
 * Keeps the app's own files in a cache so it opens instantly on a second visit and still
 * starts when the phone briefly has no signal. Data is never cached — money numbers should
 * always come from the server.
 */
const CACHE = "paytrack-v1";
const PRECACHE = ["/icon-192.png", "/icon-512.png", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Anything under /api is live data — always go to the network.
  if (url.pathname.startsWith("/api/")) return;

  // Built assets are content-hashed, so they can be served from the cache forever.
  const isStatic = url.pathname.startsWith("/_next/static") || PRECACHE.includes(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Pages: try the network, fall back to the last copy if the phone is offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request))
  );
});
