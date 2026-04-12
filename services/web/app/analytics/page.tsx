"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { Brain, AlertTriangle, TrendingUp, Info, Rocket } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { advisorService, pnlService, heatmapService } from "@/lib/api/services"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { PageHeader } from "@/components/ui/page-header"
import { useLocale } from "@/lib/locale-context"
import PnLReport from "@/components/dashboard/pnl-report"
import SalesHeatmap from "@/components/dashboard/sales-heatmap"
import NotificationStream from "@/components/dashboard/notification-stream"
import { useCallback } from "react"
import { cn } from "@/lib/utils"

const TURI_META: Record<string, {
  Icon: typeof Brain
  tone: string
  border: string
}> = {
  critical:    { Icon: AlertTriangle, tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30",     border: "border-l-rose-500" },
  warning:     { Icon: AlertTriangle, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30", border: "border-l-amber-500" },
  opportunity: { Icon: Rocket,        tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30", border: "border-l-emerald-500" },
  info:        { Icon: Info,          tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30",      border: "border-l-blue-500" },
}

export default function AnalyticsPage() {
  const { locale } = useLocale()
  const { data, loading, error, refetch } = useApi(() => advisorService.get())
  const pnlFetcher = useCallback(() => pnlService.get(30), [])
  const { data: pnlData } = useApi(pnlFetcher)
  const { data: heatmapData } = useApi(heatmapService.get)

  const insightlar = data?.insightlar || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Brain}
          gradient="violet"
          title={locale === "uz" ? "AI Biznes Tahlil" : "AI Бизнес-аналитика"}
          subtitle={`${data?.jami_topildi || 0} ta insight • ${data?.sana || ""}`}
          action={
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl text-sm font-medium hover:bg-card transition-colors"
            >
              🔄 {locale === "uz" ? "Qayta tahlil" : "Обновить"}
            </button>
          }
        />

        {loading && <PageLoading />}
        {error && !loading && <PageError message="AI tahlil yuklashda xato" onRetry={refetch} />}

        {!loading && !error && (
          <>
            {/* P&L Report — dedicated endpoint */}
            {pnlData && <PnLReport data={pnlData} />}

            {/* AI Insights */}
            {insightlar.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">
                  {locale === "uz" ? "Hamma narsa yaxshi!" : "Всё в порядке!"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {locale === "uz"
                    ? "Hozircha muhim o'zgarish yoki xavf aniqlanmadi."
                    : "Существенных рисков или изменений не обнаружено."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {insightlar.map((ins: any, i: number) => {
                  const meta = TURI_META[ins.turi] || TURI_META.info
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl border border-border/60 border-l-4 bg-card/60 backdrop-blur-xl p-5 transition-all hover:shadow-md",
                        meta.border,
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-xl ring-1 shrink-0", meta.tone)}>
                          <meta.Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {ins.emoji} {ins.sarlavha}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{ins.tavsif}</p>
                          <p className="text-sm mt-2 font-medium text-foreground/80 italic">
                            💡 {ins.tavsiya}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Sales Heatmap — real data from /api/v1/hisobot/heatmap */}
            {heatmapData?.matrix && (
              <SalesHeatmap
                matrix={heatmapData.matrix}
                metric={heatmapData.metric ?? "soni"}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
