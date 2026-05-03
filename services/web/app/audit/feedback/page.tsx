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
  const npsColor = npsScore >= 50 ? { bg: "bg-emerald-50", text: "text-emerald-700", accent: "bg-emerald-500" } : npsScore >= 0 ? { bg: "bg-[#FCE9DD]", text: "text-[#D97706]", accent: "bg-[#D97706]" } : { bg: "bg-[#F5E5D6]", text: "text-[#C75D3C]", accent: "bg-[#C75D3C]" }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klient feedback <span className="italic text-[#C75D3C]">NPS</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{FEEDBACKS.length} ta javob · NPS Score: {npsScore} · O'rtacha reyting: {avgRating}/5</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 1-oy</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${npsColor.bg} flex items-center justify-center`}>
                  <TrendingUp className={`w-5 h-5 ${npsColor.text}`} />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">NPS Score</span>
              </div>
              <div className={`text-5xl font-light tabular-nums ${npsColor.text}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{npsScore}</div>
              <div className="text-xs text-[#9C8A6E] mt-2">{npsScore >= 50 ? "Mukammal" : npsScore >= 0 ? "Yaxshi" : "Yomon"}</div>
              <div className={`absolute bottom-0 left-0 right-0 h-px ${npsColor.accent}`} />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Promoters (9-10)</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{promoters}</div>
              <div className="text-xs text-[#9C8A6E] mt-2">{Math.round((promoters / FEEDBACKS.length) * 100)}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCE9DD] flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#D97706]" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Passives (7-8)</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{passives}</div>
              <div className="text-xs text-[#9C8A6E] mt-2">{Math.round((passives / FEEDBACKS.length) * 100)}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#D97706]" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5E5D6] flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-[#C75D3C]" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Detractors (0-6)</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{detractors}</div>
              <div className="text-xs text-[#9C8A6E] mt-2">{Math.round((detractors / FEEDBACKS.length) * 100)}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#C75D3C]" />
            </Card>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-xl font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>NPS taqsimot grafigi</h2>
            <div className="space-y-1.5">
              {Array.from({ length: 11 }).map((_, score) => {
                const count = FEEDBACKS.filter(f => f.nps === score).length
                const widthPct = (count / Math.max(1, FEEDBACKS.length)) * 100 * 4
                const color = score >= 9 ? "bg-emerald-500" : score >= 7 ? "bg-[#D97706]" : "bg-[#C75D3C]"
                return (
                  <div key={score} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-mono tabular-nums font-medium text-right text-[#6B5B4D]">{score}</span>
                    <div className="flex-1 h-6 bg-[#FAF7F2] rounded relative">
                      {count > 0 && (
                        <div className={`absolute inset-y-0 left-0 ${color} rounded flex items-center pr-2`} style={{ width: `${widthPct}%`, minWidth: count > 0 ? "30px" : "0" }}>
                          <span className="text-xs text-white font-medium ml-2">{count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-xl font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Kategoriyalar bo'yicha</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {byCategory.map(c => (
                <Card key={c.category} className="bg-[#FAF7F2] border border-[#E8E0D3] rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-2">{c.category}</div>
                  <div className="text-2xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{c.count}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 text-[#D97706]" />
                    <span className="text-xs font-mono tabular-nums text-[#6B5B4D]">avg NPS: {c.avgNps}</span>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <MessageCircle className="w-5 h-5 text-[#C75D3C]" /> Feedback ro'yxati
            </h2>
            <div className="space-y-3">
              {FEEDBACKS.map(f => {
                const tone = f.nps >= 9 ? { border: "border-emerald-500", bg: "bg-emerald-50/40", chip: "bg-emerald-500" }
                          : f.nps >= 7 ? { border: "border-[#D97706]", bg: "bg-[#FCE9DD]/40", chip: "bg-[#D97706]" }
                          : { border: "border-[#C75D3C]", bg: "bg-[#F5E5D6]/40", chip: "bg-[#C75D3C]" }
                return (
                  <div key={f.id} className={`p-4 rounded-xl border-l-4 ${tone.border} ${tone.bg} border-y border-r border-[#E8E0D3]`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-light text-2xl text-white ${tone.chip}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                        {f.nps}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#1A1A1A]">{f.client}</span>
                          <span className="text-xs text-[#9C8A6E]">→ {f.agent}</span>
                          <span className="text-xs text-[#9C8A6E]">· {f.date}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D]">{f.category}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < f.rating ? "text-[#D97706] fill-[#D97706]" : "text-[#E8E0D3]"}`} />
                            ))}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ml-auto ${
                            f.status === "open" ? "bg-[#F5E5D6] text-[#C75D3C]" :
                            f.status === "resolved" ? "bg-[#FCE9DD] text-[#D97706]" :
                            "bg-emerald-50 text-emerald-700"
                          }`}>
                            {f.status === "open" ? "Ochiq" : f.status === "resolved" ? "Hal bo'ldi" : "Yopildi"}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B5B4D] italic">"{f.comment}"</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
