"use client"

import { useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { supervayzerService } from "@/lib/api/services"
import { formatCurrency } from "@/lib/format"
import { PageLoading, PageError } from "@/components/shared/page-states"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import {
  TrendingUp, TrendingDown, MapPin, CheckCircle2,
  Camera, AlertTriangle, Package, Users, Zap,
} from "lucide-react"
import Link from "next/link"

/**
 * Supervayzer Dashboard — SalesDoc-style, lekin undan chiroyliroq.
 * 4 KPI + pie chart + top tovarlar + alerts.
 * Har kuni yangilanadi.
 */

// Chiroyli ranglar — SalesDoc pastel, biznikida jonli modern
const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#a855f7", "#d946ef",
]

function KpiCard({
  title, value, fact, plan, icon: Icon, color, subtitle,
}: {
  title: string; value: number; fact: string; plan?: string;
  icon: React.ComponentType<{className?: string}>; color: string; subtitle?: string;
}) {
  const percent = Math.min(100, Math.max(0, value))
  return (
    <Card className={`p-5 border-0 bg-gradient-to-br ${color} text-white relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-2xl`}>
      <div className="absolute top-0 right-0 opacity-10 text-9xl -mt-4 -mr-4">
        <Icon className="w-28 h-28" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5" />
          <h3 className="text-sm font-semibold opacity-90">{title}</h3>
        </div>
        <div className="text-5xl font-bold mb-2 tabular-nums">
          {value.toFixed(1)}<span className="text-2xl opacity-80">%</span>
        </div>
        <div className="text-sm opacity-90 space-y-0.5">
          {plan && <div>Plan: {plan}</div>}
          <div>Fakt: {fact}</div>
          {subtitle && <div className="text-xs opacity-75 pt-1">{subtitle}</div>}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

export default function SupervayzerPage() {
  const { data, loading, error, refetch } = useApi(() => supervayzerService.get())

  const pieData = useMemo(
    () => (data?.kategoriya_pie || []).slice(0, 10).map((k, i) => ({
      name: k.nomi,
      value: k.summa,
      foiz: k.foiz,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })),
    [data?.kategoriya_pie],
  )

  const topData = useMemo(
    () => (data?.top_tovarlar || []).slice(0, 8).map((t) => ({
      nomi: t.nomi.length > 20 ? t.nomi.slice(0, 20) + "…" : t.nomi,
      summa: Math.round(t.summa / 1000),  // Ming so'mda ko'rsatamiz
    })),
    [data?.top_tovarlar],
  )

  return (
    <AdminLayout title="Supervayzer Dashboard">
      <div className="space-y-6">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            {/* ALERT BANNER (agar muhim narsa bor bo'lsa) */}
            {(data.alerts.muddati_otgan_vazifa > 0 ||
              data.alerts.javobsiz_shikoyat > 0 ||
              data.alerts.kutayotgan_qaytarish > 0) && (
              <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm space-y-1">
                  <div className="font-semibold text-red-700 dark:text-red-400">Diqqat:</div>
                  <div className="flex flex-wrap gap-2">
                    {data.alerts.muddati_otgan_vazifa > 0 && (
                      <Badge variant="destructive">
                        🔴 {data.alerts.muddati_otgan_vazifa} muddati o'tgan vazifa
                      </Badge>
                    )}
                    {data.alerts.javobsiz_shikoyat > 0 && (
                      <Badge variant="destructive">
                        ⚠️ {data.alerts.javobsiz_shikoyat} javobsiz shikoyat
                      </Badge>
                    )}
                    {data.alerts.kutayotgan_qaytarish > 0 && (
                      <Badge variant="secondary">
                        🔄 {data.alerts.kutayotgan_qaytarish} qaytarish tasdiq kutyapti
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TOP: Katta sotuv raqami + yesterday taqqos */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 text-white p-8">
              <div className="absolute -top-20 -right-20 opacity-10">
                <Zap className="w-72 h-72" />
              </div>
              <div className="relative">
                <div className="text-sm opacity-80 mb-2">
                  Bugungi sotuv {data.sana}
                </div>
                <div className="text-6xl md:text-7xl font-bold tabular-nums tracking-tight mb-3">
                  {formatCurrency(data.bugungi_jami)}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="opacity-90">
                    {data.bugungi_sotuv_soni} ta sotuv
                  </span>
                  <span className="opacity-70">|</span>
                  <span className="opacity-90">
                    Naqd: {formatCurrency(data.bugungi_naqd)}
                  </span>
                  <span className="opacity-70">|</span>
                  <span className="opacity-90">
                    Qarz: {formatCurrency(data.bugungi_qarz)}
                  </span>
                </div>
                {Math.abs(data.taqqos_foiz) > 0.1 && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
                    {data.taqqos_foiz >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-300" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-300" />
                    )}
                    <span>
                      {data.taqqos_foiz >= 0 ? "+" : ""}{data.taqqos_foiz.toFixed(1)}% kechaga nisbatan
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* 4 KPI KARTALARI — SalesDoc stili lekin chiroyliroq */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                title="Tashrif (plan vs fakt)"
                value={data.kpi.tashrif_rate}
                fact={`${data.kpi.tashrif_fact} ta`}
                plan={`${data.kpi.tashrif_plan.toFixed(0)} ta`}
                icon={MapPin}
                color="from-orange-500 to-amber-600"
              />
              <KpiCard
                title="Muvaffaqiyatli vizit"
                value={data.kpi.success_rate}
                fact={`${data.kpi.success_fact} ta zakaz`}
                icon={CheckCircle2}
                color="from-rose-500 to-pink-600"
                subtitle="Tashriflarning qanchasi zakazga aylangan"
              />
              <KpiCard
                title="GPS tasdiqlangan"
                value={data.kpi.gps_rate}
                fact={`${data.kpi.gps_fact} ta`}
                icon={MapPin}
                color="from-yellow-500 to-orange-600"
                subtitle="Shogird haqiqatan joyda bo'lgan"
              />
              <KpiCard
                title="Foto hisobot"
                value={data.kpi.photo_rate}
                fact={`${data.kpi.photo_fact} ta`}
                icon={Camera}
                color={data.kpi.photo_rate < 20 ? "from-red-500 to-rose-600" : "from-emerald-500 to-teal-600"}
                subtitle="Tashrifda facing foto yuborilgan"
              />
            </div>

            {/* PIE CHART + TOP TOVARLAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-semibold">Tovar kategoriyalari (bugun)</h3>
                </div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, foiz }) => `${name} ${foiz.toFixed(1)}%`}
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(v: number) => formatCurrency(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Bugun hali sotuv yo'q
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold">Top 8 tovar (bugun, ming so'mda)</h3>
                </div>
                {topData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" tickFormatter={(v) => `${v}K`} />
                      <YAxis type="category" dataKey="nomi" width={150} style={{fontSize: 12}} />
                      <RechartsTooltip formatter={(v: number) => `${v.toLocaleString()} K so'm`} />
                      <Bar dataKey="summa" fill="url(#bargrad)" radius={[0, 8, 8, 0]} />
                      <defs>
                        <linearGradient id="bargrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Bugun tovar sotilmadi
                  </div>
                )}
              </Card>
            </div>

            {/* QUICK LINKS */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/clients"><Users className="w-4 h-4 mr-2" />Klientlar</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/tashrif-tarix">Tashriflar</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/rfm">RFM</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/kpi-expeditor">KPI Reyting</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/feedback">Fikrlar</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
