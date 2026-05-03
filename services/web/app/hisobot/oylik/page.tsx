"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

const MOCK_DATA = [
  { month: "Yanvar", sotuv: 312_400_000, zakaz: 1248, klient: 156, foyda: 48_200_000 },
  { month: "Fevral", sotuv: 298_700_000, zakaz: 1184, klient: 162, foyda: 45_100_000 },
  { month: "Mart", sotuv: 356_200_000, zakaz: 1342, klient: 178, foyda: 56_400_000 },
  { month: "Aprel", sotuv: 412_800_000, zakaz: 1568, klient: 192, foyda: 64_800_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function OylikPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiData, loading } = useApi<typeof MOCK_DATA>(isAuthenticated ? "/api/v1/hisobot/oylik" : null)
  const data = (apiData && Array.isArray(apiData) && apiData.length) ? apiData : MOCK_DATA
  const usingMock = !apiData

  const totalSotuv = data.reduce((s, m) => s + m.sotuv, 0)
  const totalFoyda = data.reduce((s, m) => s + m.foyda, 0)
  const totalZakaz = data.reduce((s, m) => s + m.zakaz, 0)
  const lastMonth = data[data.length - 1]
  const prevMonth = data[data.length - 2]
  const sotuvGrowth = prevMonth ? ((lastMonth.sotuv - prevMonth.sotuv) / prevMonth.sotuv * 100) : 0
  const foydaPct = (totalFoyda / totalSotuv * 100)

  const maxSotuv = Math.max(...data.map(m => m.sotuv))

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Oylik <span className="italic text-[#C75D3C]">hisobot</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Sotuv · zakaz · foyda · klient — Yanvar-Aprel 2026</p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && apiData && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real-time API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <ShoppingBag className="w-7 h-7 text-emerald-600 mb-3" />
              <div className="text-xs uppercase tracking-[0.15em] text-emerald-700 font-medium">Jami sotuv (4 oy)</div>
              <div className="text-2xl font-medium text-[#1A1A1A] mt-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalSotuv / 1_000_000)} M</div>
              <div className={`text-xs mt-1 font-medium flex items-center gap-1 ${sotuvGrowth >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                {sotuvGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {sotuvGrowth >= 0 ? "+" : ""}{sotuvGrowth.toFixed(1)}% Mart→Aprel
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <DollarSign className="w-7 h-7 text-blue-600 mb-3" />
              <div className="text-xs uppercase tracking-[0.15em] text-blue-700 font-medium">Jami foyda</div>
              <div className="text-2xl font-medium text-[#1A1A1A] mt-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalFoyda / 1_000_000)} M</div>
              <div className="text-xs text-blue-700 mt-1 font-medium">Marja: {foydaPct.toFixed(1)}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <ShoppingBag className="w-7 h-7 text-[#C75D3C] mb-3" />
              <div className="text-xs uppercase tracking-[0.15em] text-[#C75D3C] font-medium">Zakazlar</div>
              <div className="text-2xl font-medium text-[#1A1A1A] mt-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalZakaz)}</div>
              <div className="text-xs text-[#C75D3C] mt-1 font-medium">O'rtacha: {fmt(Math.round(totalSotuv / totalZakaz))} so'm</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Users className="w-7 h-7 text-[#D97706] mb-3" />
              <div className="text-xs uppercase tracking-[0.15em] text-[#D97706] font-medium">Aktiv klientlar</div>
              <div className="text-2xl font-medium text-[#1A1A1A] mt-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{lastMonth.klient}</div>
              <div className="text-xs text-[#D97706] mt-1 font-medium">+{lastMonth.klient - data[0].klient} ({((lastMonth.klient - data[0].klient) / data[0].klient * 100).toFixed(1)}%)</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D97706]" />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}><TrendingUp className="w-5 h-5 text-[#C75D3C]" /> Oylik sotuv trendi</h2>
            <div className="grid grid-cols-4 gap-4 h-64 items-end">
              {data.map(m => {
                const h = (m.sotuv / maxSotuv * 100)
                return (
                  <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="text-sm font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(m.sotuv / 1_000_000)} M</div>
                    <div className="w-full max-w-[120px] rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h * 0.6}%`, background: "linear-gradient(180deg, #C75D3C 0%, #E27B5C 100%)" }} title={`${m.month}: ${fmt(m.sotuv)} so'm`}>
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{m.month}</div>
                    <div className="text-xs text-[#9C8A6E]">{m.zakaz} zakaz · {m.klient} klient</div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Oylik tafsilot</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Oy</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotuv (so'm)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rtacha</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foyda</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Marja %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'sish %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((m, i) => {
                    const margin = (m.foyda / m.sotuv * 100)
                    const growth = i > 0 ? ((m.sotuv - data[i - 1].sotuv) / data[i - 1].sotuv * 100) : 0
                    return (
                      <tr key={m.month} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{m.month}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700">{fmt(m.sotuv)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(m.zakaz)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{fmt(Math.round(m.sotuv / m.zakaz))}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{m.klient}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-blue-700">{fmt(m.foyda)}</td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${margin >= 15 ? "text-emerald-700" : margin >= 10 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>
                          {margin.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${i === 0 ? "text-[#9C8A6E]" : growth >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                          {i === 0 ? "—" : (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%"}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                    <td className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami 4 oy</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalSotuv)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(totalZakaz)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(Math.round(totalSotuv / totalZakaz))}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{lastMonth.klient}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-blue-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalFoyda)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{foydaPct.toFixed(1)}%</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
