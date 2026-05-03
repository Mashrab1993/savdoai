"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KunlikRow = {
  sana?: string
  date?: string
  tushum?: number
  jami?: number
  sotuv_soni?: number
}
type KunlikResp = KunlikRow[] | { items?: KunlikRow[] }

export default function KunlikPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KunlikResp>(isAuthenticated ? "/api/v1/hisobot/kunlik-trend" : null)
  const items: KunlikRow[] = Array.isArray(data) ? data : (data?.items ?? [])
  const sorted = items.slice().sort((a, b) => (b.sana || b.date || "").localeCompare(a.sana || a.date || ""))
  const max = sorted.reduce((m, x) => Math.max(m, Number(x.tushum ?? x.jami ?? 0)), 0) || 1

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kunlik hisobot</h1>
            <p className="text-base text-slate-500 mt-1">
              Har kunlik sotuv ma'lumotlari (oxirgi 30 kun)
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && sorted.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha sotuv yo'q</Card>
        )}

        {sorted.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
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
                        <td className="px-4 py-2 tabular-nums font-medium">{r.sana || r.date || "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.sotuv_soni ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(sum)}</td>
                        <td className="px-4 py-2">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${pct}%` }} />
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
