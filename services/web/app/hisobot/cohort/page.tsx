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
  if (value === null) return "bg-[#FAF7F2] text-[#9C8A6E]"
  if (value >= 90) return "text-white"
  if (value >= 75) return "text-white"
  if (value >= 60) return "text-emerald-900"
  if (value >= 45) return "text-[#7A4316]"
  if (value >= 30) return "text-[#7A4316]"
  return "text-white"
}
function bgForRetention(value: number | null): string {
  if (value === null) return "transparent"
  if (value >= 90) return "#10B981"
  if (value >= 75) return "#34D399"
  if (value >= 60) return "#A7F3D0"
  if (value >= 45) return "#FCD9B6"
  if (value >= 30) return "#F5C9B0"
  return "#C75D3C"
}

export default function CohortPage() {
  const totalUsers = COHORTS.reduce((s, c) => s + c.size, 0)
  const m1Cohorts = COHORTS.filter(c => c.retention[1] !== null)
  const m1Avg = m1Cohorts.length ? Math.round(m1Cohorts.reduce((s, c) => s + (c.retention[1] ?? 0), 0) / m1Cohorts.length) : 0
  const m4Cohort = COHORTS.find(c => c.retention[4] !== null)
  const longTermRetention = m4Cohort ? m4Cohort.retention[4] : 0

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Cohort <span className="italic text-[#C75D3C]">retention</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Klient saqlash dinamikasi (oyma-oy)</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 5-oy</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard icon={Users} accent="#10B981" label="Jami klientlar" value={totalUsers.toString()} />
            <KpiCard icon={TrendingDown} accent="#3B82F6" label="M1 retention (avg)" value={`${m1Avg}%`} />
            <KpiCard icon={TrendingDown} accent="#C75D3C" label="Long-term (M4)" value={`${longTermRetention ?? "—"}%`} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Cohort retention matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="border border-[#E8E0D3] py-2.5 px-2 text-left bg-[#FAF7F2] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Cohort (oy)</th>
                    <th className="border border-[#E8E0D3] py-2.5 px-2 text-right bg-[#FAF7F2] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klientlar</th>
                    {PERIOD_LABELS.map(l => (
                      <th key={l} className="border border-[#E8E0D3] py-2.5 px-3 text-center bg-[#FAF7F2] text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-20">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COHORTS.map(c => (
                    <tr key={c.month}>
                      <td className="border border-[#E8E0D3] py-2.5 px-2 font-medium text-[#1A1A1A]">{c.month}</td>
                      <td className="border border-[#E8E0D3] py-2.5 px-2 text-right font-mono font-medium text-[#1A1A1A]">{c.size}</td>
                      {c.retention.map((v, i) => (
                        <td key={i} className={`border border-[#E8E0D3] py-2.5 px-2 text-center font-mono font-medium ${colorForRetention(v)}`} style={{ background: bgForRetention(v) }}>
                          {v === null ? "—" : `${v}%`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs flex-wrap">
              <span className="text-[#9C8A6E] uppercase tracking-wider font-medium">Shkala:</span>
              {[
                { color: "#C75D3C", label: "0-30%" },
                { color: "#F5C9B0", label: "30-45%" },
                { color: "#FCD9B6", label: "45-60%" },
                { color: "#A7F3D0", label: "60-75%" },
                { color: "#34D399", label: "75-90%" },
                { color: "#10B981", label: "90%+" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-sm inline-block" style={{ background: color }} />
                  <span className="text-[#1A1A1A]">{label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Retention curve</h2>
            <div className="h-64 flex items-end gap-3">
              {PERIOD_LABELS.map((label, i) => {
                const cohortsAtPeriod = COHORTS.filter(c => c.retention[i] !== null)
                if (cohortsAtPeriod.length === 0) return null
                const avg = Math.round(cohortsAtPeriod.reduce((s, c) => s + (c.retention[i] ?? 0), 0) / cohortsAtPeriod.length)
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <span className="text-xs font-mono font-medium mb-1 text-[#1A1A1A]">{avg}%</span>
                      <div className="w-full rounded-t" style={{ height: `${avg}%`, background: "linear-gradient(180deg, #C75D3C 0%, #E27B5C 100%)" }} />
                    </div>
                    <span className="text-xs font-medium text-[#6B5B4D]">{label}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-xs text-[#9C8A6E] text-center">O'rtacha retention curve (barcha cohortlar)</div>
          </Card>

          <Card className="p-5 bg-white border border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C]">INSIGHT</div>
                <p className="text-sm text-[#1A1A1A] mt-1">
                  <span className="font-medium">M1 retention {m1Avg}%</span> ko'rsatadi, ya'ni har 100 yangi klientdan {m1Avg} ta keyingi oyda yana sotib oladi.
                  {m1Avg < 70 ? " Bu retention kuchsizroq — onboarding va birinchi-oy follow-up'ni yaxshilash kerak." : " Bu yaxshi ko'rsatkich, davom ettiring."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
