/**
 * Offline mutation queue flusher.
 *
 * - Runs on window "online" event.
 * - Also runs periodically (30s) while tab is open and online.
 * - Each queued mutation is retried with exponential backoff; on 4xx
 *   (non-retryable) the item is dropped with a toast; on network error
 *   it stays in the queue.
 */

import { db, type QueuedMutation } from "./db"

const MAX_RETRIES = 8

let flushing = false

export async function flushQueue(): Promise<{
  sent: number
  failed: number
  dropped: number
}> {
  if (flushing) return { sent: 0, failed: 0, dropped: 0 }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { sent: 0, failed: 0, dropped: 0 }
  }
  flushing = true
  let sent = 0,
    failed = 0,
    dropped = 0

  try {
    const items = await db.listQueue()
    items.sort((a, b) => a.queuedAt - b.queuedAt)

    for (const it of items) {
      if (!it.id) continue
      if (it.retries >= MAX_RETRIES) {
        await db.removeFromQueue(it.id)
        dropped++
        continue
      }
      try {
        const resp = await fetch(it.url, {
          method: it.method,
          headers: {
            "Content-Type": "application/json",
            ...(it.headers || {}),
          },
          body: it.body ? JSON.stringify(it.body) : undefined,
          credentials: "include",
        })
        if (resp.ok) {
          await db.removeFromQueue(it.id)
          sent++
        } else if (resp.status >= 400 && resp.status < 500) {
          // client error — will never succeed, drop it
          await db.removeFromQueue(it.id)
          dropped++
        } else {
          await db.incrementRetry(it.id)
          failed++
        }
      } catch {
        await db.incrementRetry(it.id)
        failed++
      }
    }
  } finally {
    flushing = false
  }

  return { sent, failed, dropped }
}

export function installSyncListeners(): () => void {
  if (typeof window === "undefined") return () => {}

  const onOnline = () => {
    flushQueue().catch(() => null)
  }
  window.addEventListener("online", onOnline)

  const interval = window.setInterval(() => {
    if (navigator.onLine) flushQueue().catch(() => null)
  }, 30_000)

  // Run once on mount in case there's already a pending queue
  flushQueue().catch(() => null)

  return () => {
    window.removeEventListener("online", onOnline)
    window.clearInterval(interval)
  }
}

/**
 * Helper to be used by mutation wrappers:
 *   • If online → fire normal fetch
 *   • If offline or request fails → enqueue for later
 */
export async function fetchOrQueue(
  url: string,
  init: RequestInit & { body?: string },
): Promise<Response> {
  const isMutation = init.method && init.method !== "GET"
  const online = typeof navigator === "undefined" || navigator.onLine

  if (!isMutation || online) {
    try {
      return await fetch(url, init)
    } catch (err) {
      if (!isMutation) throw err
      // fall through to enqueue
    }
  }

  await db.enqueue({
    url,
    method: (init.method as QueuedMutation["method"]) || "POST",
    body: init.body ? JSON.parse(init.body as string) : undefined,
    headers: init.headers as Record<string, string> | undefined,
  })
  // Synthetic accepted response so the UI treats it as optimistic
  return new Response(
    JSON.stringify({ offline: true, queued: true }),
    { status: 202, headers: { "Content-Type": "application/json" } },
  )
}
