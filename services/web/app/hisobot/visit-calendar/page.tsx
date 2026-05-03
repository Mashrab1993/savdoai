"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import Link from "next/link"

const AGENTS = [
  { name: "BORIEV MIRJALOL", accent: "#3B82F6" },
  { name: "Sayitqulov Mashrab", accent: "#10B981" },
  { name: "Berdiyev Rahmatillo", accent: "#D97706" },
  { name: "ДАВЛАТ", accent: "#7C3AED" },
  { name: "Турсунов Жамшид", accent: "#C75D3C" },
  { name: "Babadjanova Nargiza", accent: "#06B6D4" },
]

function visitFor(agentIdx: number, dayIdx: number): number {
  const seeds: Record<string, number> = {
    "0_0": 3, "1_0": 11, "1_1": 6, "2_0": 15, "2_1": 6, "3_0": 12, "3_1": 6, "5_0": 10, "5_1": 8,
  }
  return seeds[`${agentIdx}_${dayIdx}`] ?? 0
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function bgFor(pct: number): string {
  if (pct === 0) return "#FAF7F2"
  if (pct >= 90) return "#10B981"
  if (pct >= 70) return "#A7F3D0"
  if (pct >= 50) return "#FCD9B6"
  if (pct >= 25) return "#FCE9DD"
  return "#F5E5D6"
}
function txtFor(pct: number): string {
  if (pct === 0) return "#9C8A6E"
  if (pct >= 70) return "white"
  if (pct >= 25) return "#7A4316"
  return "#C75D3C"
}

export default function VisitCalendarPage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Visit <span className="italic text-[#C75D3C]">kalendari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Agent × Kun pivot · % visit completion</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-[#E8E0D3] text-[#6B5B4D]"><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-base font-medium px-3 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>May 2026</span>
              <Button variant="outline" size="sm" className="border-[#E8E0D3] text-[#6B5B4D]"><ChevronRight className="w-4 h-4" /></Button>
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <select className="h-10 rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] px-4 text-[#1A1A1A] focus:border-[#C75D3C] focus:outline-none">
                <option>Barcha visit</option>
                <option>Faqat bajarilgan</option>
                <option>Bajarilmagan</option>
              </select>
              <select className="h-10 rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] px-4 text-[#1A1A1A] focus:border-[#C75D3C] focus:outline-none">
                <option>Barcha agentlar</option>
                {AGENTS.map(a => <option key={a.name}>{a.name}</option>)}
              </select>
              <Button style={{ background: "#C75D3C" }}>Filter</Button>
            </div>
          </Card>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                  <tr>
                    <th className="text-left px-4 py-3 sticky left-0 bg-[#FAF7F2] min-w-[200px] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" rowSpan={2}>Agent</th>
                    <th className="text-center px-2 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" colSpan={31}>
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-4 h-4" /> Kun (May)
                      </div>
                    </th>
                  </tr>
                  <tr className="border-t border-[#E8E0D3]">
                    {DAYS.map(d => (
                      <th key={d} className="px-1 py-2 text-center font-medium text-[#9C8A6E] w-8">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map((agent, agentIdx) => (
                    <tr key={agent.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="px-4 py-2 font-medium text-[#1A1A1A] sticky left-0 bg-white">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 rounded" style={{ background: agent.accent }} />
                          <span>{agent.name}</span>
                        </div>
                      </td>
                      {DAYS.map((_d, dayIdx) => {
                        const pct = visitFor(agentIdx, dayIdx)
                        return (
                          <td key={dayIdx} className="p-1">
                            <div className="w-7 h-7 rounded text-center text-xs font-medium flex items-center justify-center" style={{ background: bgFor(pct), color: txtFor(pct) }}>
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

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Rang ma'nosi:</span>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded" style={{ background: "#FAF7F2" }} /> <span className="text-sm text-[#1A1A1A]">0%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded" style={{ background: "#F5E5D6" }} /> <span className="text-sm text-[#1A1A1A]">1-25%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded" style={{ background: "#FCE9DD" }} /> <span className="text-sm text-[#1A1A1A]">25-50%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded" style={{ background: "#FCD9B6" }} /> <span className="text-sm text-[#1A1A1A]">50-70%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded" style={{ background: "#A7F3D0" }} /> <span className="text-sm text-[#1A1A1A]">70-90%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded" style={{ background: "#10B981" }} /> <span className="text-sm text-[#1A1A1A]">90%+ (a'lo)</span></div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
