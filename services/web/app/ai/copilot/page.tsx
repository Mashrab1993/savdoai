"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Sparkles, Send, MessageSquare, TrendingUp, Lightbulb, Zap, BookOpen } from "lucide-react"
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

const SUGGESTION_COLOR: Record<string, string> = {
  warning: "bg-rose-50 border-rose-300 text-rose-800",
  opportunity: "bg-emerald-50 border-emerald-300 text-emerald-800",
  tip: "bg-blue-50 border-blue-300 text-blue-800",
}
const SUGGESTION_ICON: Record<string, any> = {
  warning: Zap, opportunity: TrendingUp, tip: Lightbulb,
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-violet-600" />
              AI Sotuv Copilot
            </h1>
            <p className="text-sm text-slate-500">Dunyoda yagona AI — sotuv to'liq tahlil va real-time tavsiyalar</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Online
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Bugungi tavsiyalar ({SUGGESTIONS.length})
              </h2>
              <div className="space-y-3">
                {SUGGESTIONS.map(s => {
                  const Icon = SUGGESTION_ICON[s.type]
                  return (
                    <div key={s.id} className={`p-4 rounded-lg border-l-4 ${SUGGESTION_COLOR[s.type]}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-bold text-sm mb-1">{s.title}</div>
                          <p className="text-sm">{s.description}</p>
                          {s.action && (
                            <Button size="sm" className="mt-2 h-7 text-xs">
                              {s.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <Card className="p-5 flex flex-col" style={{ minHeight: "600px" }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              AI bilan suhbat
            </h2>
            <div className="flex-1 space-y-3 overflow-y-auto mb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.role === "user" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-800"
                  }`}>
                    {msg.role === "ai" && <Sparkles className="w-3 h-3 inline mr-1 text-violet-600" />}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Savol yozing..." onKeyDown={e => e.key === "Enter" && send()} className="flex-1" />
                <Button onClick={send} className="px-4"><Send className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  "Bu hafta eng yaxshi mahsulot?",
                  "Klient Salom №1 holati?",
                  "Promo tavsiya bering",
                  "Anomaliya bormi?",
                ].map(q => (
                  <button key={q} onClick={() => setInput(q)} className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-300">
          <div className="flex items-start gap-3">
            <BookOpen className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-violet-800">AI Copilot bu nima?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Sizning savdo dataingizdan o'qib, real-time tavsiyalar beradigan AI yordamchi. SalesDoc va boshqa raqobatchilar bunday funksiyasi yo'q —
                bu SavdoAI'ning <span className="font-bold">dunyoda yagona</span> ficha. Anomaliya, Imkoniyat, Maslahat — har 3 turdagi tavsiyalar real ma'lumotlardan generatsiya qilinadi.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
