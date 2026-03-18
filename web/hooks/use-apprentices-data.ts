"use client"

import { useState, useEffect } from "react"
import { getApprentices } from "@/lib/api"
import type { Apprentice } from "@/types"
import { apprentices as mockApprentices } from "@/lib/mock-data"

/**
 * Apprentices list: API first, mock fallback.
 */
export function useApprenticesData() {
  const [list, setList] = useState<Apprentice[]>(mockApprentices)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getApprentices()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as Apprentice[])
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { apprentices: list, loading, error }
}
