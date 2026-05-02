"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, Activity, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
const DAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sh", "Ya"]

function genMatrix(): number[][] {
  return DAYS.map((_, di) => HOURS.map((_, hi) => {
    if (di === 6) return Math.floor(Math.random() * 4)
    if (hi <= 1 || hi >= 9) return Math.floor(Math.random() * 8 + 2)
    if (hi >= 3 && hi <= 5) return Math.floor(Math.random() * 18 + 12)
    return Math.floor(Math.random() * 14 + 5)
  }))
}

export default function HeatmapPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<{ matrix: number[][] }>(isAuthenticated ? "/api/v1/hisobot/heatmap" : null)
  const [matrix] = useState<number[][]>(api?.matrix || genMatrix())
  const usingMock = !api?.matrix

  const max = Math.max(...matrix.flat())
  const total = matrix.flat().reduce((s, n) => s + n, 0)

  const colorFor = (v: number) => {
    if (v === 0) return "bg-slate-50 text-slate-300"
    const pct = v / max
    if (pct >= 0.85) return "bg-emerald-700 text-white"
    if (pct >= 0.7) return "bg-emerald-600 text-white"
    if (pct >= 0.55) return "bg-emerald-500 text-white"
    if (pct >= 0.4) return "bg-emerald-400 text-emerald-900"
    if (pct >= 0.25) return "bg-emerald-200 text-emerald-800"
    return "bg-emerald-100 text-emerald-700"
  }

  const dayTotals = DAYS.map((_, di) => matrix[di].reduce((s, n) => s + n, 0))
  const hourTotals = HOURS.map((_, hi) => matrix.reduce((s, row) => s + row[hi], 0))
  const peakDayIdx = dayTotals.indexOf(Math.max(...dayTotals))
  const peakHourIdx = hourTotals.indexOf(Math.max(...hourTotals))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Heatmap — Soat × Kun aktivlik</h1>
            <p className="text-base text-slate-500 mt-1">Zakaz aktivlik xaritasi · Aprel 2026 · Jami: <span className="font-bold text-emerald-700">{total} zakaz</span></p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real-time API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Activity className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Peak kun</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{DAYS[peakDayIdx]} ({dayTotals[peakDayIdx]})</div>
            <div className="text-xs text-slate-600 mt-0.5">eng faol kun</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Calendar className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Peak soat</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{HOURS[peakHourIdx]} ({hourTotals[peakHourIdx]})</div>
            <div className="text-xs text-slate-600 mt-0.5">eng faol vaqt</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Activity className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">O'rtacha</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{(total / (DAYS.length * HOURS.length)).toFixed(1)}</div>
            <div className="text-xs text-slate-600 mt-0.5">soat-kun</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Aktivlik matritsasi (kun × soat)</h2>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="text-xs text-slate-500 p-2 sticky left-0 bg-white z-10"></th>
                  {HOURS.map(h => (
                    <th key={h} className="text-xs font-mono text-slate-600 p-2 min-w-[60px] font-semibold">{h}</th>
                  ))}
                  <th className="text-xs font-bold text-slate-700 p-2 bg-slate-50 min-w-[60px]">Σ</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d, di) => (
                  <tr key={d}>
                    <td className="text-sm font-bold text-slate-700 p-2 sticky left-0 bg-white z-10 text-right pr-3">{d}</td>
                    {matrix[di].map((v, hi) => (
                      <td key={hi} className={`p-1`}>
                        <div className={`text-center text-sm font-bold p-2 rounded ${colorFor(v)} hover:scale-110 transition-transform cursor-pointer`} title={`${d} ${HOURS[hi]}: ${v} zakaz`}>
                          {v || ""}
                        </div>
                      </td>
                    ))}
                    <td className="text-sm font-bold text-slate-700 p-2 text-center bg-slate-50">{dayTotals[di]}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="text-sm font-bold text-slate-700 p-2 sticky left-0 bg-slate-50 z-10 text-right pr-3">Σ</td>
                  {hourTotals.map((t, hi) => (
                    <td key={hi} className="text-sm font-bold text-slate-700 p-2 text-center">{t}</td>
                  ))}
                  <td className="text-sm font-bold text-emerald-800 p-2 text-center bg-slate-200">{total}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span>Kam</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(p => (
              <div key={p} className={`w-6 h-4 rounded ${colorFor(max * p)}`} />
            ))}
            <span>Ko'p</span>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
