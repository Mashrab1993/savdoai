"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Sparkles, Send, MessageSquare, Lightbulb, BookOpen } from "lucide-react"
import Link from "next/link"

type Suggestion = {
  id: number; type: "warning" | "opportunity" | "tip"; title: string; description: string; action?: string;
}

const SUGGESTIONS: Suggestion[] = [
  { id: 1, type: "opportunity", title: "Salom Magazin №1 — premium taklif", description: "Champions klient, oxirgi 12 oyda 28.4M tushum. Coca-Cola bilan birgalikda Voda Premium ham taklif qiling — paket sotuv 25% ko'paytirish mumkin.", action: "Taklif tayyorlash" },
  { id: 2, type: "warning", title: "Choco-Boom zaxirasi tugayapti", description: "Hozirgi tezlikda 7.7 kun ichida tugaydi. Buyurtma berish vaqti yetdi — tavsiya: 480 dona.", action: "Buyurtma berish" },
  { id: 3, type: "tip", title: "BORIEV M. ish vaqtida 14:00-16:00 peak", description: "Tarix tahlili shuni ko'rsatadi: BORIEV M. soat 14:00-16:00 oralig'ida eng samarali sotadi. Ushbu vaqtga muhim klientlar qo'yilsin.", action: "Marshrutni optimallashtirish" },
  { id: 4, type: "opportunity", title: "Yangi klient FRESH Маркет — referral", description: "FRESH Маркет Anvar (mavjud klient) tomonidan referral qilingan. 1-zakaz uchun 15% chegirma berish — konversiya 78% gacha ko'tariladi.", action: "Promo yaratish" },
  { id: 5, type: "warning", title: "Bonjur 50g — muddat 2 kunda tugaydi", description: "48 dona Bonjur 50g batch B-2026-04-A 04.05 da muddati tugaydi. Shoshilinch promo (−40%) tavsiya etiladi.", action: "Auto-promo: −40%" },
]

const TYPE_DOT: Record<string, string> = {
  warning: "#C75D3C",
  opportunity: "#10B981",
  tip: "#3B82F6",
}

export default function CopilotPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Salom Mashrab! Men sizning AI Copilot'ingiz. Bugun savdo kuningizda nima qiziqarli? Klientlar, zakazlar, raqobat — istaganingizni so'rang." },
  ])
  const [input, setInput] = useState("")

  const send = () => {
    if (!input.trim()) return
    setMessages([
      ...messages,
      { role: "user", text: input },
      { role: "ai", text: "📊 Tahlil qilyapman... Sizning savolingizga real ma'lumotlar asosida javob beraman. (Demo rejimida)" },
    ])
    setInput("")
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1500px] mx-auto space-y-6">
          {/* Hero header */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/dashboard" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> DASHBOARD
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                AI <span className="italic text-[#C75D3C]">Sotuv Copilot</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Sizning savdo dataingizdan o'qib, real-time tavsiyalar beradigan AI yordamchi.
                <span className="text-[#C75D3C] font-medium"> Dunyoda yagona ficha.</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#1A1A1A] font-medium text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
              Online
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)" }}>
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium">BUGUNGI INSIGHTLAR</div>
                    <h2 className="text-xl font-medium text-[#1A1A1A] mt-0.5" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {SUGGESTIONS.length} ta muhim tavsiya
                    </h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {SUGGESTIONS.map(s => {
                    const dot = TYPE_DOT[s.type]
                    return (
                      <div key={s.id} className="p-4 rounded-xl bg-[#FAF7F2] border-l-2" style={{ borderLeftColor: dot }}>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: dot }} />
                          <div className="flex-1">
                            <div className="font-medium text-[#1A1A1A] text-sm mb-1">{s.title}</div>
                            <p className="text-sm text-[#6B5B4D] leading-relaxed">{s.description}</p>
                            {s.action && (
                              <button className="mt-2 text-xs px-3 py-1.5 rounded-md bg-white border border-[#E8E0D3] text-[#1A1A1A] hover:border-[#C75D3C] hover:text-[#C75D3C] transition-colors font-medium">
                                {s.action}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl flex flex-col" style={{ minHeight: "600px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#C75D3C" }}>
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[#9C8A6E] font-medium">CHAT</div>
                  <h3 className="text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    AI bilan suhbat
                  </h3>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-[#C75D3C] text-white rounded-br-md"
                        : "bg-[#FAF7F2] text-[#1A1A1A] rounded-bl-md border border-[#E8E0D3]"
                    }`}>
                      {msg.role === "ai" && <Sparkles className="w-3 h-3 inline mr-1 text-[#C75D3C]" />}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-[#E8E0D3] pt-3">
                <div className="flex gap-2">
                  <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Savol yozing..." onKeyDown={e => e.key === "Enter" && send()} className="flex-1 border-[#E8E0D3] bg-[#FAF7F2] text-[#1A1A1A]" />
                  <Button onClick={send} className="px-4" style={{ background: "#C75D3C" }}><Send className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Bu hafta eng yaxshi mahsulot?",
                    "Klient holati?",
                    "Promo tavsiya",
                    "Anomaliya?",
                  ].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="text-xs px-2 py-1 bg-[#FAF7F2] border border-[#E8E0D3] rounded text-[#6B5B4D] hover:border-[#C75D3C] hover:text-[#C75D3C] transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #C75D3C 0%, #E27B5C 100%)" }}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">QANDAY ISHLAYDI</div>
                <h3 className="text-xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  AI Copilot bu nima?
                </h3>
                <p className="text-sm text-[#6B5B4D] mt-2 max-w-3xl leading-relaxed">
                  Sizning savdo dataingizdan o'qib, real-time tavsiyalar beradigan AI yordamchi. SalesDoc va boshqa raqobatchilarda bunday funksiya yo'q —
                  bu SavdoAI'ning <span className="font-medium text-[#C75D3C]">dunyoda yagona</span> fichasi.
                  Anomaliya, Imkoniyat, Maslahat — har 3 turdagi tavsiyalar real ma'lumotlardan generatsiya qilinadi.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
