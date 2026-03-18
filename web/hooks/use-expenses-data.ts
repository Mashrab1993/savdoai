"use client"

import { useState, useEffect } from "react"
import { getExpenses } from "@/lib/api"
import type { Expense } from "@/types"
import { expenses as mockExpenses } from "@/lib/mock-data"

/**
 * Expenses list: API first, mock fallback.
 */
export function useExpensesData() {
  const [list, setList] = useState<Expense[]>(mockExpenses)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getExpenses()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as Expense[])
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

  return { expenses: list, loading, error }
}
