"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type OylikRow = {
  oy?: string
  month?: string
  tushum?: number
  jami?: number
  sotuv_soni?: number
}
type OylikResp = OylikRow[] | { items?: OylikRow[] }

export default function OylikPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<OylikResp>(isAuthenticated ? "/api/v1/hisobot/oylik-trend" : null)
  const items: OylikRow[] = Array.isArray(data) ? data : (data?.items ?? [])
  const sorted = items.slice().sort((a, b) => (b.oy || b.month || "").localeCompare(a.oy || a.month || ""))
  const max = sorted.reduce((m, x) => Math.max(m, Number(x.tushum ?? x.jami ?? 0)), 0) || 1

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Oylik hisobot</h1>
            <p className="text-base text-slate-500 mt-1">
              Oylar bo'yicha sotuv ma'lumotlari
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && sorted.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha oylik ma'lumot yo'q</Card>
        )}

        {sorted.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Oy</th>
                    <th className="px-4 py-3 text-right font-semibold">Sotuv soni</th>
                    <th className="px-4 py-3 text-right font-semibold">Tushum</th>
                    <th className="px-4 py-3 text-left font-semibold w-1/3">Hisob</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sorted.map((r, i) => {
                    const sum = Number(r.tushum ?? r.jami ?? 0)
                    const pct = (sum / max) * 100
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 tabular-nums font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {r.oy || r.month || "—"}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.sotuv_soni ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(sum)}</td>
                        <td className="px-4 py-2">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
