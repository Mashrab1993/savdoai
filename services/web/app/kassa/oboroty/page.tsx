"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KassaTarixRow = {
  id: number
  sana: string
  turi?: string
  summa: number
  izoh?: string
}

type KassaTarix = { items: KassaTarixRow[]; total: number }

export default function OborotyPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KassaTarix>(isAuthenticated ? "/api/v1/kassa/tarix?limit=500" : null)

  const items = data?.items ?? []
  // Group by month
  const byMonth: Record<string, { kirim: number; chiqim: number; soni: number }> = {}
  items.forEach(it => {
    const m = it.sana.slice(0, 7) // YYYY-MM
    if (!byMonth[m]) byMonth[m] = { kirim: 0, chiqim: 0, soni: 0 }
    byMonth[m].soni++
    if ((it.turi || "").toLowerCase() === "kirim") byMonth[m].kirim += Number(it.summa || 0)
    else byMonth[m].chiqim += Number(it.summa || 0)
  })

  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))
  const totalKirim = items.filter(i => (i.turi || "").toLowerCase() === "kirim").reduce((s, i) => s + Number(i.summa || 0), 0)
  const totalChiqim = items.filter(i => (i.turi || "").toLowerCase() !== "kirim").reduce((s, i) => s + Number(i.summa || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aylanma (Oboroty)</h1>
            <p className="text-base text-slate-500 mt-1">
              Kassa kirim/chiqim oylar bo'yicha
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm uppercase font-semibold text-emerald-700">Jami kirim</span>
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-800 tabular-nums">{formatCurrency(totalKirim)}</div>
          </Card>
          <Card className="p-5 border-rose-200 bg-rose-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm uppercase font-semibold text-rose-700">Jami chiqim</span>
              <TrendingDown className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{formatCurrency(totalChiqim)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && months.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Oy</th>
                    <th className="px-4 py-3 text-right font-semibold">Operatsiya</th>
                    <th className="px-4 py-3 text-right font-semibold">Kirim</th>
                    <th className="px-4 py-3 text-right font-semibold">Chiqim</th>
                    <th className="px-4 py-3 text-right font-semibold">Sof</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {months.map(([m, s]) => (
                    <tr key={m} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{m}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-500">{s.soni}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-700">+{formatCurrency(s.kirim)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-rose-700">−{formatCurrency(s.chiqim)}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-bold ${s.kirim - s.chiqim >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                        {formatCurrency(s.kirim - s.chiqim)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && months.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha aylanma yo'q</Card>
        )}
      </div>
    </AdminLayout>
  )
}
