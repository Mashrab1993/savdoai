"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type HeatmapRow = { dow: number; soat: number; soni: number; jami?: number }
type HeatmapResp = HeatmapRow[] | { items?: HeatmapRow[] }

const DAYS = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sh"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function HeatmapPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<HeatmapResp>(isAuthenticated ? "/api/v1/hisobot/heatmap" : null)
  const items: HeatmapRow[] = Array.isArray(data) ? data : (data?.items ?? [])

  // Build matrix
  const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0))
  let max = 0
  items.forEach(r => {
    if (r.dow >= 0 && r.dow < 7 && r.soat >= 0 && r.soat < 24) {
      matrix[r.dow][r.soat] = r.soni
      if (r.soni > max) max = r.soni
    }
  })

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Heatmap (kun × soat)</h1>
            <p className="text-base text-slate-500 mt-1">
              Sotuv intensivligi vaqt bo'yicha — qaysi vaqtlar peak
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && max === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha yetarli ma'lumot yo'q. 100+ sotuv bo'lgach paydo bo'ladi.
          </Card>
        )}

        {max > 0 && (
          <Card className="p-5">
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="px-2 py-1"></th>
                    {HOURS.map(h => <th key={h} className="px-1 py-1 text-center font-medium text-slate-500">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d, dow) => (
                    <tr key={dow}>
                      <td className="px-2 py-1 font-medium text-slate-700">{d}</td>
                      {HOURS.map(h => {
                        const val = matrix[dow][h]
                        const pct = max > 0 ? val / max : 0
                        const bg = pct === 0 ? "#f8fafc" :
                                   pct < 0.25 ? "#dcfce7" :
                                   pct < 0.5 ? "#86efac" :
                                   pct < 0.75 ? "#22c55e" :
                                                "#15803d"
                        const color = pct > 0.5 ? "white" : "#475569"
                        return (
                          <td key={h} className="text-center" style={{ background: bg, color, padding: "4px 6px", border: "1px solid white" }}>
                            {val > 0 ? val : ""}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500 text-center">
              Yashil — sotuv ko'p, oq — sotuv yo'q
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
