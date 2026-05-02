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
  cross_sell: "🔗 Cross-sell (qo'shni tovar)",
  up_sell: "📈 Up-sell (qimmatroq variant)",
  next_buy: "🔮 Next-buy (keyingi xarid)",
  reactivation: "🎯 Reactivation (qaytarish)",
}
const TYPE_COLOR: Record<string, string> = {
  cross_sell: "bg-blue-100 text-blue-700",
  up_sell: "bg-emerald-100 text-emerald-700",
  next_buy: "bg-violet-100 text-violet-700",
  reactivation: "bg-rose-100 text-rose-700",
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/ai" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-violet-600" />
              AI Tovar tavsiyalar (Recommender Engine)
            </h1>
            <p className="text-sm text-slate-500">{RECOMMENDATIONS.length} ta tavsiya · {fmt(totalExpected / 1_000_000)} M kutilgan tushum · o'rtacha {avgConfidence}% confidence</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Bugun yangilangan</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Package className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">🔗 Cross-sell</div>
            <div className="text-2xl font-bold mt-1">{counts.cross_sell}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">📈 Up-sell</div>
            <div className="text-2xl font-bold mt-1">{counts.up_sell}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <ShoppingCart className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">🔮 Next-buy</div>
            <div className="text-2xl font-bold mt-1">{counts.next_buy}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <Users className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">🎯 Reactivation</div>
            <div className="text-2xl font-bold mt-1">{counts.reactivation}</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Bugungi tavsiyalar (kutilgan tushum bo'yicha)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Klient</th>
                  <th className="py-3 px-2 text-center">Segment</th>
                  <th className="py-3 px-2">Tavsiya</th>
                  <th className="py-3 px-2">Sabab (data)</th>
                  <th className="py-3 px-2 text-center">Tip</th>
                  <th className="py-3 px-2 text-right">Kutilgan</th>
                  <th className="py-3 px-2 text-center">Confidence</th>
                  <th className="py-3 px-2 text-center w-24">Amal</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 px-2 font-semibold">{r.client}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.segment === "Champions" ? "bg-amber-100 text-amber-700" :
                        r.segment === "Loyal" ? "bg-emerald-100 text-emerald-700" :
                        r.segment === "At Risk" ? "bg-rose-100 text-rose-700" :
                        r.segment === "Hibernating" ? "bg-slate-100 text-slate-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{r.segment}</span>
                    </td>
                    <td className="py-3 px-2 font-semibold text-emerald-700">{r.recommendedProduct}</td>
                    <td className="py-3 px-2 text-xs text-slate-600 italic max-w-xs">"{r.reason}"</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[r.type]}`}>{TYPE_LABEL[r.type]}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">+{fmt(r.expectedRevenue)}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${r.confidence >= 80 ? "bg-emerald-100 text-emerald-700" : r.confidence >= 65 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {r.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button size="sm" className="h-7 text-xs">Bajar</Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 font-bold">
                  <td colSpan={6} className="py-3 px-2 text-right">Jami kutilgan tushum:</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-700 text-base">+{fmt(totalExpected)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-300">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-violet-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-violet-800">AI Recommender Engine qanday ishlaydi?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Tizim har klient uchun 4 xil tahlil yuritadi: <span className="font-bold">cross-sell</span> (qo'shni tovar),
                <span className="font-bold"> up-sell</span> (qimmatroq variant), <span className="font-bold">next-buy</span> (keyingi xarid bashorati),
                <span className="font-bold"> reactivation</span> (yo'qolgan klient qaytarish). Collaborative filtering + sequence prediction modeli.
                Confidence 80%+ tavsiyalar avtomatik klientga yuboriladi.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
