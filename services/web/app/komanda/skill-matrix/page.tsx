"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, GraduationCap, TrendingUp, Download } from "lucide-react"
import Link from "next/link"

const SKILLS = [
  "Sotuv asoslari",
  "Klient muloqoti",
  "Tovar bilimi",
  "Vansel texnikasi",
  "RFM segmentlash",
  "Muzokara",
  "Promo aktsiyalar",
  "Sklad bilimi",
  "AI Copilot",
  "Liderlik",
]

type AgentSkills = {
  id: number; name: string; role: string;
  scores: number[]; certifications: number; yearsExp: number;
}

const AGENTS: AgentSkills[] = [
  { id: 1, name: "BORIEV MIRJALOL", role: "Senior", scores: [5, 5, 5, 5, 4, 5, 4, 4, 3, 4], certifications: 8, yearsExp: 4.5 },
  { id: 2, name: "Babadjanova N.", role: "Senior", scores: [5, 5, 5, 4, 4, 4, 5, 3, 4, 3], certifications: 7, yearsExp: 3.5 },
  { id: 3, name: "ДАВЛАТ", role: "Agent", scores: [4, 4, 5, 4, 3, 3, 4, 4, 2, 2], certifications: 5, yearsExp: 2.5 },
  { id: 4, name: "Berdiyev R.", role: "Agent", scores: [4, 4, 4, 4, 3, 3, 3, 3, 3, 2], certifications: 4, yearsExp: 2.0 },
  { id: 5, name: "Sayitqulov M.", role: "Agent", scores: [3, 4, 4, 3, 3, 3, 2, 2, 4, 2], certifications: 3, yearsExp: 1.5 },
  { id: 6, name: "Турсунов Ж.", role: "Junior", scores: [3, 3, 3, 2, 2, 2, 2, 2, 2, 1], certifications: 1, yearsExp: 0.5 },
  { id: 7, name: "Karimov Aziz (yangi)", role: "Trainee", scores: [2, 2, 2, 1, 1, 1, 1, 1, 1, 1], certifications: 0, yearsExp: 0.1 },
  { id: 8, name: "Yusupova M. (yangi)", role: "Trainee", scores: [2, 3, 2, 1, 1, 1, 1, 1, 1, 1], certifications: 0, yearsExp: 0.05 },
]

function getColor(score: number) {
  if (score === 5) return "bg-emerald-600 text-white"
  if (score === 4) return "bg-emerald-400 text-white"
  if (score === 3) return "bg-[#D97706] text-white"
  if (score === 2) return "bg-[#FCE9DD] text-[#D97706]"
  if (score === 1) return "bg-[#F5E5D6] text-[#C75D3C]"
  return "bg-[#F0EAE0]"
}

export default function SkillMatrixPage() {
  const enriched = AGENTS.map(a => ({
    ...a,
    avgScore: a.scores.reduce((s, x) => s + x, 0) / a.scores.length,
    weakest: SKILLS[a.scores.indexOf(Math.min(...a.scores))],
    strongest: SKILLS[a.scores.indexOf(Math.max(...a.scores))],
  }))

  const skillStats = SKILLS.map((skill, i) => {
    const scores = AGENTS.map(a => a.scores[i])
    return {
      skill,
      avg: Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10) / 10,
      max: Math.max(...scores),
      min: Math.min(...scores),
      gap: Math.max(...scores) - Math.min(...scores),
    }
  }).sort((a, b) => b.gap - a.gap)

  const lowestSkills = skillStats.filter(s => s.avg < 3).slice(0, 3)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Ko'nikmalar <span className="italic text-[#C75D3C]">matritsasi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{AGENTS.length} xodim × {SKILLS.length} ko'nikma · 1-5 baholash</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Matritsa</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="text-left py-3 px-2 sticky left-0 bg-[#FAF7F2] z-10 min-w-[200px] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Xodim</th>
                    {SKILLS.map((s, i) => (
                      <th key={i} className="text-center py-3 px-1 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" style={{ writingMode: "vertical-rl", textOrientation: "mixed", height: "120px" }}>{s}</th>
                    ))}
                    <th className="text-center py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(a => (
                    <tr key={a.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 sticky left-0 bg-white z-10">
                        <div className="font-medium text-sm text-[#1A1A1A]">{a.name}</div>
                        <div className="text-xs text-[#9C8A6E]">{a.role} · {a.yearsExp}y · {a.certifications} sert</div>
                      </td>
                      {a.scores.map((score, i) => (
                        <td key={i} className="text-center py-1 px-1">
                          <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center font-medium text-sm ${getColor(score)}`}>
                            {score}
                          </div>
                        </td>
                      ))}
                      <td className="text-center py-2 px-2">
                        <span className={`px-2 py-0.5 rounded font-mono tabular-nums font-medium text-sm ${a.avgScore >= 4 ? "bg-emerald-50 text-emerald-700" : a.avgScore >= 3 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                          {a.avgScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t border-[#E8E0D3]">
                    <td className="py-3 px-2 sticky left-0 bg-[#FAF7F2] z-10 text-[#1A1A1A]">Komanda o'rta</td>
                    {SKILLS.map((s, i) => {
                      const avg = AGENTS.reduce((sum, a) => sum + a.scores[i], 0) / AGENTS.length
                      return (
                        <td key={i} className="text-center py-1 px-1">
                          <span className={`text-xs font-mono tabular-nums font-medium ${avg >= 3.5 ? "text-emerald-700" : avg >= 2.5 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>
                            {avg.toFixed(1)}
                          </span>
                        </td>
                      )
                    })}
                    <td className="text-center py-3 px-2 font-mono tabular-nums text-[#1A1A1A]">
                      {(AGENTS.reduce((s, a) => s + a.scores.reduce((s2, x) => s2 + x, 0) / a.scores.length, 0) / AGENTS.length).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-[#6B5B4D] flex-wrap">
              <span className="text-[#9C8A6E] uppercase tracking-wider">Shkala:</span>
              <div className="flex items-center gap-1"><span className="w-5 h-5 bg-[#F5E5D6] text-[#C75D3C] rounded inline-flex items-center justify-center font-medium">1</span> Yo'q</div>
              <div className="flex items-center gap-1"><span className="w-5 h-5 bg-[#FCE9DD] text-[#D97706] rounded inline-flex items-center justify-center font-medium">2</span> Boshlang'ich</div>
              <div className="flex items-center gap-1"><span className="w-5 h-5 bg-[#D97706] text-white rounded inline-flex items-center justify-center font-medium">3</span> O'rta</div>
              <div className="flex items-center gap-1"><span className="w-5 h-5 bg-emerald-400 text-white rounded inline-flex items-center justify-center font-medium">4</span> Yaxshi</div>
              <div className="flex items-center gap-1"><span className="w-5 h-5 bg-emerald-600 text-white rounded inline-flex items-center justify-center font-medium">5</span> Mukammal</div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <TrendingUp className="w-5 h-5 text-emerald-700" /> Komandadagi ko'nikma gaplari
              </h2>
              <div className="space-y-2">
                {skillStats.slice(0, 5).map(s => (
                  <div key={s.skill} className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg border border-[#F0EAE0]">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[#1A1A1A]">{s.skill}</div>
                      <div className="text-xs text-[#9C8A6E]">Avg {s.avg} · Min {s.min} · Max {s.max}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#9C8A6E] uppercase tracking-wider">Gap</div>
                      <div className={`text-lg font-medium font-mono tabular-nums ${s.gap >= 3 ? "text-[#C75D3C]" : s.gap >= 2 ? "text-[#D97706]" : "text-emerald-700"}`}>{s.gap}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Sparkles className="w-5 h-5 text-[#C75D3C]" /> AI tavsiyalar
              </h2>
              <div className="space-y-3 text-sm text-[#1A1A1A]">
                {lowestSkills.length > 0 && (
                  <div>
                    <div className="font-medium text-[#C75D3C] mb-1">Eng past o'rta ko'nikmalar:</div>
                    <ul className="space-y-1">
                      {lowestSkills.map(s => (
                        <li key={s.skill} className="text-[#6B5B4D]">• <span className="font-medium text-[#1A1A1A]">{s.skill}</span> ({s.avg}) — komanda treningi tavsiya etiladi</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="font-medium text-[#C75D3C] mb-1">Mentorlik:</div>
                  <ul className="space-y-1 text-[#6B5B4D]">
                    <li>• <span className="font-medium text-[#1A1A1A]">BORIEV M.</span> → Турсунов Ж. (Sotuv + Vansel)</li>
                    <li>• <span className="font-medium text-[#1A1A1A]">Babadjanova N.</span> → Karimov A. (Yangi onboarding)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
