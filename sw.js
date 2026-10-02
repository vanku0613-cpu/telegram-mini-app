/* Application-wide resilience cache for the static GitHub Pages build. */
const CACHE_PREFIX = "izmail-directory-";
const STATIC_CACHE = CACHE_PREFIX + "static-v13";
const RUNTIME_CACHE = CACHE_PREFIX + "runtime-v13";
const OFFLINE_HOME = "./main-v2/index.html";

const APP_SHELL = [
  "./",
  OFFLINE_HOME,
  "./main-v2/main.css?v=31",
  "./main-v2/main.js?v=12",
  "./welcome.js?v=1",
  "./main-v2/settings.js?v=20261002-2",
  "./main-v2/stage-lock.js?v=1",
  "./home-info.css?v=19",
  "./home-weather.css?v=5",
  "./navigation.js?v=7",
  "./directory-search.js?v=19",
  "./directory-search.css?v=3",
  "./weather-source.js?v=2",
  "./view-counter.js?v=6",
  "./main-v2/frank-rates.js?v=8",
  "./assets/izmail-home-summer-day.webp",
];

function cacheKey(request) {
  const url = new URL(request.url);
  if (request.mode === "navigate") url.search = "";
  else {
    const version = url.searchParams.get("v");
    url.search = version ? "?v=" + encodeURIComponent(version) : "";
  }
  return new Request(url.href, { method: "GET" });
}

async function put(cacheName, request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;
  const cache = await caches.open(cacheName);
  await cache.put(cacheKey(request), response.clone());
  return response;
}

async function cached(request) {
  return caches.match(cacheKey(request));
}

async function networkWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal, cache: "no-cache" });
  } finally {
    clearTimeout(timer);
  }
}

async function networkFirst(request) {
  try {
    const response = await networkWithTimeout(request, 4500);
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await put(RUNTIME_CACHE, request, response);
  } catch (_) {
    return (await cached(request)) || (await caches.match(OFFLINE_HOME));
  }
}

async function staleWhileRevalidate(request, event) {
  const hit = await cached(request);
  const update = fetch(request, { cache: "no-cache" })
    .then(response => put(RUNTIME_CACHE, request, response))
    .catch(() => null);
  if (event) event.waitUntil(update);
  return hit || (await update) || Response.error();
}

async function cacheFirst(request) {
  const hit = await cached(request);
  if (hit) return hit;
  const response = await fetch(request);
  return put(RUNTIME_CACHE, request, response);
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(APP_SHELL.map(async path => {
      const request = new Request(path, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok) await cache.put(cacheKey(request), response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.endsWith(".json")) {
    event.respondWith(staleWhileRevalidate(request, event));
    return;
  }

  if (request.destination === "image" || /\.(?:webp|png|jpe?g|svg|gif|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, event));
});
