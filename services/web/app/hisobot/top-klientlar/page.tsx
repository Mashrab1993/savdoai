"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Crown, Award, Search, Download, AlertCircle } from "lucide-react"
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
                Top <span className="italic text-[#C75D3C]">klientlar (Pareto)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Aprel 2026 · 10 eng katta · Jami: <span className="font-medium text-emerald-700">{fmt(totalSum)} so'm</span></p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.slice(0, 3).map((k, i) => {
              const Icon = i === 0 ? Crown : Award
              const accent = RANK_ACCENT[i]
              return (
                <Card key={k.id} className="p-6 bg-white border-2 shadow-sm rounded-2xl relative overflow-hidden" style={{ borderColor: `${accent}55` }}>
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-9 h-9 p-1.5 rounded-2xl text-white shadow-sm" style={{ background: accent }} />
                    <span className="text-3xl font-medium opacity-50" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>#{i + 1}</span>
                  </div>
                  <div className="text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{k.name}</div>
                  <div className="text-2xl font-medium text-[#1A1A1A] mt-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(k.sum / 1_000_000)} M</div>
                  <div className="text-xs text-[#6B5B4D] mt-1">{k.orders} zakaz · {(k.sum / totalSum * 100).toFixed(1)}% ulush</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient nomi..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length} ta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotuv summasi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta chek</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ulush %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Cum %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qarz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'sish %</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(k => {
                    const idx = data.findIndex(d => d.id === k.id)
                    const pct = (k.sum / totalSum * 100)
                    return (
                      <tr key={k.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#9C8A6E]">#{idx + 1}</td>
                        <td className="py-3 px-2">
                          <Link href={`/klientlar/${k.id}`} className="font-medium text-[#C75D3C] hover:underline">{k.name}</Link>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{k.orders}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(k.sum)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{fmt(k.avg)}</td>
                        <td className="py-3 px-2 text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#C75D3C]" style={{ width: `${(pct / 25) * 100}%` }} />
                            </div>
                            <span className="font-medium w-10 text-[#1A1A1A]">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-purple-700">{cumulPct[idx].toFixed(1)}%</td>
                        <td className={`py-3 px-2 text-right font-mono ${k.debt > 0 ? "text-[#C75D3C] font-medium" : "text-[#9C8A6E]"}`}>
                          {k.debt > 0 ? fmt(k.debt) : "—"}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${k.trend >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                          {k.trend >= 0 ? "+" : ""}{k.trend.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                    <td colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Top {data.length} jami:</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{data.reduce((s, k) => s + k.orders, 0)}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalSum)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(Math.round(totalSum / data.reduce((s, k) => s + k.orders, 0)))}</td>
                    <td colSpan={2} className="py-3 px-2 text-right font-mono text-purple-700 font-medium">100.0%</td>
                    <td className="py-3 px-2 text-right font-mono text-[#C75D3C] font-medium">{fmt(data.reduce((s, k) => s + k.debt, 0))}</td>
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
