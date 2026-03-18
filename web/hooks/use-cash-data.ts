"use client"

import { useState, useEffect } from "react"
import { getCashTransactions } from "@/lib/api"
import type { CashTransaction } from "@/types"
import { cashTransactions as mockCash } from "@/lib/mock-data"

/**
 * Cash transactions: API first, mock fallback.
 */
export function useCashData() {
  const [list, setList] = useState<CashTransaction[]>(mockCash)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCashTransactions()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as CashTransaction[])
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

  return { cashTransactions: list, loading, error }
}
