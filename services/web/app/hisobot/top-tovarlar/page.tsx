"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Crown, Award, Search, Download, AlertCircle, Package } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Tovar = { id: number; name: string; brand: string; qty: number; sum: number; orders: number; trend: number }

const MOCK: Tovar[] = [
  { id: 1, name: "Coca-Cola 1.5L", brand: "Coca-Cola", qty: 4248, sum: 62_870_400, orders: 286, trend: 18.4 },
  { id: 2, name: "Bonjur Молочный 50г", brand: "Bonjur", qty: 5680, sum: 31_240_000, orders: 412, trend: 12.6 },
  { id: 3, name: "Sok Apelsin 1L", brand: "Eco-Drink", qty: 2480, sum: 31_000_000, orders: 184, trend: -2.4 },
  { id: 4, name: "Choco-Boom 75г", brand: "Choco-Boom", qty: 3120, sum: 26_208_000, orders: 248, trend: 8.6 },
  { id: 5, name: "Bonjur Тёмный 100г", brand: "Bonjur", qty: 2240, sum: 25_088_000, orders: 156, trend: 15.2 },
  { id: 6, name: "Fanta 1.5L", brand: "Coca-Cola", qty: 1640, sum: 23_780_000, orders: 124, trend: 6.8 },
  { id: 7, name: "Pechenye Yubileynoye", brand: "Yubileynoye", qty: 1840, sum: 19_136_000, orders: 142, trend: 22.4 },
  { id: 8, name: "Suv 5L Bottle", brand: "Aqua-Plus", qty: 2560, sum: 16_384_000, orders: 196, trend: 5.4 },
  { id: 9, name: "Trufeli Kakao", brand: "Truffles", qty: 480, sum: 13_680_000, orders: 86, trend: -8.6 },
  { id: 10, name: "Hilol pechenye 200g", brand: "Hilol", qty: 1240, sum: 9_834_000, orders: 142, trend: 14.8 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function TopTovarlarPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<Tovar[]>(isAuthenticated ? "/api/v1/hisobot/top-tovarlar" : null)
  const data = (api && Array.isArray(api) && api.length) ? api : MOCK
  const usingMock = !api || !Array.isArray(api) || !api.length
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"sum" | "qty" | "orders">("sum")

  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy])
  const filtered = sorted.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.brand.toLowerCase().includes(search.toLowerCase()))

  const totalSum = data.reduce((s, t) => s + t.sum, 0)
  const totalQty = data.reduce((s, t) => s + t.qty, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Top tovarlar</h1>
            <p className="text-base text-slate-500 mt-1">Aprel 2026 · 10 eng ko'p sotilgan tovar · Jami: {fmt(totalSum / 1_000_000)} M so'm · {fmt(totalQty)} dona</p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sorted.slice(0, 3).map((t, i) => {
            const Icon = i === 0 ? Crown : Award
            const colors = ["from-amber-50 to-amber-100/50 border-amber-300 text-amber-600", "from-slate-50 to-slate-100/50 border-slate-300 text-slate-600", "from-orange-50 to-orange-100/50 border-orange-300 text-orange-600"]
            return (
              <Card key={t.id} className={`p-5 border-2 bg-gradient-to-br ${colors[i]}`}>
                <div className="flex items-start justify-between mb-2">
                  <Icon className="w-7 h-7 bg-white p-1.5 rounded-xl shadow-sm" />
                  <span className="text-3xl font-bold opacity-50">#{i + 1}</span>
                </div>
                <div className="text-base font-bold text-slate-900">{t.name}</div>
                <div className="text-xs text-slate-500 mt-1">{t.brand}</div>
                <div className="text-xl font-bold text-slate-900 mt-2">{fmt(t.sum / 1_000_000)} M so'm</div>
                <div className="text-xs text-slate-600 mt-1">{fmt(t.qty)} dona · {t.orders} zakaz</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar yoki brend..." className="pl-9" />
            </div>
            <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
              {(["sum", "qty", "orders"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${sortBy === s ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {s === "sum" ? "Summa" : s === "qty" ? "Miqdor" : "Zakaz"}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Brend</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Miqdor</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv summasi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Zakaz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Ulush %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">o'sish</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const idx = sorted.findIndex(s => s.id === t.id)
                  const pct = (t.sum / totalSum * 100)
                  return (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-2">
                        <Link href={`/sklad/tovar/${t.id}`} className="font-semibold text-emerald-700 hover:underline">{t.name}</Link>
                      </td>
                      <td className="py-3 px-2 text-slate-600">{t.brand}</td>
                      <td className="py-3 px-2 text-right font-mono">{fmt(t.qty)}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(t.sum)}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600">{t.orders}</td>
                      <td className="py-3 px-2 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(pct / 25) * 100}%` }} />
                          </div>
                          <span className="font-bold w-10">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-semibold ${t.trend >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {t.trend >= 0 ? "+" : ""}{t.trend.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={3} className="py-3 px-2 text-slate-700">Top {data.length} jami:</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(totalQty)}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-800">{fmt(totalSum)}</td>
                  <td className="py-3 px-2 text-right font-mono">{data.reduce((s, t) => s + t.orders, 0)}</td>
                  <td className="py-3 px-2 text-right font-mono">100.0%</td>
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
