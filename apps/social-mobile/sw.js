/* AliaSpaces packaged PWA worker. Caches same-origin app files only.
   It never claims a live database session or network publish. */
const CACHE = "aliaspaces-pwa-v1";
const ASSETS = [
  "./hub.html",
  "./live.html",
  "./persona.html",
  "./index.html",
  "./error.html",
  "./hub.webmanifest",
  "./social.webmanifest",
  "./persona.webmanifest",
  "./local.webmanifest",
  "./mark.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./src/ui/app.css",
  "./src/ui/app.js",
  "./src/domain/local-social.js",
  "./src/live/register-pwa.js",
  "./src/live/hub.js",
  "./src/live/contract.js",
  "./src/live/social-client.js",
  "./src/live/live-app.js",
  "./src/live/persona-page.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => cached || Response.error()))
  );
});
