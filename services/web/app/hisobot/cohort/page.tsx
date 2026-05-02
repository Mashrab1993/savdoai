"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, Users, TrendingDown } from "lucide-react"
import Link from "next/link"

const COHORTS = [
  { month: "Yanvar 2026", size: 124, retention: [100, 78, 64, 48, 38] },
  { month: "Fevral 2026", size: 96, retention: [100, 82, 68, 52, null] },
  { month: "Mart 2026", size: 142, retention: [100, 84, 72, null, null] },
  { month: "Aprel 2026", size: 168, retention: [100, 86, null, null, null] },
  { month: "May 2026", size: 84, retention: [100, null, null, null, null] },
]

const PERIOD_LABELS = ["M0", "M1", "M2", "M3", "M4"]

function colorForRetention(value: number | null) {
  if (value === null) return "bg-slate-100"
  if (value >= 90) return "bg-emerald-700 text-white"
  if (value >= 75) return "bg-emerald-500 text-white"
  if (value >= 60) return "bg-emerald-300"
  if (value >= 45) return "bg-amber-300"
  if (value >= 30) return "bg-amber-400"
  return "bg-rose-400 text-white"
}

export default function CohortPage() {
  const totalUsers = COHORTS.reduce((s, c) => s + c.size, 0)
  const m1Avg = Math.round(COHORTS.filter(c => c.retention[1] !== null).reduce((s, c) => s + (c.retention[1] ?? 0), 0) / COHORTS.filter(c => c.retention[1] !== null).length)
  const m4Cohort = COHORTS.find(c => c.retention[4] !== null)
  const longTermRetention = m4Cohort ? m4Cohort.retention[4] : 0

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Cohort retention tahlili</h1>
            <p className="text-sm text-slate-500">Klient saqlash dinamikasi (oyma-oy)</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 5-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Users className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami klientlar</div>
            <div className="text-2xl font-bold mt-1">{totalUsers}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <TrendingDown className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">M1 retention (avg)</div>
            <div className="text-2xl font-bold mt-1">{m1Avg}%</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <TrendingDown className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Long-term (M4)</div>
            <div className="text-2xl font-bold mt-1">{longTermRetention ?? "—"}%</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Cohort retention matrix (% klient saqlanish)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-300 py-2 px-2 text-left bg-slate-100">Cohort (oy)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right bg-slate-100">Boshlang'ich klient</th>
                  {PERIOD_LABELS.map(l => (
                    <th key={l} className="border border-slate-300 py-2 px-3 text-center bg-slate-100 w-20">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COHORTS.map(c => (
                  <tr key={c.month}>
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{c.month}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">{c.size}</td>
                    {c.retention.map((v, i) => (
                      <td key={i} className={`border border-slate-300 py-2 px-2 text-center font-mono font-bold transition-all ${colorForRetention(v)}`}>
                        {v === null ? "—" : `${v}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="text-slate-500">Rang shkalasi:</span>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-rose-400 rounded inline-block"></span><span>0-30%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-amber-300 rounded inline-block"></span><span>30-60%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-emerald-300 rounded inline-block"></span><span>60-75%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-emerald-500 rounded inline-block"></span><span>75-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-emerald-700 rounded inline-block"></span><span>90%+</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Retention curve (chart)</h2>
          <div className="h-64 flex items-end gap-3">
            {PERIOD_LABELS.map((label, i) => {
              const cohortsAtPeriod = COHORTS.filter(c => c.retention[i] !== null)
              if (cohortsAtPeriod.length === 0) return null
              const avg = Math.round(cohortsAtPeriod.reduce((s, c) => s + (c.retention[i] ?? 0), 0) / cohortsAtPeriod.length)
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-mono font-bold mb-1">{avg}%</span>
                    <div className="w-full bg-gradient-to-t from-emerald-400 to-emerald-600 rounded-t" style={{ height: `${avg}%` }} />
                  </div>
                  <span className="text-xs font-bold">{label}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500 text-center">O'rtacha retention curve (barcha cohortlar)</div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">💡 Insight</h3>
          <p className="text-sm text-slate-700">
            <span className="font-bold">M1 retention {m1Avg}%</span> ko'rsatadi, ya'ni har 100 yangi klientdan {m1Avg} ta keyingi oyda yana sotib oladi.
            {m1Avg < 70 ? " Bu retention kuchsizroq — onboarding va birinchi-oy follow-up'ni yaxshilash kerak." : " Bu yaxshi ko'rsatkich, davom ettiring."}
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}
