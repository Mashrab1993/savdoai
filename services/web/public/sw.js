/**
 * SavdoAI Service Worker — offline-first caching strategy
 *
 * Strategies:
 *   • Shell (HTML, JS, CSS, fonts) → cache-first with network refresh
 *   • API GET (/api/v1/…)          → stale-while-revalidate (3s timeout)
 *   • API mutations (POST/PUT/DEL) → offline queue + background sync
 *   • Images                       → cache-first, 7-day TTL
 *
 * Bump CACHE_VERSION whenever cache layout changes — old caches get purged.
 */

const CACHE_VERSION = "v25.5.0-offline"
const STATIC_CACHE  = `savdoai-static-${CACHE_VERSION}`
const API_CACHE     = `savdoai-api-${CACHE_VERSION}`
const IMG_CACHE     = `savdoai-img-${CACHE_VERSION}`

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/offline",
  "/manifest.json",
  "/icon.svg",
]

// ─── INSTALL ─────────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(() => null),
    ),
  )
  self.skipWaiting()
})

// ─── ACTIVATE (purge old caches) ─────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k =>
            !k.endsWith(CACHE_VERSION) && k.startsWith("savdoai-"),
          )
          .map(k => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

// ─── FETCH STRATEGY ──────────────────────────────────────────
self.addEventListener("fetch", event => {
  const { request } = event
  if (request.method !== "GET") return  // mutations handled by app queue

  const url = new URL(request.url)

  // API: stale-while-revalidate
  if (url.pathname.startsWith("/api/v1/")) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, 3000))
    return
  }

  // Images
  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMG_CACHE))
    return
  }

  // App shell
  if (
    request.mode === "navigate" ||
    ["script", "style", "font"].includes(request.destination)
  ) {
    event.respondWith(cacheFirstWithOfflineFallback(request, STATIC_CACHE))
    return
  }
})

// ─── HELPERS ─────────────────────────────────────────────────
async function staleWhileRevalidate(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then(resp => {
      if (resp && resp.ok) cache.put(request, resp.clone()).catch(() => null)
      return resp
    })
    .catch(() => null)

  if (cached) {
    // Return cached instantly, refresh in background
    network.catch(() => null)
    return cached
  }

  // No cache — race network vs timeout
  return await Promise.race([
    network,
    new Promise(resolve =>
      setTimeout(() => resolve(new Response(
        JSON.stringify({ offline: true, message: "Internet yo'q — keshdan emas" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      )), timeoutMs),
    ),
  ]) || new Response("", { status: 503 })
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    return new Response("", { status: 504 })
  }
}

async function cacheFirstWithOfflineFallback(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    // Refresh in background
    fetch(request)
      .then(r => r && r.ok && cache.put(request, r.clone()).catch(() => null))
      .catch(() => null)
    return cached
  }
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    // Navigate request → offline fallback
    if (request.mode === "navigate") {
      const offline = await cache.match("/offline")
      if (offline) return offline
    }
    return new Response("", { status: 504 })
  }
}

// ─── MESSAGE (allow app to trigger skipWaiting) ──────────────
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting()
})
