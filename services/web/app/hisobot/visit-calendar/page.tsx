"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import Link from "next/link"

const AGENTS = [
  { name: "BORIEV MIRJALOL", color: "bg-blue-500" },
  { name: "Sayitqulov Mashrab", color: "bg-emerald-500" },
  { name: "Berdiyev Rahmatillo", color: "bg-amber-500" },
  { name: "ДАВЛАТ", color: "bg-purple-500" },
  { name: "Турсунов Жамшид", color: "bg-rose-500" },
  { name: "Babadjanova Nargiza", color: "bg-cyan-500" },
]

function visitFor(agentIdx: number, dayIdx: number): number {
  const seeds: Record<string, number> = {
    "0_0": 3, "1_0": 11, "1_1": 6, "2_0": 15, "2_1": 6, "3_0": 12, "3_1": 6, "5_0": 10, "5_1": 8,
  }
  return seeds[`${agentIdx}_${dayIdx}`] ?? 0
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function getColor(pct: number): string {
  if (pct === 0) return "bg-slate-100 text-slate-300"
  if (pct >= 90) return "bg-emerald-500 text-white"
  if (pct >= 70) return "bg-emerald-300 text-emerald-900"
  if (pct >= 50) return "bg-amber-300 text-amber-900"
  if (pct >= 25) return "bg-amber-200 text-amber-800"
  return "bg-rose-200 text-rose-800"
}

export default function VisitCalendarPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/hisobot" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Hisobotlar
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">📅 Visit kalendari</h1>
            <p className="text-base text-slate-500 mt-1">Agent × Kun pivot · % visit completion</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-base font-semibold px-3">May 2026</span>
            <Button variant="outline" size="sm"><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline"><Download className="w-4 h-4" /> Excel</Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select className="h-10 rounded-lg border-2 border-slate-300 px-4">
              <option>Barcha visit</option>
              <option>Faqat bajarilgan</option>
              <option>Bajarilmagan</option>
            </select>
            <select className="h-10 rounded-lg border-2 border-slate-300 px-4">
              <option>Barcha agentlar</option>
              {AGENTS.map(a => <option key={a.name}>{a.name}</option>)}
            </select>
            <Button>Filter</Button>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-slate-50 min-w-[200px]" rowSpan={2}>Agent</th>
                  <th className="text-center px-2 py-3 font-semibold" colSpan={31}>
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4" /> Kun (May)
                    </div>
                  </th>
                </tr>
                <tr className="border-t border-slate-100">
                  {DAYS.map(d => (
                    <th key={d} className="px-1 py-2 text-center font-medium text-slate-500 w-8">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AGENTS.map((agent, agentIdx) => (
                  <tr key={agent.name} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-8 rounded ${agent.color}`} />
                        <span>{agent.name}</span>
                      </div>
                    </td>
                    {DAYS.map((d, dayIdx) => {
                      const pct = visitFor(agentIdx, dayIdx)
                      return (
                        <td key={dayIdx} className="p-1">
                          <div className={`w-7 h-7 rounded text-center text-xs font-semibold flex items-center justify-center ${getColor(pct)}`}>
                            {pct > 0 ? `${pct}%` : ""}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-slate-600">Rang ma'nosi:</span>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-slate-100" /> <span className="text-sm">0% (yo'q)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-rose-200" /> <span className="text-sm">1-25%</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-amber-200" /> <span className="text-sm">25-50%</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-amber-300" /> <span className="text-sm">50-70%</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-emerald-300" /> <span className="text-sm">70-90%</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-emerald-500" /> <span className="text-sm">90%+ (a'lo)</span></div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
