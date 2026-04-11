/**
 * Delta sync driver — pulls only changed rows since last successful sync
 * and writes them into the IndexedDB cache. Runs:
 *   • once on app mount (after auth)
 *   • every 5 minutes while tab is open and online
 *   • immediately on 'online' event after being offline
 */

import { db } from "./db"

const META_KEY = "lastSyncAt"
const MIN_INTERVAL_MS = 30_000  // don't hammer server — min 30s between syncs

let lastRun = 0
let syncing = false

export async function runDeltaSync(force = false): Promise<{
  ok: boolean
  counts?: Record<string, number>
}> {
  if (syncing) return { ok: false }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false }
  }
  const now = Date.now()
  if (!force && now - lastRun < MIN_INTERVAL_MS) return { ok: false }

  syncing = true
  try {
    const since = ((await db.get<string>("meta", META_KEY)) ?? "")
    const qs = since ? `?since=${encodeURIComponent(since)}` : ""
    const resp = await fetch(`/api/v1/sync/delta${qs}`, {
      credentials: "include",
      cache: "no-store",
    })
    if (!resp.ok) return { ok: false }
    const data = await resp.json()

    // Merge into cache: the delta endpoint returns only changed rows,
    // so we merge them onto whatever's already cached.
    const mergeInto = async (
      key: string,
      incoming: any[],
      idField = "id",
    ) => {
      const existing = ((await db.get<any[]>("cache", key)) ?? []) as any[]
      const map = new Map<string | number, any>()
      for (const row of existing) map.set(row[idField], row)
      for (const row of incoming) map.set(row[idField], row)
      await db.set("cache", key, Array.from(map.values()))
    }

    await Promise.all([
      mergeInto("tovarlar",  data.tovarlar  ?? []),
      mergeInto("klientlar", data.klientlar ?? []),
      mergeInto("sotuvlar",  data.sotuvlar  ?? []),
      mergeInto("kirimlar",  data.kirimlar  ?? []),
    ])

    if (data.now) await db.set("meta", META_KEY, data.now)
    lastRun = now
    return { ok: true, counts: data.counts }
  } catch {
    return { ok: false }
  } finally {
    syncing = false
  }
}

export function installDeltaSync(): () => void {
  if (typeof window === "undefined") return () => {}

  runDeltaSync(true).catch(() => null)

  const interval = window.setInterval(
    () => runDeltaSync().catch(() => null),
    5 * 60_000,
  )
  const onOnline = () => runDeltaSync(true).catch(() => null)
  window.addEventListener("online", onOnline)

  return () => {
    window.clearInterval(interval)
    window.removeEventListener("online", onOnline)
  }
}
