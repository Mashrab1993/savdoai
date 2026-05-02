"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, TrendingUp, TrendingDown, Activity, Calendar, Sparkles } from "lucide-react"
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

const STATUS_COLOR: Record<string, string> = {
  excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-[#FCE9DD] text-[#D97706] border-[#D97706]/30",
  critical: "bg-[#F5E5D6] text-[#C75D3C] border-[#C75D3C]/30",
}

const SCORE_ACCENT = (s: number) => s >= 90 ? "#10B981" : s >= 75 ? "#3B82F6" : s >= 60 ? "#D97706" : "#C75D3C"

export default function BusinessHealthPage() {
  const overallScore = getScore(METRICS)
  const categories = Array.from(new Set(METRICS.map(m => m.category)))
  const overallAccent = SCORE_ACCENT(overallScore)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/dashboard" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AI</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Heart className="w-8 h-8 text-[#C75D3C]" />
                AI Biznes <span className="italic text-[#C75D3C]">Salomatligi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Dunyoda yagona AI · 10 metrika · 5 kategoriya</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Bugun</Button>
          </div>

          <Card className="p-8 bg-white border-2 shadow-sm rounded-2xl text-center" style={{ borderColor: `${overallAccent}55` }}>
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <div className="text-7xl font-medium font-mono tabular-nums" style={{ color: overallAccent, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {overallScore}
                </div>
                <div className="text-sm text-[#9C8A6E] -mt-2">/100</div>
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">UMUMIY HOLAT</div>
                <div className="text-3xl font-light text-[#1A1A1A] mb-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {overallScore >= 90 ? "🌟 Mukammal" :
                   overallScore >= 75 ? "✅ Yaxshi" :
                   overallScore >= 60 ? "⚠️ E'tibor kerak" :
                   "🚨 Kritik"}
                </div>
                <div className="text-sm text-[#6B5B4D] max-w-md">
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
              const accent = SCORE_ACCENT(catScore)
              return (
                <Card key={cat} className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{cat}</div>
                  <div className="text-3xl font-medium font-mono tabular-nums mt-2" style={{ color: accent, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{catScore}</div>
                  <div className="text-xs text-[#9C8A6E] mt-1">/100</div>
                  <div className="mt-3 h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${catScore}%`, background: accent }} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <Activity className="w-5 h-5 text-[#C75D3C]" /> Metriklar tafsiloti
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kategoriya</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Metrika</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Fakt</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Target</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Trend</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">AI insight</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((m, i) => (
                    <tr key={i} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#FCE9DD] text-[#C75D3C] font-medium">{m.category}</span>
                      </td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{m.metric}</td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{m.value}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#9C8A6E]">{m.target}</td>
                      <td className="py-3 px-2 text-center">
                        {m.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto" />}
                        {m.trend === "down" && <TrendingDown className="w-4 h-4 text-[#C75D3C] mx-auto" />}
                        {m.trend === "stable" && <span className="text-[#9C8A6E] mx-auto">—</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLOR[m.status]}`}>
                          {m.status === "excellent" ? "🌟 Mukammal" :
                           m.status === "good" ? "✅ Yaxshi" :
                           m.status === "warning" ? "⚠️ Ogohlantir" :
                           "🚨 Kritik"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs italic text-[#6B5B4D]">"{m.insight}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border-2 border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#C75D3C]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">QANDAY ISHLAYDI</div>
                <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>AI Biznes Salomatligi</h3>
                <p className="text-sm text-[#6B5B4D] mt-2 leading-relaxed">
                  Sizning biznesingiz "tibbiy ko'rik"i. 10 ta asosiy metrika 5 ta kategoriya bo'yicha o'lchanadi.
                  Har bir ko'rsatkich uchun AI tahlil va insight beriladi. <span className="font-medium text-[#C75D3C]">SalesDoc va boshqa CRM'larda bunday yagona analitik yo'q</span> —
                  bu SavdoAI'ning dunyoda yagona ficha.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
