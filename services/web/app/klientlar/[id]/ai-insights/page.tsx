"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, Lightbulb, Target, Crown, Calendar } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

const INSIGHTS = [
  { type: "champion", icon: Crown, color: "#D97706", bg: "#FCE9DD", title: "Champion klient", text: "Salom Magazin №1 — sizning 1-pog'onali klientingiz. 21 oy davomida 168 zakaz, 28.4M tushum keltirgan." },
  { type: "trend", icon: TrendingUp, color: "#047857", bg: "#ECFDF5", title: "O'sish trendi", text: "Oxirgi 6 oyda zakazlar +24% o'sgan. Bu klientga premium tovar taklif qilish uchun ideal vaqt." },
  { type: "risk", icon: AlertCircle, color: "#D97706", bg: "#FCE9DD", title: "Diversifikatsiya kerak", text: "Faqat 12 ta SKU sotib olmoqda. Yana 5-7 ta yangi tovar kiritish mumkin (Voda Premium, Pechenye)." },
  { type: "tip", icon: Lightbulb, color: "#1D4ED8", bg: "#EFF6FF", title: "Vizit ritmi", text: "O'rta vizitlar oralig'i 4-5 kun. Aniq ritmga ega — payshanba va seshanba ishlash optimal." },
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

export default function ClientAiInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                AI Insights <span className="italic text-[#C75D3C]">va tavsiyalar</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · AI tahlil va shaxsiylashtirilgan tavsiyalar</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Bugun yangilangan</Button>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#C75D3C" }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C] mb-2">AI XULOSA</div>
                <h2 className="text-2xl font-light mb-2 text-[#1A1A1A]" style={SERIF}>Hayotiy qiymat <span className="italic text-[#C75D3C]">84M</span> (3-4x current)</h2>
                <p className="text-sm text-[#6B5B4D]">
                  Salom Magazin №1 — Champions segmentida, 21 oy davomida 168 zakaz qilgan, oxirgi vizit 02.05.
                  AI xulosasi: <span className="font-medium text-[#1A1A1A]">VIP statusi berish, premium tovar taklif qilish va loyalty programmaga kiritish</span> orqali
                  CLV ni hozirgi 28M dan 84M gacha o'stirish mumkin (3 yillik istiqbolda).
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INSIGHTS.map((ins, i) => {
              const Icon = ins.icon
              return (
                <Card key={i} className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ins.bg }}>
                      <Icon className="w-5 h-5" style={{ color: ins.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: ins.color }}>{ins.title}</div>
                      <p className="text-sm text-[#6B5B4D] mt-2">{ins.text}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: ins.color }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5" style={{ color: "#D97706" }} />
              <h2 className="text-xl font-light text-[#1A1A1A]" style={SERIF}>AI tovar tavsiyalari <span className="italic text-[#C75D3C]">— Recommender Engine</span></h2>
            </div>
            <div className="space-y-3">
              {RECOMMENDATIONS.map(r => (
                <div key={r.product} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D3] flex items-center gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: "#C75D3C" }} />
                  <div className="flex-1">
                    <div className="font-medium text-[#1A1A1A]">{r.product}</div>
                    <div className="text-xs text-[#9C8A6E] mt-0.5">{r.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#9C8A6E]">Sotuv uplift</div>
                    <div className="text-lg font-medium text-emerald-700 font-mono tabular-nums" style={SERIF}>+{r.upliftPct}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#9C8A6E]">Confidence</div>
                    <div className="text-sm font-mono font-medium tabular-nums text-[#1A1A1A]">{r.confidence}%</div>
                  </div>
                  <Button size="sm" className="gap-1 ml-2 text-white" style={{ background: "#C75D3C" }}>Tavsiya bering</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5" style={{ color: "#C75D3C" }} />
              <h2 className="text-xl font-light text-[#1A1A1A]" style={SERIF}>Next Best Actions <span className="italic text-[#C75D3C]">— NBA</span></h2>
            </div>
            <div className="space-y-2">
              {NEXT_BEST_ACTIONS.map(a => (
                <div key={a.action} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E0D3] hover:bg-[#FAF7F2]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white" style={{
                    background: a.priority === 1 ? "#C75D3C" : a.priority === 2 ? "#D97706" : "#3B82F6"
                  }}>
                    {a.priority}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-[#1A1A1A]">{a.action}</div>
                    <div className="text-xs text-[#9C8A6E] mt-0.5">ETA: {a.eta}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#9C8A6E]">Kutilgan tushum</div>
                    <div className="text-base font-mono tabular-nums font-medium text-emerald-700" style={SERIF}>+{fmt(a.expectedRevenue)}</div>
                  </div>
                  <Button size="sm" className="text-white" style={{ background: "#C75D3C" }}>Bajarish</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
