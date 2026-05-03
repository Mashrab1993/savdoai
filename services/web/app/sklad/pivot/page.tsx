"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; kategoriya?: string; brend?: string; qoldiq: number; olish_narxi?: number }
type TovarResp = { total: number; items: Tovar[] }

export default function SkladPivotPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const items = data?.items ?? []
  // Pivot: kategoriya × brend → qoldiq qiymati
  const pivot: Record<string, Record<string, number>> = {}
  const brendSet = new Set<string>()
  items.forEach(t => {
    const cat = t.kategoriya || "Boshqa"
    const brend = t.brend || "—"
    brendSet.add(brend)
    if (!pivot[cat]) pivot[cat] = {}
    pivot[cat][brend] = (pivot[cat][brend] || 0) + Math.max(0, t.qoldiq) * Number(t.olish_narxi || 0)
  })
  const brends = Array.from(brendSet).slice(0, 10)
  const cats = Object.keys(pivot).sort()

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sklad pivot (kategoriya × brend)</h1>
            <p className="text-base text-slate-500 mt-1">
              Ombor qiymati pivot table
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>
        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {cats.length > 0 && (
          <Card className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Kategoriya</th>
                  {brends.map(b => <th key={b} className="px-2 py-2 text-right font-semibold">{b}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {cats.map(c => (
                  <tr key={c} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{c}</td>
                    {brends.map(b => {
                      const val = pivot[c][b] || 0
                      return <td key={b} className={`px-2 py-2 text-right tabular-nums ${val > 0 ? "text-emerald-700" : "text-slate-300"}`}>{val > 0 ? formatCurrency(val) : "—"}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
