"use client"

import { useState, useEffect } from "react"
import { getDashboardStats } from "@/lib/api"
import type { DashboardStats } from "@/lib/api"
import {
  invoices, debts, clients, expenses, cashTransactions, apprentices,
  recentActivity, monthlyRevenue, revenueByCategory, salesByClient,
} from "@/lib/mock-data"

/**
 * Dashboard data: API first, mock fallback. Replace mock with API response when backend is ready.
 */
export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getDashboardStats()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setStats(out.data)
        } else {
          setStats(null)
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

  const paidInvoices = invoices.filter((i) => i.status === "paid")
  const totalRevenue = stats?.totalRevenue ?? paidInvoices.reduce((s, i) => s + i.total, 0)
  const totalDebt = stats?.totalDebt ?? debts.filter((d) => d.status !== "paid").reduce((s, d) => s + (d.amount - d.paid), 0)
  const overdueCount = stats?.overdueCount ?? debts.filter((d) => d.status === "overdue").length
  const activeClients = stats?.activeClients ?? clients.filter((c) => c.status === "active").length
  const pendingExpenses = expenses.filter((e) => e.status === "pending").length
  const todayCashIncome = cashTransactions
    .filter((t) => t.type === "income" && t.date === "2025-03-19")
    .reduce((s, t) => s + t.amount, 0)
  const activeApprentices = apprentices.filter((a) => a.status === "active").length

  return {
    loading,
    error,
    totalRevenue,
    totalDebt,
    overdueCount,
    activeClients,
    pendingExpenses,
    todayCashIncome,
    activeApprentices,
    recentActivity,
    monthlyRevenue,
    revenueByCategory,
    salesByClient,
    invoices,
    debts,
  }
}
