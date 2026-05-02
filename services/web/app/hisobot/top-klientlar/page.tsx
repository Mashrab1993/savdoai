"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, TrendingUp, Crown, Award, Search, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; name: string; orders: number; sum: number; avg: number; debt: number; trend: number }

const MOCK: Klient[] = [
  { id: 1, name: "Asia Optom Market", orders: 84, sum: 142_800_000, avg: 1_700_000, debt: 18_500_000, trend: 12.4 },
  { id: 2, name: "Globus Plus", orders: 62, sum: 98_600_000, avg: 1_590_000, debt: 12_300_000, trend: 8.6 },
  { id: 3, name: "Mega Skidka Bozor", orders: 56, sum: 84_200_000, avg: 1_503_000, debt: 6_400_000, trend: -2.1 },
  { id: 4, name: "Optom Tovar Service", orders: 48, sum: 72_400_000, avg: 1_508_000, debt: 8_900_000, trend: 18.2 },
  { id: 5, name: "Lider Optom", orders: 42, sum: 58_600_000, avg: 1_395_000, debt: 2_800_000, trend: 5.8 },
  { id: 6, name: "Sharq Magazin", orders: 36, sum: 42_400_000, avg: 1_177_000, debt: 4_200_000, trend: -8.4 },
  { id: 7, name: "Mega Market", orders: 32, sum: 38_400_000, avg: 1_200_000, debt: 0, trend: 22.6 },
  { id: 8, name: "Yangiyul Trade", orders: 28, sum: 32_800_000, avg: 1_171_000, debt: 3_100_000, trend: 6.2 },
  { id: 9, name: "Plov Prazdnik Centr", orders: 24, sum: 28_600_000, avg: 1_191_000, debt: 1_900_000, trend: 14.8 },
  { id: 10, name: "Salom Magazin №1", orders: 22, sum: 22_400_000, avg: 1_018_000, debt: 0, trend: 32.4 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function TopKlientlarPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<Klient[]>(isAuthenticated ? "/api/v1/hisobot/top-klientlar" : null)
  const data = (api && Array.isArray(api) && api.length) ? api : MOCK
  const usingMock = !api || !Array.isArray(api) || !api.length
  const [search, setSearch] = useState("")

  const filtered = data.filter(k => !search || k.name.toLowerCase().includes(search.toLowerCase()))
  const totalSum = data.reduce((s, k) => s + k.sum, 0)
  const cumulPct = data.map((_, i) => data.slice(0, i + 1).reduce((s, k) => s + k.sum, 0) / totalSum * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Top klientlar (Pareto)</h1>
            <p className="text-base text-slate-500 mt-1">Aprel 2026 · 10 eng katta klient · Jami: <span className="font-bold text-emerald-700">{fmt(totalSum)} so'm</span></p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.slice(0, 3).map((k, i) => {
            const Icon = i === 0 ? Crown : i === 1 ? Award : Award
            const colors = ["from-amber-50 to-amber-100/50 border-amber-300 text-amber-600", "from-slate-50 to-slate-100/50 border-slate-300 text-slate-600", "from-orange-50 to-orange-100/50 border-orange-300 text-orange-600"]
            return (
              <Card key={k.id} className={`p-5 border-2 bg-gradient-to-br ${colors[i]}`}>
                <div className="flex items-start justify-between mb-2">
                  <Icon className="w-7 h-7 bg-white p-1.5 rounded-xl shadow-sm" />
                  <span className="text-3xl font-bold opacity-50">#{i + 1}</span>
                </div>
                <div className="text-base font-bold text-slate-900">{k.name}</div>
                <div className="text-xl font-bold text-slate-900 mt-2">{fmt(k.sum / 1_000_000)} M</div>
                <div className="text-xs text-slate-600 mt-1">{k.orders} zakaz · {(k.sum / totalSum * 100).toFixed(1)}% ulush</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient nomi..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Klient</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Zakaz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv summasi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">O'rtacha chek</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Ulush %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Cumulative %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Qarz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">o'sish %</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k, i) => {
                  const idx = data.findIndex(d => d.id === k.id)
                  const pct = (k.sum / totalSum * 100)
                  return (
                    <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-2">
                        <Link href={`/klientlar/${k.id}`} className="font-semibold text-emerald-700 hover:underline">{k.name}</Link>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{k.orders}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(k.sum)}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600">{fmt(k.avg)}</td>
                      <td className="py-3 px-2 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(pct / 25) * 100}%` }} />
                          </div>
                          <span className="font-bold w-10">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-semibold text-violet-700">{cumulPct[idx].toFixed(1)}%</td>
                      <td className={`py-3 px-2 text-right font-mono ${k.debt > 0 ? "text-rose-700 font-bold" : "text-slate-400"}`}>
                        {k.debt > 0 ? fmt(k.debt) : "—"}
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-semibold ${k.trend >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {k.trend >= 0 ? "+" : ""}{k.trend.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-3 px-2 text-slate-700">Top {data.length} jami:</td>
                  <td className="py-3 px-2 text-right font-mono">{data.reduce((s, k) => s + k.orders, 0)}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-800">{fmt(totalSum)}</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(Math.round(totalSum / data.reduce((s, k) => s + k.orders, 0)))}</td>
                  <td colSpan={2} className="py-3 px-2 text-right font-mono text-violet-800">100.0%</td>
                  <td className="py-3 px-2 text-right font-mono text-rose-700">{fmt(data.reduce((s, k) => s + k.debt, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
