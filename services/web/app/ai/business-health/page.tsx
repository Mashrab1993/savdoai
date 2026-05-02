"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, TrendingUp, TrendingDown, AlertCircle, Activity, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"

type HealthMetric = {
  category: string; metric: string; value: number; target: number;
  weight: number; status: "excellent" | "good" | "warning" | "critical";
  trend: "up" | "down" | "stable"; insight: string;
}

const METRICS: HealthMetric[] = [
  { category: "Moliya", metric: "Sof foyda margin", value: 38, target: 35, weight: 15, status: "excellent", trend: "up", insight: "Marja rejadan +3% yuqori, davom eting" },
  { category: "Moliya", metric: "Cash flow daromadlilik", value: 22, target: 20, weight: 10, status: "good", trend: "stable", insight: "Pul oqimi sog'lom" },
  { category: "Klient", metric: "Klient retention %", value: 84, target: 90, weight: 15, status: "warning", trend: "down", insight: "M1 retention pasaymoqda — onboarding kuchaytirish kerak" },
  { category: "Klient", metric: "NPS Score", value: 62, target: 50, weight: 10, status: "excellent", trend: "up", insight: "Mukammal NPS! Promoters 50%dan ko'p" },
  { category: "Sotuv", metric: "Plan bajarish %", value: 92, target: 95, weight: 15, status: "warning", trend: "stable", insight: "Plan 3% kam, agentlarni rag'batlantirish" },
  { category: "Sotuv", metric: "O'rtacha zakaz qiymati", value: 168, target: 150, weight: 10, status: "excellent", trend: "up", insight: "AOV target'dan 12% yuqori" },
  { category: "Operatsiyalar", metric: "Sklad aylanma kuni", value: 18, target: 20, weight: 10, status: "good", trend: "stable", insight: "Tovarlar 18 kunda aylanadi (yaxshi)" },
  { category: "Operatsiyalar", metric: "Yo'qotish %", value: 1.4, target: 2.0, weight: 5, status: "excellent", trend: "down", insight: "Yo'qotish minimal — kontrol kuchli" },
  { category: "Komanda", metric: "Agent KPI rating", value: 4.5, target: 4.0, weight: 5, status: "excellent", trend: "up", insight: "Komanda yuqori darajada ishlamoqda" },
  { category: "Komanda", metric: "Vizit bajarish %", value: 88, target: 90, weight: 5, status: "good", trend: "stable", insight: "Vizit reja yaqin" },
]

function getScore(metrics: HealthMetric[]) {
  const totalWeight = metrics.reduce((s, m) => s + m.weight, 0)
  const weightedScore = metrics.reduce((s, m) => {
    const ratio = Math.min(1.2, m.value / m.target)
    return s + ratio * m.weight
  }, 0)
  return Math.round((weightedScore / totalWeight) * 100)
}

export default function BusinessHealthPage() {
  const overallScore = getScore(METRICS)
  const categories = Array.from(new Set(METRICS.map(m => m.category)))

  const STATUS_COLOR: Record<string, string> = {
    excellent: "bg-emerald-100 text-emerald-700 border-emerald-300",
    good: "bg-blue-100 text-blue-700 border-blue-300",
    warning: "bg-amber-100 text-amber-700 border-amber-300",
    critical: "bg-rose-100 text-rose-700 border-rose-300",
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500" />
              AI Biznes Salomatligi
            </h1>
            <p className="text-sm text-slate-500">Dunyoda yagona AI · 10 metrik bo'yicha biznesingiz salomatligi</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Bugun</Button>
        </div>

        <Card className={`p-8 border-4 text-center ${
          overallScore >= 90 ? "bg-emerald-50 border-emerald-400" :
          overallScore >= 75 ? "bg-blue-50 border-blue-400" :
          overallScore >= 60 ? "bg-amber-50 border-amber-400" :
          "bg-rose-50 border-rose-400"
        }`}>
          <div className="flex items-center justify-center gap-6">
            <div className="relative">
              <div className={`text-7xl font-bold font-mono ${
                overallScore >= 90 ? "text-emerald-700" :
                overallScore >= 75 ? "text-blue-700" :
                overallScore >= 60 ? "text-amber-700" :
                "text-rose-700"
              }`}>
                {overallScore}
              </div>
              <div className="text-sm text-slate-500 -mt-2">/100</div>
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 mb-1">UMUMIY HOLAT</div>
              <div className="text-3xl font-bold mb-1">
                {overallScore >= 90 ? "🌟 Mukammal" :
                 overallScore >= 75 ? "✅ Yaxshi" :
                 overallScore >= 60 ? "⚠️ E'tibor kerak" :
                 "🚨 Kritik"}
              </div>
              <div className="text-sm text-slate-600 max-w-md">
                {overallScore >= 90 ? "Biznesingiz ajoyib holatda — optimallashtirishda davom eting" :
                 overallScore >= 75 ? "Sog'lom biznes — ba'zi metriklarni yaxshilash mumkin" :
                 overallScore >= 60 ? "Bir nechta sohada chuqurroq tahlil va harakat kerak" :
                 "Tezkor harakat zarur — eng muhim ko'rsatkichlarda kasallik belgilari"}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map(cat => {
            const catMetrics = METRICS.filter(m => m.category === cat)
            const catScore = getScore(catMetrics)
            return (
              <Card key={cat} className="p-4">
                <div className="text-xs font-bold text-slate-500 mb-2">{cat}</div>
                <div className={`text-3xl font-bold font-mono ${
                  catScore >= 90 ? "text-emerald-700" :
                  catScore >= 75 ? "text-blue-700" :
                  catScore >= 60 ? "text-amber-700" :
                  "text-rose-700"
                }`}>{catScore}</div>
                <div className="text-xs text-slate-500 mt-1">/{100}</div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${
                    catScore >= 90 ? "bg-emerald-500" :
                    catScore >= 75 ? "bg-blue-500" :
                    catScore >= 60 ? "bg-amber-500" :
                    "bg-rose-500"
                  }`} style={{ width: `${catScore}%` }} />
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" /> Metriklar tafsiloti</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Kategoriya</th>
                  <th className="py-3 px-2">Metrika</th>
                  <th className="py-3 px-2 text-right">Fakt</th>
                  <th className="py-3 px-2 text-right">Target</th>
                  <th className="py-3 px-2 text-center">Trend</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                  <th className="py-3 px-2">AI insight</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m, i) => {
                  const ratio = Math.round((m.value / m.target) * 100)
                  return (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-700">{m.category}</span>
                      </td>
                      <td className="py-3 px-2 font-semibold">{m.metric}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold">{m.value}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-500">{m.target}</td>
                      <td className="py-3 px-2 text-center">
                        {m.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto" />}
                        {m.trend === "down" && <TrendingDown className="w-4 h-4 text-rose-600 mx-auto" />}
                        {m.trend === "stable" && <span className="text-slate-400 mx-auto">—</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLOR[m.status]}`}>
                          {m.status === "excellent" ? "🌟 Mukammal" :
                           m.status === "good" ? "✅ Yaxshi" :
                           m.status === "warning" ? "⚠️ Ogohlantir" :
                           "🚨 Kritik"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs italic text-slate-600">"{m.insight}"</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-rose-50 to-violet-50 border-2 border-rose-300">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-rose-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-rose-800">AI Biznes Salomatligi nima?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Sizning biznesingiz "tibbiy ko'rik"i. 10 ta asosiy metrika 5 ta kategoriya bo'yicha o'lchanadi.
                Har bir ko'rsatkich uchun AI tahlil va insight beriladi. <span className="font-bold">SalesDoc va boshqa CRM'larda bunday yagona analitik yo'q</span> —
                bu SavdoAI'ning dunyoda yagona ficha.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
