// RoleFuse Official PWA Service Worker
const CACHE_NAME = "rolefuse-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Security: Never cache API endpoints, Supabase auth/data, authenticated routes, or non-GET requests
  if (
    event.request.method !== "GET" ||
    url.includes("/api/") ||
    url.includes("supabase.co") ||
    url.includes("/dashboard") ||
    url.includes("/admin") ||
    url.includes("/auth/")
  ) {
    return;
  }

  // Purely static offline fallback for landing page & public icon assets only
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

