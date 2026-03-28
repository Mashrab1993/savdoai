"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { KpiCard } from "@/components/ui/kpi-card"
import {
  DollarSign, Users, Package, CreditCard, FileText,
  TrendingUp, AlertCircle,
  Landmark, GraduationCap, Hourglass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { formatCurrency } from "@/lib/format"
import { useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { useWebSocket } from "@/hooks/use-websocket"
import { dashboardService, dashboardTopService } from "@/lib/api/services"
import { normalizeDashboard, type DashboardVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"
import type { ReportEntry } from "@/lib/api/types"

// Abbreviated formatter for charts (numbers only, no currency)
const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function DashboardPage() {
  const { locale } = useLocale()
  const d = translations.dashboard

  const { data: rawStats, loading: statsLoading, error: statsError, refetch } = useApi(dashboardService.get)
  const { data: monthlyData } = useApi(dashboardService.monthly)
  const { data: topData } = useApi(dashboardTopService.get)

  // Real-time yangilanish — WebSocket orqali
  const { lastMessage } = useWebSocket()
  useEffect(() => {
    if (lastMessage?.type === "sync") refetch()
  }, [lastMessage, refetch])

  const stats: DashboardVM = rawStats ? normalizeDashboard(rawStats) : {
    totalClients: 0, activeClients: 0, totalRevenue: 0, todayCashIncome: 0,
    totalDebt: 0, overdueCount: 0, overdueAmount: 0, pendingExpenses: 0,
    activeApprentices: 0, totalInvoices: 0,
  }

  const chartData: ReportEntry[] = monthlyData ?? []

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  }

  const title = d.title[locale]

  return (
    <AdminLayout title={title}>
      <div className="space-y-6">

        {statsLoading && <PageLoading />}
        {statsError && !statsLoading && <PageError message={statsError} onRetry={refetch} />}

        {!statsLoading && !statsError && (
          <>
            {/* Priority: Overdue Alert if critical */}
            {stats.overdueCount > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-red-900 dark:text-red-300 text-sm">
                    {locale === "uz"
                      ? `${stats.overdueCount} ta qarz muddati o'tgan`
                      : `${stats.overdueCount} долга просрочено`}
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-400 mt-1">{formatCurrency(stats.overdueAmount)} so'm</p>
                </div>
              </div>
            )}

            {/* Primary KPIs */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {locale === "uz" ? "Asosiy ko'rsatkichlar" : "Ключевые показатели"}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title={d.totalRevenue[locale]}
                  value={`${fmt(stats.totalRevenue)} so'm`}
                  icon={DollarSign}
                  iconColor="text-primary"
                />
                <KpiCard
                  title={locale === "uz" ? "Faol mijozlar" : "Активных клиентов"}
                  value={String(stats.activeClients)}
                  icon={Users}
                  iconColor="text-purple-500"
                />
                <KpiCard
                  title={d.totalDebt[locale]}
                  value={`${fmt(stats.totalDebt)} so'm`}
                  icon={CreditCard}
                  iconColor="text-yellow-500"
                />
                <KpiCard
                  title={locale === "uz" ? "Muddati o'tgan qarzlar" : "Просроченных долгов"}
                  value={String(stats.overdueCount)}
                  icon={AlertCircle}
                  iconColor="text-destructive"
                />
              </div>
            </div>

            {/* Secondary Metrics */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {locale === "uz" ? "Operatsion holat" : "Операционный статус"}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: d.todayCashIncome[locale],
                    value: `${fmt(stats.todayCashIncome)} so'm`,
                    icon: Landmark,
                    color: "text-green-500",
                  },
                  {
                    label: d.activeStaff[locale],
                    value: String(stats.activeApprentices),
                    icon: GraduationCap,
                    color: "text-blue-500",
                  },
                  {
                    label: d.pendingApprovals[locale],
                    value: String(stats.pendingExpenses),
                    icon: Hourglass,
                    color: "text-orange-500",
                  },
                  {
                    label: d.totalInvoices[locale],
                    value: String(stats.totalInvoices),
                    icon: FileText,
                    color: "text-primary",
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:border-border/70 transition-colors">
                    <div className={`p-2 rounded-lg bg-secondary shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="text-lg font-bold text-foreground leading-tight truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{d.revenueChart[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.last8Months[locale]}</p>
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                  <TrendingUp className="w-7 h-7 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {locale === "uz" ? "Daromad ma'lumotlari yuklanmoqda" : "Данные дохода загружаются"}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {locale === "uz" ? "Birinchi tranzaksiya kiritilgach grafik paydo bo'ladi" : "График появится после первой транзакции"}
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#revGrad)" strokeWidth={2} name={d.revenue[locale]} />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" fill="url(#expGrad)" strokeWidth={2} name={d.expenses[locale]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Tovar + Top Klient + 7-kun Trend */}
            {topData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Top 5 Tovar */}
                {topData.top_tovar && topData.top_tovar.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {locale === "uz" ? "Top tovarlar" : "Топ товары"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {locale === "uz" ? "Oxirgi 30 kun" : "Последние 30 дней"}
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={topData.top_tovar} layout="vertical" margin={{ left: 5, right: 10 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                               tickFormatter={v => fmt(v)} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="nomi" width={90}
                               tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                               axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]}
                                 contentStyle={tooltipStyle} />
                        <Bar dataKey="jami" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]}
                             barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top 5 Klient */}
                {topData.top_klient && topData.top_klient.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {locale === "uz" ? "Top mijozlar" : "Топ клиенты"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {locale === "uz" ? "Eng ko'p sotib olgan" : "Больше всех купили"}
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={topData.top_klient} layout="vertical" margin={{ left: 5, right: 10 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                               tickFormatter={v => fmt(v)} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="ism" width={90}
                               tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                               axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]}
                                 contentStyle={tooltipStyle} />
                        <Bar dataKey="jami" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]}
                             barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* 7 kunlik trend */}
                {topData.kunlik_trend && topData.kunlik_trend.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {locale === "uz" ? "7 kunlik trend" : "Тренд за 7 дней"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {locale === "uz" ? "Sotuv va qarz" : "Продажи и долги"}
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={topData.kunlik_trend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="trendSotuv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="kun" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                               axisLine={false} tickLine={false}
                               tickFormatter={v => v.slice(5)} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                               axisLine={false} tickLine={false}
                               tickFormatter={v => fmt(v)} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]}
                                 contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="sotuv" stroke="hsl(var(--chart-1))"
                              fill="url(#trendSotuv)" strokeWidth={2}
                              name={locale === "uz" ? "Sotuv" : "Продажи"} />
                        <Area type="monotone" dataKey="qarz" stroke="hsl(var(--destructive))"
                              fill="none" strokeWidth={1.5} strokeDasharray="4 4"
                              name={locale === "uz" ? "Qarz" : "Долг"} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">
                  {locale === "uz" ? "Tez o'tish" : "Быстрый переход"}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: locale === "uz" ? "Mijozlar" : "Клиенты",   href: "/clients",   icon: Users },
                  { label: locale === "uz" ? "Mahsulotlar" : "Товары",  href: "/products",  icon: Package },
                  { label: locale === "uz" ? "Hisobotlar" : "Отчёты",   href: "/reports",   icon: TrendingUp },
                  { label: locale === "uz" ? "Savdolar" : "Продажи",    href: "/invoices",  icon: FileText },
                ].map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <Button variant="outline" className="w-full h-10 justify-start gap-2 text-xs">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
