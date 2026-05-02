"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/offline/db"

/**
 * useCachedList — instant-render hook backed by IndexedDB.
 *
 *   const { data, loading, fromCache } = useCachedList("tovarlar", fetcher)
 *
 * Flow:
 *   1. On mount, read cache/<key> from IndexedDB → set as initial data
 *      (no loading spinner if cache exists).
 *   2. In parallel, call fetcher(); if it returns data, update state and
 *      write through to cache.
 *   3. If fetcher fails (offline), keep the cached data visible.
 *
 * Use this to make every list screen feel instant even on cold start.
 */
export function useCachedList<T>(
  key: string,
  fetcher: () => Promise<T[]>,
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      // 1. Load from cache first
      try {
        const cached = (await db.get<T[]>("cache", key)) ?? []
        if (mounted && cached.length > 0) {
          setData(cached)
          setFromCache(true)
          setLoading(false)
        }
      } catch {
        /* ignore */
      }

      // 2. Fetch fresh in background
      try {
        const fresh = await fetcher()
        if (!mounted) return
        setData(fresh)
        setFromCache(false)
        setError(null)
        // Write through
        db.set("cache", key, fresh).catch(() => null)
      } catch (err) {
        if (!mounted) return
        setError((err as Error).message || "Tarmoq xatosi")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [key])

  return { data, loading, error, fromCache }
}
