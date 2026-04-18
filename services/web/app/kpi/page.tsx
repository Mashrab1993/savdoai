"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import KpiGridPremium from "@/components/dashboard/kpi-grid-premium"
import { PageHeader } from "@/components/ui/page-header"
import { Package, TrendingUp, Users, Award, Target, Zap, BarChart3 } from "lucide-react"
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { formatCurrency } from "@/lib/format"
import { useLocale } from "@/lib/locale-context"
import { useApi } from "@/hooks/use-api"
import { kpiService } from "@/lib/api/services"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { cn } from "@/lib/utils"

const REYTING_META: Record<string, { color: string; bg: string }> = {
  A: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15 ring-emerald-500/30" },
  B: { color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/15 ring-blue-500/30" },
  C: { color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/15 ring-amber-500/30" },
  D: { color: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-500/15 ring-rose-500/30" },
}

export default function KpiPage() {
  const { locale } = useLocale()
  const { data: kpi, loading, error } = useApi(() => kpiService.get(30))
  const { data: trend } = useApi(() => kpiService.trend(14))

  if (loading) return <AdminLayout><PageLoading /></AdminLayout>
  if (error || !kpi) return <AdminLayout><PageError message="KPI yuklashda xato" /></AdminLayout>

  const reyMeta = REYTING_META[kpi.reyting] || REYTING_META.C
  const trendEmoji = kpi.trend === "o'sish" ? "📈" : kpi.trend === "tushish" ? "📉" : "➡️"

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          gradient="cyan"
          title={locale === "uz" ? "KPI Dashboard" : "KPI Дашборд"}
          subtitle={locale === "uz" ? "30 kunlik samaradorlik ko'rsatkichlari" : "Показатели за 30 дней"}
          action={
            <div className={cn("px-5 py-3 rounded-2xl ring-1 text-center", reyMeta.bg)}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {locale === "uz" ? "Reyting" : "Рейтинг"}
              </p>
              <p className={cn("text-4xl font-black mt-1", reyMeta.color)}>
                {kpi.reyting}
              </p>
            </div>
          }
        />

        {/* Badges */}
        {kpi.badges?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {kpi.badges.map((b: any, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                  bg-primary/10 border border-primary/20 text-sm font-medium text-foreground"
              >
                {b.emoji} {b.nomi}
              </span>
            ))}
          </div>
        )}

        {/* Premium KPI Grid */}
        <KpiGridPremium
          stats={{
            bugungiSotuv:    kpi.kunlik_ortacha ?? 0,
            haftalikDaromad: kpi.sotuv_jami ?? 0,
            oylikFoyda:      kpi.foyda ?? 0,
            faolMijozlar:    kpi.klient_soni ?? 0,
            qarzlar:         0,
            otgruzka:        kpi.sotuv_soni ?? 0,
            yetkazildi:      0,
            kamQoldiq:       0,
          }}
          deltas={{
            bugungiSotuv:    0,
            haftalikDaromad: kpi.trend_foiz ?? 0,
            oylikFoyda:      0,
            faolMijozlar:    kpi.yangi_klientlar ?? 0,
            qarzlar:         0,
            otgruzka:        0,
            yetkazildi:      0,
            kamQoldiq:       0,
          }}
        />

        {/* Trend chart */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">
              {trendEmoji} {locale === "uz" ? "Sotuv trendi" : "Тренд продаж"}
            </h3>
            <span className={cn(
              "text-sm font-bold",
              (kpi.trend_foiz ?? 0) > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : (kpi.trend_foiz ?? 0) < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground",
            )}>
              {(kpi.trend_foiz ?? 0) > 0 ? "+" : ""}{kpi.trend_foiz ?? 0}%
            </span>
          </div>
          {trend && (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="kun" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(Number(v)), locale === "uz" ? "Sotuv" : "Продажи"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="jami" stroke="hsl(var(--chart-1))" fill="url(#kpiGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Extra stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {locale === "uz" ? "O'rtacha chek" : "Средний чек"}
              </p>
              <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                {formatCurrency(kpi.ortacha_chek ?? 0)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {locale === "uz" ? "Kunlik o'rtacha" : "Средний за день"}
              </p>
              <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                {formatCurrency(kpi.kunlik_ortacha ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
