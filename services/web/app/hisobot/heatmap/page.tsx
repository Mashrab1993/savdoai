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
    if (di === 6) return Math.floor((di + hi * 2) % 4)
    if (hi <= 1 || hi >= 9) return ((di * 3 + hi) % 8) + 2
    if (hi >= 3 && hi <= 5) return ((di * 5 + hi * 3) % 18) + 12
    return ((di * 4 + hi * 2) % 14) + 5
  }))
}

export default function HeatmapPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<{ matrix: number[][] }>(isAuthenticated ? "/api/v1/hisobot/heatmap" : null)
  const [matrix] = useState<number[][]>(api?.matrix || genMatrix())
  const usingMock = !api?.matrix

  const max = Math.max(...matrix.flat())
  const total = matrix.flat().reduce((s, n) => s + n, 0)

  const bgFor = (v: number): string => {
    if (v === 0) return "#FAF7F2"
    const pct = v / max
    if (pct >= 0.85) return "#10B981"
    if (pct >= 0.7) return "#34D399"
    if (pct >= 0.55) return "#6EE7B7"
    if (pct >= 0.4) return "#A7F3D0"
    if (pct >= 0.25) return "#D1FAE5"
    return "#ECFDF5"
  }
  const txtFor = (v: number): string => {
    if (v === 0) return "#9C8A6E"
    const pct = v / max
    if (pct >= 0.7) return "white"
    return "#065F46"
  }

  const dayTotals = DAYS.map((_, di) => matrix[di].reduce((s, n) => s + n, 0))
  const hourTotals = HOURS.map((_, hi) => matrix.reduce((s, row) => s + row[hi], 0))
  const peakDayIdx = dayTotals.indexOf(Math.max(...dayTotals))
  const peakHourIdx = hourTotals.indexOf(Math.max(...hourTotals))

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Heatmap — <span className="italic text-[#C75D3C]">Soat × Kun</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Zakaz aktivlik xaritasi · Aprel 2026 · Jami: <span className="font-medium text-emerald-700">{total} zakaz</span></p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KpiCard icon={Activity} accent="#10B981" label="Peak kun" value={`${DAYS[peakDayIdx]} (${dayTotals[peakDayIdx]})`} sub="eng faol kun" />
            <KpiCard icon={Calendar} accent="#3B82F6" label="Peak soat" value={`${HOURS[peakHourIdx]} (${hourTotals[peakHourIdx]})`} sub="eng faol vaqt" />
            <KpiCard icon={Activity} accent="#C75D3C" label="O'rtacha" value={(total / (DAYS.length * HOURS.length)).toFixed(1)} sub="soat-kun" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Aktivlik matritsasi</h2>
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 sticky left-0 bg-white z-10"></th>
                    {HOURS.map(h => (
                      <th key={h} className="text-xs font-mono text-[#6B5B4D] p-2 min-w-[60px] font-medium">{h}</th>
                    ))}
                    <th className="text-xs font-medium text-[#9C8A6E] p-2 bg-[#FAF7F2] min-w-[60px] uppercase tracking-wider">Σ</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d, di) => (
                    <tr key={d}>
                      <td className="text-sm font-medium text-[#1A1A1A] p-2 sticky left-0 bg-white z-10 text-right pr-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{d}</td>
                      {matrix[di].map((v, hi) => (
                        <td key={hi} className="p-1">
                          <div className="text-center text-sm font-medium p-2 rounded hover:scale-110 transition-transform cursor-pointer tabular-nums" style={{ background: bgFor(v), color: txtFor(v) }} title={`${d} ${HOURS[hi]}: ${v} zakaz`}>
                            {v || ""}
                          </div>
                        </td>
                      ))}
                      <td className="text-sm font-medium text-[#1A1A1A] p-2 text-center bg-[#FAF7F2]">{dayTotals[di]}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                    <td className="text-sm font-medium text-[#9C8A6E] p-2 sticky left-0 bg-[#FAF7F2] z-10 text-right pr-3 uppercase tracking-wider">Σ</td>
                    {hourTotals.map((t, hi) => (
                      <td key={hi} className="text-sm font-medium text-[#1A1A1A] p-2 text-center">{t}</td>
                    ))}
                    <td className="text-sm font-medium text-emerald-800 p-2 text-center bg-[#E8E0D3]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#9C8A6E]">
              <span className="uppercase tracking-wider font-medium">Kam</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(p => (
                <div key={p} className="w-6 h-4 rounded" style={{ background: bgFor(max * p) }} />
              ))}
              <span className="uppercase tracking-wider font-medium">Ko'p</span>
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
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
