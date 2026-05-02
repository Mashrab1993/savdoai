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
  {
    id: 1, date: "2026-05-02", client: "Salom Magazin №1", agent: "Babadjanova N.",
    totalScore: 92, maxScore: 100,
    scores: { "Foto-hisobot": 25, "Mavjudlik": 25, "Facing": 23, "Narx": 10, "Tozalik": 9 },
    photos: 6, passed: true, issues: [],
  },
  {
    id: 2, date: "2026-05-02", client: "Bona Магазин", agent: "Berdiyev R.",
    totalScore: 78, maxScore: 100,
    scores: { "Foto-hisobot": 22, "Mavjudlik": 20, "Facing": 18, "Narx": 10, "Tozalik": 8 },
    photos: 4, passed: true, issues: ["Facing past — 64%, target 80%+"],
  },
  {
    id: 3, date: "2026-05-01", client: "Дастархон Сервис", agent: "Sayitqulov M.",
    totalScore: 96, maxScore: 100,
    scores: { "Foto-hisobot": 25, "Mavjudlik": 25, "Facing": 25, "Narx": 11, "Tozalik": 10 },
    photos: 8, passed: true, issues: [],
  },
  {
    id: 4, date: "2026-05-01", client: "Гулямов Маркет", agent: "ДАВЛАТ",
    totalScore: 58, maxScore: 100,
    scores: { "Foto-hisobot": 12, "Mavjudlik": 18, "Facing": 12, "Narx": 8, "Tozalik": 8 },
    photos: 2, passed: false, issues: ["Foto-hisobot to'liq emas (2 foto)", "Polkada chang", "Facing ko'rsatkich juda past"],
  },
  {
    id: 5, date: "2026-04-30", client: "Турсун Ake Магазин", agent: "BORIEV M.",
    totalScore: 88, maxScore: 100,
    scores: { "Foto-hisobot": 24, "Mavjudlik": 22, "Facing": 22, "Narx": 10, "Tozalik": 10 },
    photos: 5, passed: true, issues: [],
  },
  {
    id: 6, date: "2026-04-29", client: "Билтек Маркет", agent: "Турсунов Ж.",
    totalScore: 64, maxScore: 100,
    scores: { "Foto-hisobot": 18, "Mavjudlik": 18, "Facing": 14, "Narx": 8, "Tozalik": 6 },
    photos: 3, passed: false, issues: ["Tozalik past — polkada chang/iflos", "Top-10 SKU dan 3 tasi yo'q"],
  },
]

const STANDARDS_MAX: Record<string, number> = {
  "Foto-hisobot": 25, "Mavjudlik": 25, "Facing": 25, "Narx": 12, "Tozalik": 13,
}

function getScoreColor(score: number, max: number) {
  const pct = score / max
  if (pct >= 0.9) return "text-emerald-700 bg-emerald-100"
  if (pct >= 0.75) return "text-blue-700 bg-blue-100"
  if (pct >= 0.6) return "text-amber-700 bg-amber-100"
  return "text-rose-700 bg-rose-100"
}

export default function QualityControlPage() {
  const passedCount = CHECKS.filter(c => c.passed).length
  const failedCount = CHECKS.filter(c => !c.passed).length
  const passRate = Math.round((passedCount / CHECKS.length) * 100)
  const avgScore = Math.round(CHECKS.reduce((s, c) => s + c.totalScore, 0) / CHECKS.length)

  const sorted = [...CHECKS].sort((a, b) => b.totalScore - a.totalScore)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
              Sifat nazorati (QC)
            </h1>
            <p className="text-sm text-slate-500">Qoidalar va standartlarga muvofiqlik · {CHECKS.length} ta tekshiruv</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Hafta</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">O'tdi</div>
            <div className="text-2xl font-bold mt-1">{passedCount}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <XCircle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">O'tmadi</div>
            <div className="text-2xl font-bold mt-1">{failedCount}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Pass rate</div>
            <div className="text-2xl font-bold mt-1">{passRate}%</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <ShieldCheck className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">O'rta ball</div>
            <div className="text-2xl font-bold mt-1">{avgScore}/100</div>
          </Card>
        </div>

        {failedCount > 0 && (
          <Card className="p-5 bg-rose-50 border-rose-200">
            <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> O'tmagan tekshiruvlar ({failedCount})
            </h3>
            <div className="space-y-2">
              {CHECKS.filter(c => !c.passed).map(c => (
                <div key={c.id} className="bg-white p-3 rounded-lg border border-rose-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold">{c.client}</span>
                      <span className="text-xs text-slate-500 ml-2">{c.agent} · {c.date}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold">{c.totalScore}/100</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-0.5">
                    {c.issues.map((iss, i) => <li key={i}>• {iss}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">QC tekshiruvlari ranking</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Klient / Agent</th>
                  <th className="py-3 px-2 text-center">Foto-hisobot</th>
                  <th className="py-3 px-2 text-center">Mavjudlik</th>
                  <th className="py-3 px-2 text-center">Facing</th>
                  <th className="py-3 px-2 text-center">Narx</th>
                  <th className="py-3 px-2 text-center">Tozalik</th>
                  <th className="py-3 px-2 text-center">Foto</th>
                  <th className="py-3 px-2 text-right">Total</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold">{c.client}</div>
                      <div className="text-xs text-slate-500">{c.agent} · {c.date}</div>
                    </td>
                    {Object.entries(c.scores).map(([k, v]) => (
                      <td key={k} className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${getScoreColor(v, STANDARDS_MAX[k])}`}>
                          {v}/{STANDARDS_MAX[k]}
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-2 text-center">
                      <span className="text-xs flex items-center justify-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span className="font-mono">{c.photos}</span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`text-base font-bold font-mono px-2 py-0.5 rounded ${getScoreColor(c.totalScore, c.maxScore)}`}>
                        {c.totalScore}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {c.passed ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ O'tdi</span>
                                 : <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">✕ Yo'q</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
