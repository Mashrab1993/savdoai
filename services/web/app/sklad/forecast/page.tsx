"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type ForecastItem = { tovar_nomi?: string; nomi?: string; bashorat?: number; predicted?: number }
type Resp = ForecastItem[] | { items?: ForecastItem[] }

export default function ForecastPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<Resp>(isAuthenticated ? "/api/v1/forecast/demand" : null)
  const items: ForecastItem[] = Array.isArray(data) ? data : (data?.items ?? [])
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Talab bashorati (AI)</h1>
            <p className="text-base text-slate-500 mt-1">Keyingi 7-14 kun uchun talab prognozi{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        <Card className="p-5 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900">AI bashorati</h3>
              <p className="text-sm text-purple-800 mt-1">Sizning sotuv tarixingiz asosida AI keyingi davr uchun talabni hisoblayadi.</p>
            </div>
          </div>
        </Card>
        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left font-semibold">Tovar</th><th className="px-4 py-3 text-right font-semibold">Bashorat</th></tr></thead>
                <tbody className="divide-y">
                  {items.slice(0, 30).map((it, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{it.tovar_nomi || it.nomi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-purple-700">{it.bashorat ?? it.predicted ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Bashorat hisoblash uchun yetarli ma'lumot yo'q</Card>
        )}
      </div>
    </AdminLayout>
  )
}
