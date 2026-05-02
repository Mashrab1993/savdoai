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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Kunlik trend</h1>
            <p className="text-base text-slate-500 mt-1">Aprel 2026 · {data.length} kun · Jami: <span className="font-bold text-emerald-700">{fmt(total / 1_000_000)} M so'm</span></p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Calendar className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">O'rtacha kun</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(Math.round(avg / 1_000_000))} M</div>
            <div className="text-xs text-slate-600 mt-1">so'm/kun</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <TrendingUp className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Peak kun</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(peakDay.sotuv / 1_000_000)} M</div>
            <div className="text-xs text-slate-600 mt-1 font-mono">{peakDay.date}</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <Calendar className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Jami zakaz</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalZakaz)}</div>
            <div className="text-xs text-slate-600 mt-1">o'rt: {Math.round(totalZakaz / data.length)}/kun</div>
          </Card>
          <Card className={`p-5 border-2 ${dayGrowth >= 0 ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300" : "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300"}`}>
            {dayGrowth >= 0 ? <TrendingUp className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" /> : <TrendingDown className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />}
            <div className={`text-xs font-bold ${dayGrowth >= 0 ? "text-emerald-700" : "text-rose-700"}`}>So'nggi o'sish</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{dayGrowth >= 0 ? "+" : ""}{dayGrowth.toFixed(1)}%</div>
            <div className="text-xs text-slate-600 mt-1">kun-bu-kun</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Kunlik sotuv chart (30 kun)</h2>
          <div className="h-64 flex items-end gap-1">
            {data.map((d, i) => {
              const h = (d.sotuv / max * 100)
              const dayNum = parseInt(d.date.split("-")[2])
              const isWeekend = (i % 7) === 5 || (i % 7) === 6
              const isPeak = d.sotuv === max
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group" title={`${d.date}: ${fmt(d.sotuv)} so'm`}>
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-slate-700 absolute -mt-6 bg-white shadow rounded px-1">
                    {fmt(Math.round(d.sotuv / 1_000_000))}M
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${isPeak ? "bg-amber-500 ring-2 ring-amber-300" : isWeekend ? "bg-slate-300" : "bg-gradient-to-t from-emerald-600 to-emerald-400 hover:opacity-80"}`}
                    style={{ height: `${h}%` }}
                  />
                  <div className="text-[10px] font-mono text-slate-500">{dayNum}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" /> Ish kuni</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-300 rounded" /> Dam olish</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded" /> Peak</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Kunlik tafsilot</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Sana</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Zakaz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Klient</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">O'rtacha chek</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">o'sish %</th>
                </tr>
              </thead>
              <tbody>
                {data.slice().reverse().map((d, i) => {
                  const idx = data.findIndex(x => x.date === d.date)
                  const prev = idx > 0 ? data[idx - 1] : null
                  const growth = prev && prev.sotuv ? ((d.sotuv - prev.sotuv) / prev.sotuv * 100) : 0
                  return (
                    <tr key={d.date} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-xs">{d.date}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(d.sotuv)}</td>
                      <td className="py-2 px-2 text-right font-mono">{d.zakaz}</td>
                      <td className="py-2 px-2 text-right font-mono">{d.klient}</td>
                      <td className="py-2 px-2 text-right font-mono">{d.zakaz ? fmt(Math.round(d.sotuv / d.zakaz)) : "—"}</td>
                      <td className={`py-2 px-2 text-right font-mono font-semibold ${idx === 0 ? "text-slate-400" : growth >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
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
    </AdminLayout>
  )
}
