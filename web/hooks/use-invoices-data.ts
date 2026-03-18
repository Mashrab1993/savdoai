"use client"

import { useState, useEffect } from "react"
import { getInvoices } from "@/lib/api"
import type { Invoice } from "@/types"
import { invoices as mockInvoices } from "@/lib/mock-data"

/**
 * Invoices list: API first, mock fallback.
 */
export function useInvoicesData() {
  const [list, setList] = useState<Invoice[]>(mockInvoices)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getInvoices()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as Invoice[])
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

  return { invoices: list, loading, error }
}
