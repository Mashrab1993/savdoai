"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type TopTovar = { nomi: string; sotuv_summa?: number; jami_sotildi?: number; foyda?: number }
type Resp = TopTovar[] | { items?: TopTovar[] }

export default function AbcAnalysisPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<Resp>(isAuthenticated ? "/api/v1/hisobot/top-tovarlar?limit=100" : null)
  const items: TopTovar[] = Array.isArray(data) ? data : (data?.items ?? [])
  const sorted = items.slice().sort((a, b) => Number(b.sotuv_summa || 0) - Number(a.sotuv_summa || 0))
  const total = sorted.reduce((s, x) => s + Number(x.sotuv_summa || 0), 0)

  let cum = 0
  const withCum = sorted.map(t => {
    const sum = Number(t.sotuv_summa || 0)
    cum += sum
    const cumPct = total > 0 ? (cum / total) * 100 : 0
    let bucket: "A" | "B" | "C"
    if (cumPct <= 80) bucket = "A"
    else if (cumPct <= 95) bucket = "B"
    else bucket = "C"
    return { ...t, sum, cumPct, bucket }
  })

  const counts = { A: 0, B: 0, C: 0 }
  const sums = { A: 0, B: 0, C: 0 }
  withCum.forEach(t => { counts[t.bucket]++; sums[t.bucket] += t.sum })

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ABC tahlil (Pareto)</h1>
            <p className="text-base text-slate-500 mt-1">
              80/15/5 tovar guruhlari — eng ko'p tushum keltirayotganlar
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 border-emerald-200 bg-emerald-50/50">
            <div className="text-xs uppercase font-semibold text-emerald-700">A — Asosiylar (80%)</div>
            <div className="text-3xl font-bold text-emerald-800 tabular-nums">{counts.A}</div>
            <div className="text-sm text-slate-600 mt-1">{formatCurrency(sums.A)}</div>
          </Card>
          <Card className="p-5 border-amber-200 bg-amber-50/50">
            <div className="text-xs uppercase font-semibold text-amber-700">B — O'rtachalar (15%)</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{counts.B}</div>
            <div className="text-sm text-slate-600 mt-1">{formatCurrency(sums.B)}</div>
          </Card>
          <Card className="p-5 border-rose-200 bg-rose-50/50">
            <div className="text-xs uppercase font-semibold text-rose-700">C — Kichik (5%)</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{counts.C}</div>
            <div className="text-sm text-slate-600 mt-1">{formatCurrency(sums.C)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {!loading && withCum.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha yetarli sotuv yo'q ABC tahlil uchun</Card>
        )}

        {withCum.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold w-12">Bk</th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-right font-semibold">Tushum</th>
                    <th className="px-4 py-3 text-right font-semibold">Cum %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withCum.slice(0, 50).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          t.bucket === "A" ? "bg-emerald-100 text-emerald-700" :
                          t.bucket === "B" ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        }`}>{t.bucket}</span>
                      </td>
                      <td className="px-4 py-2 font-medium truncate max-w-[400px]">{t.nomi}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(t.sum)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">{t.cumPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
