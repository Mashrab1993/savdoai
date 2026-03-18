"use client"

import { useState, useEffect } from "react"
import { getPriceGroups } from "@/lib/api"
import type { PriceGroup } from "@/types"
import { priceGroups as mockPriceGroups } from "@/lib/mock-data"

/**
 * Price groups: API first, mock fallback.
 */
export function usePricesData() {
  const [list, setList] = useState<PriceGroup[]>(mockPriceGroups)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getPriceGroups()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as PriceGroup[])
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

  return { priceGroups: list, loading, error }
}
