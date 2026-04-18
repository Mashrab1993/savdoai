"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import KpiGridPremium from "@/components/dashboard/kpi-grid-premium"
import AgentKpiBoard, { type AgentKpi } from "@/components/dashboard/agent-kpi-board"
import SalesHeatmap from "@/components/dashboard/sales-heatmap"
import { HealthScoreWidget } from "@/components/dashboard/health-score-widget"
import {
  Users, Package, FileText, TrendingUp, AlertCircle,
  Landmark, GraduationCap, Hourglass, Mic,
  ArrowUpRight, Sparkles,
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

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function greeting(locale: "uz" | "ru"): string {
  const h = new Date().getHours()
  if (locale === "uz") {
    if (h < 6) return "Tun bexosir"
    if (h < 12) return "Xayrli tong"
    if (h < 17) return "Xayrli kun"
    if (h < 22) return "Xayrli kech"
    return "Xayrli tun"
  }
  if (h < 6) return "Спокойной ночи"
  if (h < 12) return "Доброе утро"
  if (h < 17) return "Добрый день"
  if (h < 22) return "Добрый вечер"
  return "Доброй ночи"
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
    padding: "8px 12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  }

  const title = d.title[locale]
  const today = new Date().toLocaleDateString(locale === "uz" ? "uz-UZ" : "ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  const alerts: { id: string; tone: "danger" | "warning" | "success"; icon: typeof AlertCircle; title: string; detail: string; href?: string; hrefLabel?: string }[] = []
  if (stats.overdueCount > 0) {
    alerts.push({
      id: "overdue",
      tone: "danger",
      icon: AlertCircle,
      title: locale === "uz"
        ? `${stats.overdueCount} ta qarz muddati o'tgan`
        : `${stats.overdueCount} долга просрочено`,
      detail: `${formatCurrency(stats.overdueAmount)} so'm`,
      href: "/debts",
      hrefLabel: locale === "uz" ? "Ko'rish" : "Смотреть",
    })
  }
  if (statsExtra && statsExtra.kam_qoldiq_soni > 0) {
    alerts.push({
      id: "low-stock",
      tone: "warning",
      icon: Package,
      title: locale === "uz"
        ? `${statsExtra.kam_qoldiq_soni} ta tovar qoldig'i kam`
        : `${statsExtra.kam_qoldiq_soni} товаров с низким остатком`,
      detail: Array.isArray(statsExtra?.kam_qoldiq_tovarlar)
        ? statsExtra.kam_qoldiq_tovarlar.slice(0, 3).map((t: any) => t.nomi).join(", ")
        : "",
      href: "/products",
      hrefLabel: locale === "uz" ? "Tovarlar" : "Товары",
    })
  }
  if (Array.isArray(statsExtra?.top_bugun) && statsExtra?.top_bugun.length > 0) {
    alerts.push({
      id: "top-today",
      tone: "success",
      icon: TrendingUp,
      title: locale === "uz" ? "Bugun eng ko'p sotilgan" : "Топ продажи сегодня",
      detail: statsExtra.top_bugun.slice(0, 3).map((t: any) => t.nomi).join(", "),
    })
  }

  return (
    <AdminLayout title={title}>
      <div className="space-y-6">
        {statsLoading && <PageLoading />}
        {statsError && !statsLoading && <PageError message={statsError} onRetry={refetch} />}

        {!statsLoading && !statsError && (
          <>
            {/* ─── Page header: greeting + date ─── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{today}</p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
                  {greeting(locale as "uz" | "ru")} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {locale === "uz"
                    ? "Bizningingiz bugun shunday ko'rinishda"
                    : "Вот как выглядит ваш бизнес сегодня"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/reports-hub">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {locale === "uz" ? "Hisobotlar" : "Отчёты"}
                  </Button>
                </Link>
                <Link href="/voice-help">
                  <Button size="sm" className="gap-1.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white border-0 shadow-md">
                    <Mic className="w-3.5 h-3.5" />
                    {locale === "uz" ? "Ovozli boshqaruv" : "Голос"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* ─── Unified alert ribbon (replaces 3 separate alert boxes) ─── */}
            {alerts.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {alerts.map((a) => {
                  const toneClass = {
                    danger: "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50",
                    warning: "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50",
                    success: "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50",
                  }[a.tone]
                  const iconTone = {
                    danger: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
                    warning: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
                    success: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                  }[a.tone]
                  const Icon = a.icon
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-4 transition-all ${toneClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${iconTone}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight">{a.title}</p>
                          {a.detail && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.detail}</p>
                          )}
                          {a.href && (
                            <Link
                              href={a.href}
                              className="inline-flex items-center gap-0.5 mt-2 text-xs font-medium text-primary hover:underline"
                            >
                              {a.hrefLabel}
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ─── Agent KPI leaderboard ─── */}
            {Array.isArray(agentlarKpi) && agentlarKpi.length > 0 && (
              <AgentKpiBoard
                agents={agentlarKpi.map<AgentKpi>((a) => ({
                  id: a.id,
                  ism: a.ism || "—",
                  reja: Number(a.reja || 0),
                  tashrif_soni: Number(a.tashrif_soni || 0),
                  rejali_summa: Number(a.rejali_summa || 0),
                  rejali_soni: Number(a.rejali_soni || 0),
                  ofplan_summa: Number(a.ofplan_summa || 0),
                  ofplan_soni: Number(a.ofplan_soni || 0),
                  qaytarish: Number(a.qaytarish || 0),
                }))}
              />
            )}

            {/* ─── Premium KPI grid ─── */}
            <KpiGridPremium
              stats={{
                bugungiSotuv: statsExtra?.bugun?.jami ?? 0,
                haftalikDaromad: statsExtra?.hafta?.jami ?? 0,
                oylikFoyda: statsExtra?.oy?.jami ?? 0,
                faolMijozlar: stats.activeClients,
                qarzlar: stats.totalDebt,
                otgruzka: 0,
                yetkazildi: 0,
                kamQoldiq: statsExtra?.kam_qoldiq_soni ?? 0,
              }}
              deltas={{
                bugungiSotuv: 0, haftalikDaromad: 0, oylikFoyda: 0, faolMijozlar: 0,
                qarzlar: 0, otgruzka: 0, yetkazildi: 0, kamQoldiq: 0,
              }}
            />

            {/* ─── Secondary metrics ─── */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {locale === "uz" ? "Operatsion holat" : "Операционный статус"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {locale === "uz" ? "Hozirgi daqiqa" : "Сейчас"}
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: d.todayCashIncome[locale],
                    value: `${fmt(stats.todayCashIncome)} so'm`,
                    icon: Landmark,
                    ring: "ring-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: d.activeStaff[locale],
                    value: String(stats.activeApprentices),
                    icon: GraduationCap,
                    ring: "ring-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400",
                  },
                  {
                    label: d.pendingApprovals[locale],
                    value: String(stats.pendingExpenses),
                    icon: Hourglass,
                    ring: "ring-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
                  },
                  {
                    label: d.totalInvoices[locale],
                    value: String(stats.totalInvoices),
                    icon: FileText,
                    ring: "ring-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400",
                  },
                ].map(({ label, value, icon: Icon, ring }) => (
                  <div
                    key={label}
                    className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className={`p-2.5 rounded-lg ring-1 ${ring} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="text-lg font-bold text-foreground leading-tight tabular-nums">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Period breakdown ─── */}
            {statsExtra && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {locale === "uz" ? "Sotuv davrlari" : "Периоды продаж"}
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: locale === "uz" ? "Bugun" : "Сегодня", soni: statsExtra.bugun.soni, jami: statsExtra.bugun.jami, color: "from-emerald-500 to-emerald-400" },
                    { label: locale === "uz" ? "Hafta" : "Неделя", soni: statsExtra.hafta.soni, jami: statsExtra.hafta.jami, color: "from-sky-500 to-sky-400" },
                    { label: locale === "uz" ? "Oy" : "Месяц", soni: statsExtra.oy.soni, jami: statsExtra.oy.jami, color: "from-violet-500 to-violet-400" },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${p.color}`} />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{p.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{fmt(p.jami)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.soni} {locale === "uz" ? "ta sotuv" : "продаж"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── Revenue chart ─── */}
            <section className="rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{d.revenueChart[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.last8Months[locale]}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {locale === "uz" ? "O'sish" : "Рост"}
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 gap-3 text-center">
                  <div className="p-3 rounded-full bg-muted">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {locale === "uz" ? "Ma'lumot yuklanmoqda" : "Загружаем данные"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {locale === "uz" ? "Birinchi sotuv qaydidan keyin paydo bo'ladi" : "Появится после первой продажи"}
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#revGrad)" strokeWidth={2.5} name={d.revenue[locale]} />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" fill="url(#expGrad)" strokeWidth={2.5} name={d.expenses[locale]} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* ─── Top tovar / klient / trend (3 col) ─── */}
            {topData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {topData.top_tovar && topData.top_tovar.length > 0 && (
                  <div className="rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {locale === "uz" ? "Top tovarlar" : "Топ товары"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                      {locale === "uz" ? "Oxirgi 30 kun" : "Последние 30 дней"}
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={topData.top_tovar} layout="vertical" margin={{ left: 5, right: 10 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(v)} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="nomi" width={90} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]} contentStyle={tooltipStyle} />
                        <Bar dataKey="jami" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {topData.top_klient && topData.top_klient.length > 0 && (
                  <div className="rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {locale === "uz" ? "Top mijozlar" : "Топ клиенты"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                      {locale === "uz" ? "Eng ko'p sotib olgan" : "Больше всех купили"}
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={topData.top_klient} layout="vertical" margin={{ left: 5, right: 10 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmt(v)} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="ism" width={90} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]} contentStyle={tooltipStyle} />
                        <Bar dataKey="jami" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {topData.kunlik_trend && topData.kunlik_trend.length > 0 && (
                  <div className="rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {locale === "uz" ? "7 kunlik trend" : "Тренд за 7 дней"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                      {locale === "uz" ? "Sotuv va qarz" : "Продажи и долги"}
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={topData.kunlik_trend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="trendSotuv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="kun" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
                        <Tooltip formatter={(v: number) => [`${fmt(v)} so'm`, ""]} contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="sotuv" stroke="hsl(var(--chart-1))" fill="url(#trendSotuv)" strokeWidth={2} name={locale === "uz" ? "Sotuv" : "Продажи"} />
                        <Area type="monotone" dataKey="qarz" stroke="hsl(var(--destructive))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name={locale === "uz" ? "Qarz" : "Долг"} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="circle" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* ─── Business health widget ─── */}
            <HealthScoreWidget />

            {/* ─── Sales heatmap ─── */}
            {heatmapData?.matrix && (
              <SalesHeatmap matrix={heatmapData.matrix} metric={heatmapData.metric ?? "soni"} />
            )}

            {/* ─── Quick actions — redesigned ─── */}
            <section className="rounded-xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {locale === "uz" ? "Tez o'tish" : "Быстрый переход"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {locale === "uz" ? "Ko'p ishlatiladigan bo'limlar" : "Часто используемые разделы"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: locale === "uz" ? "Mijozlar" : "Клиенты", href: "/clients", icon: Users, tone: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
                  { label: locale === "uz" ? "Mahsulotlar" : "Товары", href: "/products", icon: Package, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
                  { label: locale === "uz" ? "Hisobotlar" : "Отчёты", href: "/reports-hub", icon: TrendingUp, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
                  { label: locale === "uz" ? "Savdolar" : "Продажи", href: "/orders", icon: FileText, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
                  { label: locale === "uz" ? "RFM" : "RFM", href: "/rfm", icon: Users, tone: "text-rose-600 dark:text-rose-400 bg-rose-500/10" },
                  { label: locale === "uz" ? "PnL" : "Прибыль", href: "/pnl", icon: TrendingUp, tone: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
                  { label: locale === "uz" ? "Kategoriya" : "Категории", href: "/categories", icon: Package, tone: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10" },
                  { label: locale === "uz" ? "Ovozli" : "Голос", href: "/voice-help", icon: Mic, tone: "text-pink-600 dark:text-pink-400 bg-pink-500/10" },
                ].map(({ label, href, icon: Icon, tone }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-2.5 rounded-lg border border-border/50 bg-background p-2.5 transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"
                  >
                    <div className={`p-1.5 rounded-md ${tone} shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">{label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
