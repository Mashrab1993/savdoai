"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, Lightbulb, Target, Crown, Calendar } from "lucide-react"
import Link from "next/link"

const INSIGHTS = [
  { type: "champion", icon: Crown, color: "amber", title: "Champion klient", text: "Salom Magazin №1 — sizning 1-pog'onali klientingiz. 21 oy davomida 168 zakaz, 28.4M tushum keltirgan." },
  { type: "trend", icon: TrendingUp, color: "emerald", title: "O'sish trendi", text: "Oxirgi 6 oyda zakazlar +24% o'sgan. Bu klientga premium tovar taklif qilish uchun ideal vaqt." },
  { type: "risk", icon: AlertCircle, color: "amber", title: "Diversifikatsiya kerak", text: "Faqat 12 ta SKU sotib olmoqda. Yana 5-7 ta yangi tovar kiritish mumkin (Voda Premium, Pechenye)." },
  { type: "tip", icon: Lightbulb, color: "blue", title: "Vizit ritmi", text: "O'rta vizitlar oralig'i 4-5 kun. Aniq ritmga ega — payshanba va seshanba ishlash optimal." },
]

const RECOMMENDATIONS = [
  { product: "Voda Premium 1L", reason: "Coca-Cola bilan birga sotib olganlar 87%da Voda ham oladi", upliftPct: 25, confidence: 88 },
  { product: "Pechenye Yubileynoye", reason: "Champions klientlar 65%da bu mahsulotni sotib oladi", upliftPct: 18, confidence: 76 },
  { product: "Bonjur 50g (3-4 oy oldin)", reason: "Avval sotib olgan, hozir to'xtagan — qaytarish mumkin", upliftPct: 12, confidence: 72 },
]

const NEXT_BEST_ACTIONS = [
  { action: "Premium paket taklif (Coca + Voda)", expectedRevenue: 320_000, priority: 1, eta: "2 kun" },
  { action: "Yangi assortiment kiritish (5 SKU)", expectedRevenue: 480_000, priority: 2, eta: "1 hafta" },
  { action: "Loyalty programmaga taklif", expectedRevenue: 180_000, priority: 3, eta: "1 oy" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const COLOR_BG: Record<string, string> = {
  amber: "bg-amber-50 border-amber-300",
  emerald: "bg-emerald-50 border-emerald-300",
  blue: "bg-blue-50 border-blue-300",
}
const COLOR_TEXT: Record<string, string> = {
  amber: "text-amber-700",
  emerald: "text-emerald-700",
  blue: "text-blue-700",
}

export default function ClientAiInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-violet-600" />
              AI Insights · Klient #{id}
            </h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · AI tahlil va shaxsiylashtirilgan tavsiyalar</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Bugun yangilangan</Button>
        </div>

        <Card className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-300">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-violet-700 mb-1">AI XULOSA</div>
              <h2 className="text-xl font-bold mb-2">Bu klient bilan ishlashda — hayotiy qiymat 84M (3-4x current)</h2>
              <p className="text-sm text-slate-700">
                Salom Magazin №1 — Champions segmentida, 21 oy davomida 168 zakaz qilgan, oxirgi vizit 02.05.
                AI xulosasi: <span className="font-bold">VIP statusi berish, premium tovar taklif qilish va loyalty programmaga kiritish</span> orqali
                CLV ni hozirgi 28M dan 84M gacha o'stirish mumkin (3 yillik istiqbolda).
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INSIGHTS.map((ins, i) => {
            const Icon = ins.icon
            return (
              <Card key={i} className={`p-5 border-2 ${COLOR_BG[ins.color]}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-6 h-6 flex-shrink-0 ${COLOR_TEXT[ins.color]}`} />
                  <div>
                    <h3 className={`font-bold ${COLOR_TEXT[ins.color]}`}>{ins.title}</h3>
                    <p className="text-sm text-slate-700 mt-1">{ins.text}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            AI tovar tavsiyalari (Recommender Engine)
          </h2>
          <div className="space-y-3">
            {RECOMMENDATIONS.map(r => (
              <div key={r.product} className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">{r.product}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{r.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Sotuv uplift</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono">+{r.upliftPct}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="text-sm font-mono font-bold">{r.confidence}%</div>
                </div>
                <Button size="sm" className="gap-1 ml-2">Tavsiya bering</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-600" />
            Next Best Actions (NBA)
          </h2>
          <div className="space-y-2">
            {NEXT_BEST_ACTIONS.map(a => (
              <div key={a.action} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  a.priority === 1 ? "bg-rose-500" : a.priority === 2 ? "bg-amber-500" : "bg-blue-500"
                }`}>
                  {a.priority}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{a.action}</div>
                  <div className="text-xs text-slate-500 mt-0.5">ETA: {a.eta}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Kutilgan tushum</div>
                  <div className="text-base font-mono font-bold text-emerald-700">+{fmt(a.expectedRevenue)}</div>
                </div>
                <Button size="sm">Bajarish</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
