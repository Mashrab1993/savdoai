"use client"

import { useState, useEffect } from "react"
import { getDebts } from "@/lib/api"
import type { Debt } from "@/types"
import { debts as mockDebts } from "@/lib/mock-data"

/**
 * Debts list: API first, mock fallback.
 */
export function useDebtsData() {
  const [list, setList] = useState<Debt[]>(mockDebts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getDebts()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as Debt[])
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

  return { debts: list, loading, error }
}
