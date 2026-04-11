/**
 * Minimal IndexedDB wrapper (no dep) — 3 stores:
 *   • cache    — generic key-value (tovarlar, klientlar, dashboard snapshot)
 *   • queue    — pending mutations (POST/PUT/DELETE) while offline
 *   • meta     — last-sync timestamps per resource
 *
 * Usage:
 *   import { db } from "@/lib/offline/db"
 *   await db.set("cache", "tovarlar", items)
 *   const items = await db.get("cache", "tovarlar")
 *   await db.enqueue({ url, method, body })
 */

type StoreName = "cache" | "queue" | "meta"

const DB_NAME = "savdoai"
const DB_VERSION = 1

let _dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"))
  }
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const idb = req.result
      if (!idb.objectStoreNames.contains("cache")) {
        idb.createObjectStore("cache")
      }
      if (!idb.objectStoreNames.contains("queue")) {
        idb.createObjectStore("queue", {
          keyPath: "id",
          autoIncrement: true,
        })
      }
      if (!idb.objectStoreNames.contains("meta")) {
        idb.createObjectStore("meta")
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return _dbPromise
}

async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const idb = await openDB()
  return new Promise<T>((resolve, reject) => {
    const tx = idb.transaction(store, mode)
    const os = tx.objectStore(store)
    const req = fn(os)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export type QueuedMutation = {
  id?: number
  url: string
  method: "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
  queuedAt: number
  retries: number
}

export const db = {
  // ── cache (generic key → json) ─────────────────────────
  async get<T = unknown>(store: StoreName, key: string): Promise<T | undefined> {
    try {
      return (await run<T>(store, "readonly", s => s.get(key) as IDBRequest<T>)) as T
    } catch {
      return undefined
    }
  },
  async set(store: StoreName, key: string, value: unknown): Promise<void> {
    try {
      await run(store, "readwrite", s => s.put(value as any, key))
    } catch {
      /* swallow — cache is best-effort */
    }
  },
  async del(store: StoreName, key: string): Promise<void> {
    try {
      await run(store, "readwrite", s => s.delete(key))
    } catch {
      /* noop */
    }
  },

  // ── mutation queue ─────────────────────────────────────
  async enqueue(
    item: Omit<QueuedMutation, "id" | "queuedAt" | "retries">,
  ): Promise<number> {
    const full: QueuedMutation = {
      ...item,
      queuedAt: Date.now(),
      retries: 0,
    }
    return (await run<IDBValidKey>("queue", "readwrite", s =>
      s.add(full) as IDBRequest<IDBValidKey>,
    )) as number
  },
  async listQueue(): Promise<QueuedMutation[]> {
    try {
      return (await run<QueuedMutation[]>("queue", "readonly", s =>
        s.getAll() as IDBRequest<QueuedMutation[]>,
      )) as QueuedMutation[]
    } catch {
      return []
    }
  },
  async removeFromQueue(id: number): Promise<void> {
    try {
      await run("queue", "readwrite", s => s.delete(id))
    } catch {
      /* noop */
    }
  },
  async incrementRetry(id: number): Promise<void> {
    const items = await this.listQueue()
    const it = items.find(x => x.id === id)
    if (!it) return
    it.retries += 1
    try {
      await run("queue", "readwrite", s => s.put(it))
    } catch {
      /* noop */
    }
  },
}
