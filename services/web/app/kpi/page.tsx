"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { KpiCard } from "@/components/ui/kpi-card"
import { Package, TrendingUp, Users, Award, Target, Zap } from "lucide-react"
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { formatCurrency } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { kpiService } from "@/lib/api/services"
import { PageLoading, PageError } from "@/components/shared/page-states"

const REYTING_RANG: Record<string, string> = {
  A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#ef4444",
}

export default function KpiPage() {
  const { data: kpi, loading, error } = useApi(() => kpiService.get(30))
  const { data: trend } = useApi(() => kpiService.trend(14))

  if (loading) return <PageLoading />
  if (error || !kpi) return <PageError message="KPI yuklashda xato" />

  const trendEmoji = kpi.trend === "o'sish" ? "📈" : kpi.trend === "tushish" ? "📉" : "➡️"

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 KPI Dashboard</h1>
            <p className="text-muted-foreground">30 kunlik samaradorlik ko'rsatkichlari</p>
          </div>
          <div
            className="text-5xl font-black"
            style={{ color: REYTING_RANG[kpi.reyting] || "#6b7280" }}
          >
            {kpi.reyting}
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {kpi.badges?.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full
              bg-primary/10 text-sm font-medium">
              {b.emoji} {b.nomi}
            </span>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Sotuvlar" value={`${kpi.sotuv_soni} ta`}
            icon={Package} />
          <KpiCard title="Tushum" value={formatCurrency(kpi.sotuv_jami)}
            changeLabel="so'm"
            icon={TrendingUp} />
          <KpiCard title="Klientlar" value={`${kpi.klient_soni}`}
            changeLabel={`+${kpi.yangi_klientlar} yangi`}
            icon={Users} />
          <KpiCard title="Foyda" value={formatCurrency(kpi.foyda)}
            changeLabel={`${kpi.margin_foiz}%`}
            icon={Award} />
        </div>

        {/* Trend */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{trendEmoji} Sotuv trendi</h3>
            <span className="text-sm font-bold" style={{
              color: kpi.trend_foiz > 0 ? "#10b981" : kpi.trend_foiz < 0 ? "#ef4444" : "#6b7280"
            }}>
              {kpi.trend_foiz > 0 ? "+" : ""}{kpi.trend_foiz}%
            </span>
          </div>
          {trend && (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb22" />
                <XAxis dataKey="kun" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Sotuv"]} />
                <Area type="monotone" dataKey="jami" stroke="#10b981" fill="#10b98122" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Qo'shimcha stats */}
        <div className="grid grid-cols-2 gap-4">
          <KpiCard title="O'rtacha chek" value={formatCurrency(kpi.ortacha_chek)}
            icon={Target} />
          <KpiCard title="Kunlik o'rtacha" value={formatCurrency(kpi.kunlik_ortacha)}
            icon={Zap} />
        </div>
      </div>
    </AdminLayout>
  )
}
