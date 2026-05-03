"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = { id: number; sana: string; klient_ismi?: string; jami: number; tolangan?: number }
type SavdoResp = { total: number; items: SotuvRow[] }

export default function KassaPivotPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=500" : null)
  const items = data?.items ?? []

  // Pivot: klient × month
  const pivot: Record<string, Record<string, number>> = {}
  const monthSet = new Set<string>()
  items.forEach(s => {
    const klient = s.klient_ismi || "Boshqa"
    const month = s.sana.slice(0, 7)
    monthSet.add(month)
    if (!pivot[klient]) pivot[klient] = {}
    pivot[klient][month] = (pivot[klient][month] || 0) + Number(s.jami || 0)
  })
  const months = Array.from(monthSet).sort().slice(-6)
  const klients = Object.keys(pivot).sort((a, b) => {
    const sumA = Object.values(pivot[a]).reduce((s, v) => s + v, 0)
    const sumB = Object.values(pivot[b]).reduce((s, v) => s + v, 0)
    return sumB - sumA
  }).slice(0, 30)

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kassa pivot (klient × oy)</h1>
            <p className="text-base text-slate-500 mt-1">
              Top 30 klient bo'yicha oylik sotuv
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && klients.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha sotuv yo'q</Card>
        )}

        {klients.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Klient</th>
                    {months.map(m => <th key={m} className="px-3 py-2 text-right font-semibold">{m.slice(5)}</th>)}
                    <th className="px-3 py-2 text-right font-semibold bg-emerald-50">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {klients.map(k => {
                    const total = months.reduce((s, m) => s + (pivot[k][m] || 0), 0)
                    return (
                      <tr key={k} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium truncate max-w-[180px]">{k}</td>
                        {months.map(m => {
                          const val = pivot[k][m] || 0
                          return (
                            <td key={m} className={`px-3 py-2 text-right tabular-nums ${val > 0 ? "text-slate-900" : "text-slate-300"}`}>
                              {val > 0 ? formatCurrency(val) : "—"}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-emerald-700 bg-emerald-50/50">{formatCurrency(total)}</td>
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
