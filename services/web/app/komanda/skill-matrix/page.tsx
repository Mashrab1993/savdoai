"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Sparkles, GraduationCap, TrendingUp, Download } from "lucide-react"
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
  if (score === 3) return "bg-amber-400 text-white"
  if (score === 2) return "bg-amber-300"
  if (score === 1) return "bg-rose-300"
  return "bg-slate-100"
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-blue-600" />
              Ko'nikmalar matritsasi
            </h1>
            <p className="text-sm text-slate-500">{AGENTS.length} xodim × {SKILLS.length} ko'nikma · 1-5 baholash</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Matritsa</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 sticky left-0 bg-white z-10 min-w-[200px]">Xodim</th>
                  {SKILLS.map((s, i) => (
                    <th key={i} className="text-center py-2 px-1 font-semibold" style={{ writingMode: "vertical-rl", textOrientation: "mixed", height: "120px" }}>{s}</th>
                  ))}
                  <th className="text-center py-2 px-2">O'rta</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2 sticky left-0 bg-white z-10">
                      <div className="font-bold text-sm">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.role} · {a.yearsExp}y · {a.certifications} sert</div>
                    </td>
                    {a.scores.map((score, i) => (
                      <td key={i} className="text-center py-1 px-1">
                        <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center font-bold text-sm ${getColor(score)}`}>
                          {score}
                        </div>
                      </td>
                    ))}
                    <td className="text-center py-2 px-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-sm ${a.avgScore >= 4 ? "bg-emerald-100 text-emerald-700" : a.avgScore >= 3 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {a.avgScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="py-2 px-2 sticky left-0 bg-slate-100 z-10">Komanda o'rta</td>
                  {SKILLS.map((s, i) => {
                    const avg = AGENTS.reduce((sum, a) => sum + a.scores[i], 0) / AGENTS.length
                    return (
                      <td key={i} className="text-center py-1 px-1">
                        <span className={`text-xs font-mono font-bold ${avg >= 3.5 ? "text-emerald-700" : avg >= 2.5 ? "text-amber-700" : "text-rose-700"}`}>
                          {avg.toFixed(1)}
                        </span>
                      </td>
                    )
                  })}
                  <td className="text-center py-2 px-2 font-mono">
                    {(AGENTS.reduce((s, a) => s + a.scores.reduce((s2, x) => s2 + x, 0) / a.scores.length, 0) / AGENTS.length).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className="text-slate-500">Shkala:</span>
            <div className="flex items-center gap-1"><span className="w-5 h-5 bg-rose-300 rounded inline-flex items-center justify-center font-bold">1</span> Yo'q</div>
            <div className="flex items-center gap-1"><span className="w-5 h-5 bg-amber-300 rounded inline-flex items-center justify-center font-bold">2</span> Boshlang'ich</div>
            <div className="flex items-center gap-1"><span className="w-5 h-5 bg-amber-400 text-white rounded inline-flex items-center justify-center font-bold">3</span> O'rta</div>
            <div className="flex items-center gap-1"><span className="w-5 h-5 bg-emerald-400 text-white rounded inline-flex items-center justify-center font-bold">4</span> Yaxshi</div>
            <div className="flex items-center gap-1"><span className="w-5 h-5 bg-emerald-600 text-white rounded inline-flex items-center justify-center font-bold">5</span> Mukammal</div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Komandadagi ko'nikma gaplari</h2>
            <div className="space-y-2">
              {skillStats.slice(0, 5).map(s => (
                <div key={s.skill} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{s.skill}</div>
                    <div className="text-xs text-slate-500">Avg {s.avg} · Min {s.min} · Max {s.max}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Gap</div>
                    <div className={`text-lg font-bold font-mono ${s.gap >= 3 ? "text-rose-700" : s.gap >= 2 ? "text-amber-700" : "text-emerald-700"}`}>{s.gap}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-amber-50 border-amber-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-600" /> AI tavsiyalar</h2>
            <div className="space-y-3 text-sm">
              {lowestSkills.length > 0 && (
                <div>
                  <div className="font-bold text-amber-800 mb-1">📚 Eng past o'rta ko'nikmalar:</div>
                  <ul className="space-y-1">
                    {lowestSkills.map(s => (
                      <li key={s.skill}>• <span className="font-bold">{s.skill}</span> ({s.avg}) — komanda treningi tavsiya etiladi</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="font-bold text-amber-800 mb-1">👥 Mentorlik:</div>
                <ul className="space-y-1">
                  <li>• <span className="font-bold">BORIEV M.</span> → Турсунов Ж. (Sotuv + Vansel)</li>
                  <li>• <span className="font-bold">Babadjanova N.</span> → Karimov A. (Yangi onboarding)</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
