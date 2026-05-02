"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, ThumbsUp, ThumbsDown, MessageCircle, TrendingUp, Calendar, Download } from "lucide-react"
import Link from "next/link"

type Feedback = {
  id: number; date: string; client: string; agent: string;
  nps: number; rating: number; category: string;
  comment: string; status: "open" | "resolved" | "closed";
}

const FEEDBACKS: Feedback[] = [
  { id: 1, date: "2026-05-02", client: "Salom Magazin №1", agent: "Babadjanova N.", nps: 9, rating: 5, category: "Yetkazib berish", comment: "Vaqtda yetkazildi, agent juda chiroyli", status: "closed" },
  { id: 2, date: "2026-05-01", client: "Bona Магазин", agent: "Berdiyev R.", nps: 7, rating: 4, category: "Tovar sifati", comment: "Choco-Boom 1 ta buzilgan edi, qaytardim", status: "resolved" },
  { id: 3, date: "2026-04-30", client: "Дастархон Сервис", agent: "Sayitqulov M.", nps: 10, rating: 5, category: "Umumiy", comment: "Eng yaxshi distributor!", status: "closed" },
  { id: 4, date: "2026-04-29", client: "Гулямов Маркет", agent: "ДАВЛАТ", nps: 4, rating: 3, category: "Narx", comment: "Boshqa kompaniyada arzonroq", status: "open" },
  { id: 5, date: "2026-04-28", client: "Турсун Ake Магазин", agent: "BORIEV M.", nps: 8, rating: 5, category: "Vizit", comment: "Agent hammamizga e'tibor beradi", status: "closed" },
  { id: 6, date: "2026-04-27", client: "Ali Ake Магазин", agent: "Babadjanova N.", nps: 9, rating: 5, category: "Tovar assortimenti", comment: "Yangi tovarlar qo'shilgani yaxshi", status: "closed" },
  { id: 7, date: "2026-04-26", client: "Билтек Маркет", agent: "Берdiyev R.", nps: 3, rating: 2, category: "Yetkazib berish", comment: "2 marta kechikdi", status: "open" },
  { id: 8, date: "2026-04-25", client: "Юсупов Магазин", agent: "Sayitqulov M.", nps: 8, rating: 4, category: "Umumiy", comment: "Hammasi yaxshi", status: "closed" },
]

const promoters = FEEDBACKS.filter(f => f.nps >= 9).length
const detractors = FEEDBACKS.filter(f => f.nps <= 6).length
const passives = FEEDBACKS.filter(f => f.nps >= 7 && f.nps <= 8).length
const npsScore = Math.round(((promoters - detractors) / FEEDBACKS.length) * 100)

const avgRating = (FEEDBACKS.reduce((s, f) => s + f.rating, 0) / FEEDBACKS.length).toFixed(1)

const byCategory = Array.from(new Set(FEEDBACKS.map(f => f.category))).map(cat => ({
  category: cat,
  count: FEEDBACKS.filter(f => f.category === cat).length,
  avgNps: Math.round(FEEDBACKS.filter(f => f.category === cat).reduce((s, f) => s + f.nps, 0) / FEEDBACKS.filter(f => f.category === cat).length * 10) / 10,
}))

export default function FeedbackPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Klient feedback (NPS)</h1>
            <p className="text-sm text-slate-500">{FEEDBACKS.length} ta javob · NPS Score: {npsScore} · O'rtacha reyting: {avgRating}/5</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 1-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className={`p-5 border-2 ${npsScore >= 50 ? "bg-emerald-50 border-emerald-300" : npsScore >= 0 ? "bg-amber-50 border-amber-300" : "bg-rose-50 border-rose-300"}`}>
            <TrendingUp className="w-6 h-6 mb-2" />
            <div className="text-xs font-bold mb-1">NPS Score</div>
            <div className={`text-4xl font-bold font-mono ${npsScore >= 50 ? "text-emerald-700" : npsScore >= 0 ? "text-amber-700" : "text-rose-700"}`}>{npsScore}</div>
            <div className="text-xs text-slate-500 mt-1">{npsScore >= 50 ? "Mukammal" : npsScore >= 0 ? "Yaxshi" : "Yomon"}</div>
          </Card>
          <Card className="p-5 bg-emerald-50 border-emerald-200">
            <ThumbsUp className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Promoters (9-10)</div>
            <div className="text-2xl font-bold mt-1">{promoters}</div>
            <div className="text-xs text-slate-500 mt-1">{Math.round((promoters / FEEDBACKS.length) * 100)}%</div>
          </Card>
          <Card className="p-5 bg-amber-50 border-amber-200">
            <Star className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Passives (7-8)</div>
            <div className="text-2xl font-bold mt-1">{passives}</div>
            <div className="text-xs text-slate-500 mt-1">{Math.round((passives / FEEDBACKS.length) * 100)}%</div>
          </Card>
          <Card className="p-5 bg-rose-50 border-rose-200">
            <ThumbsDown className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Detractors (0-6)</div>
            <div className="text-2xl font-bold mt-1">{detractors}</div>
            <div className="text-xs text-slate-500 mt-1">{Math.round((detractors / FEEDBACKS.length) * 100)}%</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">NPS taqsimot grafigi</h2>
          <div className="space-y-1">
            {Array.from({ length: 11 }).map((_, score) => {
              const count = FEEDBACKS.filter(f => f.nps === score).length
              const widthPct = (count / Math.max(1, FEEDBACKS.length)) * 100 * 4
              const color = score >= 9 ? "bg-emerald-500" : score >= 7 ? "bg-amber-500" : "bg-rose-500"
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-mono font-bold text-right">{score}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded relative">
                    {count > 0 && (
                      <div className={`absolute inset-y-0 left-0 ${color} rounded flex items-center pr-2`} style={{ width: `${widthPct}%`, minWidth: count > 0 ? "30px" : "0" }}>
                        <span className="text-xs text-white font-bold ml-2">{count}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Kategoriyalar bo'yicha</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {byCategory.map(c => (
              <Card key={c.category} className="p-3">
                <div className="text-xs font-bold text-slate-600 mb-1">{c.category}</div>
                <div className="text-2xl font-bold font-mono">{c.count}</div>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-mono">avg NPS: {c.avgNps}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-600" /> Feedback ro'yxati</h2>
          <div className="space-y-3">
            {FEEDBACKS.map(f => (
              <div key={f.id} className={`p-4 rounded-lg border-l-4 ${f.nps >= 9 ? "border-emerald-500 bg-emerald-50/30" : f.nps >= 7 ? "border-amber-500 bg-amber-50/30" : "border-rose-500 bg-rose-50/30"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-2xl text-white ${f.nps >= 9 ? "bg-emerald-500" : f.nps >= 7 ? "bg-amber-500" : "bg-rose-500"}`}>
                    {f.nps}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{f.client}</span>
                      <span className="text-xs text-slate-500">→ {f.agent}</span>
                      <span className="text-xs text-slate-400">· {f.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{f.category}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < f.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                        ))}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ml-auto ${
                        f.status === "open" ? "bg-rose-100 text-rose-700" :
                        f.status === "resolved" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {f.status === "open" ? "🔴 Ochiq" : f.status === "resolved" ? "🟡 Hal bo'ldi" : "🟢 Yopildi"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{f.comment}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
