"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Camera, Calendar, Download } from "lucide-react"
import Link from "next/link"

type QualityCheck = {
  id: number; date: string; client: string; agent: string;
  totalScore: number; maxScore: number;
  scores: Record<string, number>;
  photos: number; passed: boolean;
  issues: string[];
}

const CHECKS: QualityCheck[] = [
  { id: 1, date: "2026-05-02", client: "Salom Magazin №1", agent: "Babadjanova N.", totalScore: 92, maxScore: 100, scores: { "Foto-hisobot": 25, "Mavjudlik": 25, "Facing": 23, "Narx": 10, "Tozalik": 9 }, photos: 6, passed: true, issues: [] },
  { id: 2, date: "2026-05-02", client: "Bona Магазин", agent: "Berdiyev R.", totalScore: 78, maxScore: 100, scores: { "Foto-hisobot": 22, "Mavjudlik": 20, "Facing": 18, "Narx": 10, "Tozalik": 8 }, photos: 4, passed: true, issues: ["Facing past — 64%, target 80%+"] },
  { id: 3, date: "2026-05-01", client: "Дастархон Сервис", agent: "Sayitqulov M.", totalScore: 96, maxScore: 100, scores: { "Foto-hisobot": 25, "Mavjudlik": 25, "Facing": 25, "Narx": 11, "Tozalik": 10 }, photos: 8, passed: true, issues: [] },
  { id: 4, date: "2026-05-01", client: "Гулямов Маркет", agent: "ДАВЛАТ", totalScore: 58, maxScore: 100, scores: { "Foto-hisobot": 12, "Mavjudlik": 18, "Facing": 12, "Narx": 8, "Tozalik": 8 }, photos: 2, passed: false, issues: ["Foto-hisobot to'liq emas (2 foto)", "Polkada chang", "Facing ko'rsatkich juda past"] },
  { id: 5, date: "2026-04-30", client: "Турсун Ake Магазин", agent: "BORIEV M.", totalScore: 88, maxScore: 100, scores: { "Foto-hisobot": 24, "Mavjudlik": 22, "Facing": 22, "Narx": 10, "Tozalik": 10 }, photos: 5, passed: true, issues: [] },
  { id: 6, date: "2026-04-29", client: "Билтек Маркет", agent: "Турсунов Ж.", totalScore: 64, maxScore: 100, scores: { "Foto-hisobot": 18, "Mavjudlik": 18, "Facing": 14, "Narx": 8, "Tozalik": 6 }, photos: 3, passed: false, issues: ["Tozalik past — polkada chang/iflos", "Top-10 SKU dan 3 tasi yo'q"] },
]

const STANDARDS_MAX: Record<string, number> = {
  "Foto-hisobot": 25, "Mavjudlik": 25, "Facing": 25, "Narx": 12, "Tozalik": 13,
}

function getScoreColor(score: number, max: number) {
  const pct = score / max
  if (pct >= 0.9) return "text-emerald-700 bg-emerald-50"
  if (pct >= 0.75) return "text-blue-700 bg-blue-50"
  if (pct >= 0.6) return "text-[#D97706] bg-[#FCE9DD]"
  return "text-[#C75D3C] bg-[#F5E5D6]"
}

export default function QualityControlPage() {
  const passedCount = CHECKS.filter(c => c.passed).length
  const failedCount = CHECKS.filter(c => !c.passed).length
  const passRate = Math.round((passedCount / CHECKS.length) * 100)
  const avgScore = Math.round(CHECKS.reduce((s, c) => s + c.totalScore, 0) / CHECKS.length)

  const sorted = [...CHECKS].sort((a, b) => b.totalScore - a.totalScore)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-2" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                Sifat <span className="italic text-[#C75D3C]">nazorati (QC)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Qoidalar va standartlarga muvofiqlik · {CHECKS.length} ta tekshiruv</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Hafta</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={CheckCircle2} accent="#10B981" label="O'tdi" value={passedCount.toString()} />
            <KpiCard icon={XCircle} accent="#C75D3C" label="O'tmadi" value={failedCount.toString()} />
            <KpiCard icon={ShieldCheck} accent="#3B82F6" label="Pass rate" value={`${passRate}%`} />
            <KpiCard icon={ShieldCheck} accent="#D97706" label="O'rta ball" value={`${avgScore}/100`} />
          </div>

          {failedCount > 0 && (
            <Card className="p-6 bg-white border border-[#C75D3C]/30 shadow-sm rounded-2xl">
              <h3 className="text-lg font-light text-[#1A1A1A] mb-4 flex items-center gap-2" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <AlertTriangle className="w-5 h-5 text-[#C75D3C]" /> O'tmagan tekshiruvlar ({failedCount})
              </h3>
              <div className="space-y-2">
                {CHECKS.filter(c => !c.passed).map(c => (
                  <div key={c.id} className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D3]">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-[#1A1A1A]">{c.client}</span>
                        <span className="text-xs text-[#9C8A6E] ml-2">{c.agent} · {c.date}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C] font-medium">{c.totalScore}/100</span>
                    </div>
                    <ul className="text-xs text-[#6B5B4D] space-y-0.5">
                      {c.issues.map((iss, i) => <li key={i}>• {iss}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>QC tekshiruvlari ranking</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient / Agent</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foto</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Mavjud</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Facing</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Narx</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tozalik</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Fotolar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Total</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, i) => (
                    <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-medium text-[#9C8A6E]">{i + 1}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{c.client}</div>
                        <div className="text-xs text-[#9C8A6E]">{c.agent} · {c.date}</div>
                      </td>
                      {Object.entries(c.scores).map(([k, v]) => (
                        <td key={k} className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${getScoreColor(v, STANDARDS_MAX[k])}`}>
                            {v}/{STANDARDS_MAX[k]}
                          </span>
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center">
                        <span className="text-xs flex items-center justify-center gap-1 text-[#6B5B4D]">
                          <Camera className="w-3 h-3" />
                          <span className="font-mono">{c.photos}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-base font-medium font-mono px-2 py-0.5 rounded ${getScoreColor(c.totalScore, c.maxScore)}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {c.totalScore}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {c.passed ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">✓ O'tdi</span>
                                   : <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C] font-medium">✕ Yo'q</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
