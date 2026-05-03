"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Daily = { date: string; sotuv: number; zakaz: number; klient: number }

const MOCK: Daily[] = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1
  const isWeekend = (i % 7) === 5 || (i % 7) === 6
  const trend = 8_000_000 + i * 120_000
  const variance = Math.sin(i * 0.7) * 2_500_000
  return {
    date: `2026-04-${String(day).padStart(2, "0")}`,
    sotuv: Math.max(0, Math.round((isWeekend ? trend * 0.4 : trend) + variance)),
    zakaz: Math.max(0, Math.round((isWeekend ? 18 : 48) + Math.sin(i) * 12)),
    klient: Math.max(0, Math.round((isWeekend ? 14 : 36) + Math.sin(i + 1) * 8)),
  }
})

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function KunlikPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<Daily[]>(isAuthenticated ? "/api/v1/hisobot/kunlik-trend" : null)
  const data = (api && Array.isArray(api) && api.length) ? api : MOCK
  const usingMock = !api || !Array.isArray(api) || !api.length

  const total = data.reduce((s, d) => s + d.sotuv, 0)
  const totalZakaz = data.reduce((s, d) => s + d.zakaz, 0)
  const avg = total / data.length
  const max = Math.max(...data.map(d => d.sotuv))
  const peakDay = data.find(d => d.sotuv === max)!
  const lastDay = data[data.length - 1]
  const prevDay = data[data.length - 2]
  const dayGrowth = ((lastDay.sotuv - prevDay.sotuv) / prevDay.sotuv * 100)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Kunlik <span className="italic text-[#C75D3C]">trend</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Aprel 2026 · {data.length} kun · Jami: <span className="font-medium text-emerald-700">{fmt(total / 1_000_000)} M so'm</span></p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiCard icon={Calendar} accent="#10B981" label="O'rtacha kun" value={`${fmt(Math.round(avg / 1_000_000))} M`} sub="so'm/kun" />
            <KpiCard icon={TrendingUp} accent="#3B82F6" label="Peak kun" value={`${fmt(peakDay.sotuv / 1_000_000)} M`} sub={peakDay.date} />
            <KpiCard icon={Calendar} accent="#7C3AED" label="Jami zakaz" value={fmt(totalZakaz)} sub={`o'rt: ${Math.round(totalZakaz / data.length)}/kun`} />
            <KpiCard icon={dayGrowth >= 0 ? TrendingUp : TrendingDown} accent={dayGrowth >= 0 ? "#10B981" : "#C75D3C"} label="So'nggi o'sish" value={`${dayGrowth >= 0 ? "+" : ""}${dayGrowth.toFixed(1)}%`} sub="kun-bu-kun" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Kunlik sotuv chart (30 kun)</h2>
            <div className="h-64 flex items-end gap-1">
              {data.map((d, i) => {
                const h = (d.sotuv / max * 100)
                const dayNum = parseInt(d.date.split("-")[2])
                const isWeekend = (i % 7) === 5 || (i % 7) === 6
                const isPeak = d.sotuv === max
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group" title={`${d.date}: ${fmt(d.sotuv)} so'm`}>
                    <div
                      className={`w-full rounded-t transition-all ${isPeak ? "ring-2 ring-[#D97706]/40" : ""}`}
                      style={{ height: `${h}%`, background: isPeak ? "#D97706" : isWeekend ? "#D4C5A8" : "linear-gradient(180deg, #C75D3C 0%, #E27B5C 100%)" }}
                    />
                    <div className="text-[10px] font-mono text-[#9C8A6E]">{dayNum}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex gap-3 text-xs text-[#9C8A6E]">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "#C75D3C" }} /> <span className="text-[#1A1A1A]">Ish kuni</span></span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "#D4C5A8" }} /> <span className="text-[#1A1A1A]">Dam olish</span></span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "#D97706" }} /> <span className="text-[#1A1A1A]">Peak</span></span>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Kunlik tafsilot</h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotuv</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta chek</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'sish %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice().reverse().map(d => {
                    const idx = data.findIndex(x => x.date === d.date)
                    const prev = idx > 0 ? data[idx - 1] : null
                    const growth = prev && prev.sotuv ? ((d.sotuv - prev.sotuv) / prev.sotuv * 100) : 0
                    return (
                      <tr key={d.date} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-2 px-2 font-mono text-xs text-[#1A1A1A]">{d.date}</td>
                        <td className="py-2 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(d.sotuv)}</td>
                        <td className="py-2 px-2 text-right font-mono text-[#1A1A1A]">{d.zakaz}</td>
                        <td className="py-2 px-2 text-right font-mono text-[#1A1A1A]">{d.klient}</td>
                        <td className="py-2 px-2 text-right font-mono text-[#6B5B4D]">{d.zakaz ? fmt(Math.round(d.sotuv / d.zakaz)) : "—"}</td>
                        <td className={`py-2 px-2 text-right font-mono font-medium ${idx === 0 ? "text-[#9C8A6E]" : growth >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                          {idx === 0 ? "—" : (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-7 h-7 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
