"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, TrendingUp, Users, Package, Lightbulb, ShoppingCart, Calendar } from "lucide-react"
import Link from "next/link"

type Recommendation = {
  id: number; type: "cross_sell" | "up_sell" | "next_buy" | "reactivation";
  client: string; segment: string; recommendedProduct: string;
  reason: string; expectedRevenue: number; confidence: number;
  similarBuyers: number;
}

const RECOMMENDATIONS: Recommendation[] = [
  { id: 1, type: "cross_sell", client: "Salom Magazin №1", segment: "Champions", recommendedProduct: "Voda Premium 1L", reason: "Coca-Cola sotib oluvchilar 87%da Voda ham oladi", expectedRevenue: 320_000, confidence: 88, similarBuyers: 142 },
  { id: 2, type: "up_sell", client: "Bona Магазин", segment: "Loyal", recommendedProduct: "Choco-Boom 75g (paket 24 dona)", reason: "Yakka 12 dona o'rniga paket — 18% chegirma + qulay", expectedRevenue: 240_000, confidence: 82, similarBuyers: 96 },
  { id: 3, type: "next_buy", client: "Дастархон Сервис", segment: "Champions", recommendedProduct: "Pechenye Yubileynoye", reason: "12 hafta ketma-ket har juma sotib oladi", expectedRevenue: 84_000, confidence: 95, similarBuyers: 1 },
  { id: 4, type: "reactivation", client: "Гулямов Магазин Сирож", segment: "Hibernating", recommendedProduct: "Bonjur 50g (50% chegirma)", reason: "84 kun sotib olmadi, agressiv promo qaytarish", expectedRevenue: 120_000, confidence: 64, similarBuyers: 0 },
  { id: 5, type: "cross_sell", client: "Турсун Ake Магазин", segment: "Loyal", recommendedProduct: "Sok Apelsin 1L", reason: "Yoz fasli yaqin, ichimlik talabi keskin oshadi", expectedRevenue: 168_000, confidence: 78, similarBuyers: 84 },
  { id: 6, type: "up_sell", client: "Family Маркет", segment: "Champions", recommendedProduct: "Premium paket (5 SKU)", reason: "VIP klient, premium taklif uchun ideal", expectedRevenue: 480_000, confidence: 86, similarBuyers: 4 },
  { id: 7, type: "next_buy", client: "Ali Ake Магазин", segment: "At Risk", recommendedProduct: "Choco-Boom (oxirgi 3 zakaz)", reason: "Tez-tez sotib olgan, lekin 28 kundan beri yo'q", expectedRevenue: 144_000, confidence: 72, similarBuyers: 0 },
  { id: 8, type: "cross_sell", client: "Yusupov Магазин", segment: "Loyal", recommendedProduct: "Chay Dilmah", reason: "Pechenye sotib oluvchilar 65%da Chay ham oladi", expectedRevenue: 96_000, confidence: 76, similarBuyers: 62 },
]

const TYPE_LABEL: Record<string, string> = {
  cross_sell: "🔗 Cross-sell",
  up_sell: "📈 Up-sell",
  next_buy: "🔮 Next-buy",
  reactivation: "🎯 Reactivation",
}
const TYPE_COLOR: Record<string, string> = {
  cross_sell: "bg-blue-50 text-blue-700",
  up_sell: "bg-emerald-50 text-emerald-700",
  next_buy: "bg-purple-50 text-purple-700",
  reactivation: "bg-[#F5E5D6] text-[#C75D3C]",
}
const TYPE_ACCENT: Record<string, string> = {
  cross_sell: "#3B82F6",
  up_sell: "#10B981",
  next_buy: "#8B5CF6",
  reactivation: "#C75D3C",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function RecommendationsPage() {
  const sorted = [...RECOMMENDATIONS].sort((a, b) => b.expectedRevenue - a.expectedRevenue)
  const totalExpected = RECOMMENDATIONS.reduce((s, r) => s + r.expectedRevenue, 0)
  const avgConfidence = Math.round(RECOMMENDATIONS.reduce((s, r) => s + r.confidence, 0) / RECOMMENDATIONS.length)

  const counts = {
    cross_sell: RECOMMENDATIONS.filter(r => r.type === "cross_sell").length,
    up_sell: RECOMMENDATIONS.filter(r => r.type === "up_sell").length,
    next_buy: RECOMMENDATIONS.filter(r => r.type === "next_buy").length,
    reactivation: RECOMMENDATIONS.filter(r => r.type === "reactivation").length,
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/dashboard" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AI</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Sparkles className="w-8 h-8 text-[#8B5CF6]" />
                AI <span className="italic text-[#C75D3C]">Recommender</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{RECOMMENDATIONS.length} ta tavsiya · <span className="text-emerald-700 font-medium">{fmt(totalExpected / 1_000_000)} M</span> kutilgan tushum · o'rta {avgConfidence}% confidence</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Bugun yangilangan</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Package} accent={TYPE_ACCENT.cross_sell} label="🔗 Cross-sell" value={counts.cross_sell.toString()} />
            <KpiCard icon={TrendingUp} accent={TYPE_ACCENT.up_sell} label="📈 Up-sell" value={counts.up_sell.toString()} />
            <KpiCard icon={ShoppingCart} accent={TYPE_ACCENT.next_buy} label="🔮 Next-buy" value={counts.next_buy.toString()} />
            <KpiCard icon={Users} accent={TYPE_ACCENT.reactivation} label="🎯 Reactivation" value={counts.reactivation.toString()} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <Lightbulb className="w-5 h-5 text-[#D97706]" />
              Bugungi tavsiyalar
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Segment</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tavsiya</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sabab (data)</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tip</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kutilgan</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Confidence</th>
                    <th className="py-3 px-2 text-center w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={r.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-medium text-[#9C8A6E]">{i + 1}</td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{r.client}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          r.segment === "Champions" ? "bg-[#FCE9DD] text-[#D97706]" :
                          r.segment === "Loyal" ? "bg-emerald-50 text-emerald-700" :
                          r.segment === "At Risk" ? "bg-[#F5E5D6] text-[#C75D3C]" :
                          r.segment === "Hibernating" ? "bg-[#F0EAE0] text-[#6B5B4D]" :
                          "bg-blue-50 text-blue-700"
                        }`}>{r.segment}</span>
                      </td>
                      <td className="py-3 px-2 font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{r.recommendedProduct}</td>
                      <td className="py-3 px-2 text-xs text-[#6B5B4D] italic max-w-xs">"{r.reason}"</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLOR[r.type]}`}>{TYPE_LABEL[r.type]}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>+{fmt(r.expectedRevenue)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-medium text-xs ${r.confidence >= 80 ? "bg-emerald-50 text-emerald-700" : r.confidence >= 65 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                          {r.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button size="sm" className="h-7 text-xs" style={{ background: "#C75D3C" }}>Bajar</Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50/40">
                    <td colSpan={6} className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami kutilgan tushum:</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-700 text-base font-medium" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>+{fmt(totalExpected)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border-2 border-[#8B5CF6]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#8B5CF6] font-medium">QANDAY ISHLAYDI</div>
                <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>AI Recommender Engine</h3>
                <p className="text-sm text-[#6B5B4D] mt-2 leading-relaxed">
                  Tizim har klient uchun 4 xil tahlil yuritadi: <span className="font-medium">cross-sell</span> (qo'shni tovar),
                  <span className="font-medium"> up-sell</span> (qimmatroq variant), <span className="font-medium">next-buy</span> (keyingi xarid bashorati),
                  <span className="font-medium"> reactivation</span> (yo'qolgan klient qaytarish). Collaborative filtering + sequence prediction modeli.
                  Confidence 80%+ tavsiyalar avtomatik klientga yuboriladi.
                </p>
              </div>
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
      <div className="text-xs font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
