"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import KpiGridPremium from "@/components/dashboard/kpi-grid-premium"
import AgentKpiBoard, { type AgentKpi } from "@/components/dashboard/agent-kpi-board"
import SalesHeatmap from "@/components/dashboard/sales-heatmap"
import {
  Users, Package, FileText,
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
import { dashboardService, dashboardTopService, statistikaService, agentlarKpiService, heatmapService } from "@/lib/api/services"
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
  const { data: statsExtra } = useApi(statistikaService.get)
  const { data: agentlarKpi } = useApi(agentlarKpiService.bugungi)
  const { data: heatmapData } = useApi(heatmapService.get)

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
      <div className="space-y-4">

        {statsLoading && <PageLoading />}
        {statsError && !statsLoading && <PageError message={statsError} onRetry={refetch} />}

        {!statsLoading && !statsError && (
          <>
            {/* Priority: Overdue Alert if critical */}
            {stats.overdueCount > 0 && (
              <div className="bg-rose-500/10 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-rose-900 dark:text-rose-200 dark:text-red-300 text-sm">
                    {locale === "uz"
                      ? `${stats.overdueCount} ta qarz muddati o'tgan`
                      : `${stats.overdueCount} долга просрочено`}
                  </p>
                  <p className="text-xs text-rose-800 dark:text-rose-300 dark:text-rose-400 mt-1">{formatCurrency(stats.overdueAmount)} so'm</p>
                </div>
              </div>
            )}

            {/* Kam qoldiq ogohlantirish — enriched with product names */}
            {statsExtra && statsExtra.kam_qoldiq_soni > 0 && (
              <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 dark:text-amber-200 text-sm">
                      {locale === "uz"
                        ? `${statsExtra.kam_qoldiq_soni} ta tovar qoldig'i kam`
                        : `${statsExtra.kam_qoldiq_soni} товаров с низким остатком`}
                    </p>
                  </div>
                  <Link href="/products" className="text-xs text-amber-700 dark:text-amber-300 underline shrink-0">
                    {locale === "uz" ? "Barchasi →" : "Все →"}
                  </Link>
                </div>
                {Array.isArray((statsExtra as any).kam_qoldiq_tovarlar) && (statsExtra as any).kam_qoldiq_tovarlar.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {(statsExtra as any).kam_qoldiq_tovarlar.slice(0, 5).map((t: any) => (
                      <span key={t.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 dark:text-amber-200 rounded-full px-2 py-0.5 border border-amber-500/30">
                        {t.nomi}
                        <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">{Number(t.qoldiq)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bugungi top sellers */}
            {Array.isArray((statsExtra as any)?.top_bugun) && (statsExtra as any).top_bugun.length > 0 && (
              <div className="bg-emerald-500/10 border-l-4 border-emerald-500 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300 dark:text-emerald-200 text-sm">
                    {locale === "uz" ? "Bugun eng ko'p sotilgan" : "Топ продажи сегодня"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {(statsExtra as any).top_bugun.map((t: any, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 dark:text-emerald-200 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                      <span className="text-emerald-500 font-bold">#{i + 1}</span>
                      {t.nomi}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Agent KPI leaderboard — fed by /api/v1/agentlar/bugungi-kpi */}
            {Array.isArray(agentlarKpi) && agentlarKpi.length > 0 && (
              <AgentKpiBoard
                agents={agentlarKpi.map<AgentKpi>(a => ({
                  id:           a.id,
                  ism:          a.ism || "—",
                  reja:         Number(a.reja || 0),
                  tashrif_soni: Number(a.tashrif_soni || 0),
                  rejali_summa: Number(a.rejali_summa || 0),
                  rejali_soni:  Number(a.rejali_soni  || 0),
                  ofplan_summa: Number(a.ofplan_summa || 0),
                  ofplan_soni:  Number(a.ofplan_soni  || 0),
                  qaytarish:    Number(a.qaytarish || 0),
                }))}
              />
            )}

            {/* Premium KPI grid (v0.dev → GPT-5.4 audit → Claude fix pipeline) */}
            <KpiGridPremium
              stats={{
                bugungiSotuv:    statsExtra?.bugun?.jami ?? 0,
                haftalikDaromad: statsExtra?.hafta?.jami ?? 0,
                oylikFoyda:      statsExtra?.oy?.jami ?? 0,
                faolMijozlar:    stats.activeClients,
                qarzlar:         stats.totalDebt,
                otgruzka:        0,
                yetkazildi:      0,
                kamQoldiq:       statsExtra?.kam_qoldiq_soni ?? 0,
              }}
              deltas={{
                bugungiSotuv:    0,
                haftalikDaromad: 0,
                oylikFoyda:      0,
                faolMijozlar:    0,
                qarzlar:         0,
                otgruzka:        0,
                yetkazildi:      0,
                kamQoldiq:       0,
              }}
            />

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
                    color: "text-emerald-500",
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
                  <div key={label} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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

            {/* Sotuv davrlar — statistikaService dan */}
            {statsExtra && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {locale === "uz" ? "Sotuv davrlari" : "Периоды продаж"}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: locale === "uz" ? "Bugun" : "Сегодня", soni: statsExtra.bugun.soni, jami: statsExtra.bugun.jami, color: "border-green-500" },
                    { label: locale === "uz" ? "Hafta" : "Неделя", soni: statsExtra.hafta.soni, jami: statsExtra.hafta.jami, color: "border-blue-500" },
                    { label: locale === "uz" ? "Oy" : "Месяц", soni: statsExtra.oy.soni, jami: statsExtra.oy.jami, color: "border-purple-500" },
                  ].map(p => (
                    <div key={p.label} className={`bg-card/60 backdrop-blur-xl border-l-4 ${p.color} border border-border/60 rounded-2xl p-4 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-300`}>
                      <p className="text-xs text-muted-foreground">{p.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{fmt(p.jami)} so'm</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.soni} {locale === "uz" ? "ta sotuv" : "продаж"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Chart */}
            <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all">
              <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{d.revenueChart[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.last8Months[locale]}</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
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
                  <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all">
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
                  <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all">
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
                  <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all">
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

            {/* Sales activity heatmap — real data from /api/v1/hisobot/heatmap */}
            {heatmapData?.matrix && (
              <SalesHeatmap
                matrix={heatmapData.matrix}
                metric={heatmapData.metric ?? "soni"}
              />
            )}

            {/* Quick Actions */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5">
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
