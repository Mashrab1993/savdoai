"use client"

import { useState, useEffect } from "react"
import { getReportSummary } from "@/lib/api"
import {
  monthlyRevenue as mockMonthlyRevenue,
  revenueByCategory as mockRevenueByCategory,
  salesByClient as mockSalesByClient,
} from "@/lib/mock-data"

/**
 * Reports/summary data: API first, mock fallback.
 */
export function useReportsData() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(mockMonthlyRevenue)
  const [revenueByCategory, setRevenueByCategory] = useState(mockRevenueByCategory)
  const [salesByClient, setSalesByClient] = useState(mockSalesByClient)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getReportSummary()
      .then((out) => {
        if (cancelled) return
        if ("data" in out && out.data) {
          if (out.data.monthlyRevenue) setMonthlyRevenue(out.data.monthlyRevenue)
          if (out.data.revenueByCategory) setRevenueByCategory(out.data.revenueByCategory)
          if (out.data.salesByClient) setSalesByClient(out.data.salesByClient)
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

  return { monthlyRevenue, revenueByCategory, salesByClient, loading, error }
}
