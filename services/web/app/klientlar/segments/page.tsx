"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Award, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SegmentRow = {
  segment?: string
  nomi?: string
  klient_soni?: number
  jami_xarid?: number
  o_rtacha_xarid?: number
}

type SegmentResp = SegmentRow[] | { items?: SegmentRow[] }

const SEGMENT_INFO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  champions: { label: "Champions", color: "emerald", icon: Award },
  loyal: { label: "Loyal", color: "blue", icon: Award },
  potential: { label: "Potential", color: "purple", icon: TrendingUp },
  new: { label: "New", color: "cyan", icon: TrendingUp },
  promising: { label: "Promising", color: "yellow", icon: TrendingUp },
  at_risk: { label: "At Risk", color: "amber", icon: AlertTriangle },
  hibernating: { label: "Hibernating", color: "rose", icon: AlertTriangle },
  lost: { label: "Lost", color: "slate", icon: AlertTriangle },
}

export default function KlientSegmentsPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SegmentResp>(isAuthenticated ? "/api/v1/segment" : null)
  const segments: SegmentRow[] = Array.isArray(data) ? data : (data?.items ?? [])

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klient segmentatsiya (RFM)</h1>
            <p className="text-base text-slate-500 mt-1">
              Recency-Frequency-Monetary tahlil
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && segments.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha segmentatsiya uchun yetarli ma'lumot yo'q.
            Birinchi 10 ta sotuv bo'lgandan keyin paydo bo'ladi.
          </Card>
        )}

        {segments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((s, i) => {
              const key = (s.segment || s.nomi || "lost").toLowerCase().replace(/\s+/g, "_")
              const info = SEGMENT_INFO[key] || { label: s.segment || s.nomi || "?", color: "slate", icon: TrendingUp }
              const Icon = info.icon
              return (
                <Card key={i} className={`p-5 border-${info.color}-200 bg-${info.color}-50/40`}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-6 h-6 text-${info.color}-600`} />
                    <span className={`text-xs uppercase font-semibold text-${info.color}-700`}>{info.label}</span>
                  </div>
                  <div className="text-3xl font-bold tabular-nums">{s.klient_soni ?? 0}</div>
                  <div className="text-sm text-slate-600 mt-1">klient</div>
                  {s.jami_xarid != null && (
                    <div className="text-xs text-slate-500 mt-2">
                      Jami: <span className="font-semibold">{formatCurrency(Number(s.jami_xarid))}</span>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">RFM nima?</h3>
          <p className="text-sm text-blue-800">
            <strong>R</strong>ecency — qancha vaqt avval xarid qilgan ·
            <strong>F</strong>requency — qanchalar tez-tez xarid qiladi ·
            <strong>M</strong>onetary — qancha summa xarid qilgan
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}
