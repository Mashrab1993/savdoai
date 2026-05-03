"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Crown, Award, Search, Download, AlertCircle } from "lucide-react"
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

  const RANK_ACCENT = ["#D97706", "#9C8A6E", "#C75D3C"]

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Top <span className="italic text-[#C75D3C]">tovarlar</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Aprel 2026 · 10 eng ko'p sotilgan · Jami: <span className="text-emerald-700 font-medium">{fmt(totalSum / 1_000_000)} M</span> so'm · {fmt(totalQty)} dona</p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sorted.slice(0, 3).map((t, i) => {
              const Icon = i === 0 ? Crown : Award
              const accent = RANK_ACCENT[i]
              return (
                <Card key={t.id} className="p-6 bg-white border-2 shadow-sm rounded-2xl relative overflow-hidden" style={{ borderColor: `${accent}55` }}>
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-9 h-9 p-1.5 rounded-2xl text-white shadow-sm" style={{ background: accent }} />
                    <span className="text-3xl font-medium opacity-50" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>#{i + 1}</span>
                  </div>
                  <div className="text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{t.name}</div>
                  <div className="text-xs text-[#9C8A6E] mt-1">{t.brand}</div>
                  <div className="text-2xl font-medium text-[#1A1A1A] mt-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(t.sum / 1_000_000)} M so'm</div>
                  <div className="text-xs text-[#6B5B4D] mt-1">{fmt(t.qty)} dona · {t.orders} zakaz</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar yoki brend..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <div className="flex gap-1 border border-[#E8E0D3] rounded-lg p-1 bg-[#FAF7F2]">
                {(["sum", "qty", "orders"] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${sortBy === s ? "bg-[#C75D3C] text-white" : "text-[#6B5B4D] hover:bg-white"}`}>
                    {s === "sum" ? "Summa" : s === "qty" ? "Miqdor" : "Zakaz"}
                  </button>
                ))}
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length} ta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Brend</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotuv summasi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ulush %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'sish</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const idx = sorted.findIndex(s => s.id === t.id)
                    const pct = (t.sum / totalSum * 100)
                    return (
                      <tr key={t.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#9C8A6E]">#{idx + 1}</td>
                        <td className="py-3 px-2">
                          <Link href={`/sklad/tovar/${t.id}`} className="font-medium text-[#C75D3C] hover:underline">{t.name}</Link>
                        </td>
                        <td className="py-3 px-2 text-[#6B5B4D]">{t.brand}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(t.qty)}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(t.sum)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{t.orders}</td>
                        <td className="py-3 px-2 text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#C75D3C]" style={{ width: `${(pct / 25) * 100}%` }} />
                            </div>
                            <span className="font-medium w-10 text-[#1A1A1A]">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${t.trend >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                          {t.trend >= 0 ? "+" : ""}{t.trend.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                    <td colSpan={3} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Top {data.length} jami:</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(totalQty)}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalSum)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{data.reduce((s, t) => s + t.orders, 0)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">100.0%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
