"use client"

import { useState, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Download, TrendingUp, Users, DollarSign, Package, Loader2 } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { reportService, dashboardService } from "@/lib/api/services"
import { normalizeDashboard } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"
import type { ReportEntry } from "@/lib/api/types"

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

// Normalise a ReportEntry array into chart-friendly shape
function normalizeEntries(entries: ReportEntry[]) {
  return entries.map(e => ({
    label: e.month ?? e.week ?? e.date ?? e.label ?? "",
    income: e.income ?? e.revenue ?? 0,
    outcome: e.outcome ?? e.expenses ?? 0,
  }))
}

export default function ReportsPage() {
  const { locale } = useLocale()
  const L = translations.reports

  const [dateRange, setDateRange] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  // ── API data ────────────────────────────────────────────────────────────────
  const { data: rawDashboard, loading: dashLoading, error: dashError, refetch: refetchDash } = useApi(dashboardService.get)
  const dailyFetcher = useCallback(() => reportService.daily(), [])
  const weeklyFetcher = useCallback(() => reportService.weekly(), [])
  const monthlyFetcher = useCallback(() => reportService.monthly(), [])

  const { data: dailyRaw, loading: dailyLoading, error: dailyError, refetch: refetchDaily } = useApi(dailyFetcher)
  const { data: weeklyRaw, loading: weeklyLoading, error: weeklyError, refetch: refetchWeekly } = useApi(weeklyFetcher)
  const { data: monthlyRaw, loading: monthlyLoading, error: monthlyError, refetch: refetchMonthly } = useApi(monthlyFetcher)

  const dashboard = rawDashboard ? normalizeDashboard(rawDashboard) : null

  // Pick active data based on selected range
  const activeRaw: ReportEntry[] =
    dateRange === "daily" ? (dailyRaw ?? []) :
    dateRange === "weekly" ? (weeklyRaw ?? []) :
    (monthlyRaw ?? [])

  const chartData = normalizeEntries(activeRaw)

  const loading = dashLoading || (dateRange === "daily" ? dailyLoading : dateRange === "weekly" ? weeklyLoading : monthlyLoading)
  const error = dashError ?? (dateRange === "daily" ? dailyError : dateRange === "weekly" ? weeklyError : monthlyError)

  // ── KPI cards from dashboard endpoint ──────────────────────────────────────
  const totalRevenue = dashboard?.totalRevenue ?? 0
  const activeClients = dashboard?.activeClients ?? 0
  const totalInvoices = dashboard?.totalInvoices ?? 0
  const totalDebt = dashboard?.totalDebt ?? 0

  const kpiCards = [
    { label: L.totalRevenue[locale],  value: fmt(totalRevenue),     icon: DollarSign, color: "text-primary"      },
    { label: L.activeClients[locale], value: String(activeClients), icon: Users,      color: "text-blue-500"     },
    { label: L.totalProducts[locale], value: String(totalInvoices), icon: Package,    color: "text-yellow-500"   },
    { label: L.avgOrder[locale],      value: fmt(totalDebt),        icon: TrendingUp, color: "text-green-500"    },
  ]

  // ── Export flow ─────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    setExportDone(false)
    try {
      const task = await reportService.requestExport({ type: dateRange })
      // Poll for completion (max 10s)
      let attempts = 0
      let status = task.status
      let taskId = task.task_id
      while (status !== "done" && status !== "failed" && attempts < 10) {
        await new Promise(r => setTimeout(r, 1000))
        const updated = await reportService.exportStatus(taskId)
        status = updated.status
        attempts++
      }
      if (status === "done") {
        const url = reportService.exportFile(taskId)
        window.open(url, "_blank")
        setExportDone(true)
      }
    } catch {
      // silently fail — button resets
    } finally {
      setExporting(false)
    }
  }

  function retryAll() {
    refetchDash(); refetchDaily(); refetchWeekly(); refetchMonthly()
  }

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={retryAll} />}
        {!loading && !error && <>
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Select value={dateRange} onValueChange={v => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{L.last8months[locale]}</SelectItem>
              <SelectItem value="weekly">{L.lastYear[locale]}</SelectItem>
              <SelectItem value="monthly">{L.ytd[locale]}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            {exportDone
              ? (locale === "uz" ? "Yuklandi" : "Загружено")
              : L.exportReport[locale]
            }
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={`p-2 rounded-lg bg-secondary ${s.color} shrink-0`}><s.icon className="w-4 h-4" /></div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bar chart: income by period */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{L.monthlyRevenue[locale]}</h3>
                <p className="text-xs text-muted-foreground">{L.revenuePerMonth[locale]}</p>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                {locale === "uz" ? "Ma'lumot topilmadi" : "Нет данных"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={fmtShort}
                  />
                  <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={tooltipStyle} />
                  <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name={L.revenue[locale]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Line chart: income vs outcome */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{L.revenueVsExp[locale]}</h3>
                <p className="text-xs text-muted-foreground">{L.profitTrend[locale]}</p>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                {locale === "uz" ? "Ma'lumot topilmadi" : "Нет данных"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={fmtShort}
                  />
                  <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="income"  stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name={L.revenue[locale]} />
                  <Line type="monotone" dataKey="outcome" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name={L.expenses[locale]} strokeDasharray="4 4" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">
            {locale === "uz" ? "Davr bo'yicha jami" : "Итоги по периодам"}
          </h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {locale === "uz" ? "Ma'lumot topilmadi" : "Нет данных"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium py-2 pr-4">{locale === "uz" ? "Davr" : "Период"}</th>
                    <th className="text-right text-xs text-muted-foreground font-medium py-2 pr-4">{L.revenue[locale]}</th>
                    <th className="text-right text-xs text-muted-foreground font-medium py-2">{L.expenses[locale]}</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                      <td className="py-2 pr-4 text-foreground font-medium">{row.label}</td>
                      <td className="py-2 pr-4 text-right text-green-600 dark:text-green-400 font-semibold">{fmt(row.income)}</td>
                      <td className="py-2 text-right text-destructive font-semibold">{fmt(row.outcome)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>}
      </div>
    </AdminLayout>
  )
}
