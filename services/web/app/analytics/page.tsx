"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { Brain, AlertTriangle, TrendingUp, Info, Rocket } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { advisorService } from "@/lib/api/services"
import { PageLoading, PageError } from "@/components/shared/page-states"

const TURI_CONFIG: Record<string, { icon: typeof Brain; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: "#ef4444", bg: "#ef444410" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#f59e0b10" },
  opportunity: { icon: Rocket, color: "#10b981", bg: "#10b98110" },
  info: { icon: Info, color: "#3b82f6", bg: "#3b82f610" },
}

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useApi(() => advisorService.get())

  if (loading) return <PageLoading />
  if (error) return <PageError message="AI tahlil yuklashda xato" />

  const insightlar = data?.insightlar || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" /> AI Biznes Maslahat
          </h1>
          <p className="text-muted-foreground">
            {data?.jami_topildi || 0} ta insight topildi • {data?.sana}
          </p>
        </div>

        {/* Insights */}
        {insightlar.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">Hamma narsa yaxshi!</h3>
            <p className="text-muted-foreground mt-2">
              Hozircha muhim o'zgarish yoki xavf aniqlanmadi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insightlar.map((ins, i) => {
              const config = TURI_CONFIG[ins.turi] || TURI_CONFIG.info
              const Icon = config.icon
              return (
                <div
                  key={i}
                  className="rounded-xl border p-5 transition-all hover:shadow-md"
                  style={{ borderLeftWidth: 4, borderLeftColor: config.color, background: config.bg }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: config.color }} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {ins.emoji} {ins.sarlavha}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{ins.tavsif}</p>
                      <p className="text-sm mt-2 italic" style={{ color: config.color }}>
                        💡 {ins.tavsiya}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={refetch}
          className="w-full py-3 rounded-xl border text-sm font-medium
            hover:bg-primary/5 transition-colors"
        >
          🔄 Qayta tahlil qilish
        </button>
      </div>
    </AdminLayout>
  )
}
