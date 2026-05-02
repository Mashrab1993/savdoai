"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, MessageSquare, Mail, Video, FileText, Plus, Calendar, Clock } from "lucide-react"
import Link from "next/link"

type Communication = {
  id: number; type: "call" | "sms" | "email" | "telegram" | "meeting" | "note";
  direction: "in" | "out" | "neutral";
  date: string; user: string; subject: string; summary: string;
  duration?: number; outcome?: "positive" | "neutral" | "negative";
}

const COMMUNICATIONS: Communication[] = [
  { id: 1, type: "call", direction: "out", date: "2026-05-02 10:25", user: "Babadjanova N.", subject: "Yangi promo eshittirish", summary: "Choco-Boom −20% promo haqida xabardor qildim, klient qiziqish bildirdi", duration: 8, outcome: "positive" },
  { id: 2, type: "telegram", direction: "in", date: "2026-05-01 16:45", user: "Klient", subject: "Sok narxi", summary: "Sok Apelsin 1L narxi qancha?", outcome: "neutral" },
  { id: 3, type: "telegram", direction: "out", date: "2026-05-01 16:50", user: "Babadjanova N.", subject: "Sok narxi javobi", summary: "14 000 so'm. Bayonatim yubordim.", outcome: "neutral" },
  { id: 4, type: "meeting", direction: "neutral", date: "2026-04-30 11:00", user: "Babadjanova N.", subject: "Vizit + zakaz", summary: "12 SKU 1.84M so'm zakaz qildi, premium tovar bilan tanishtirdim", duration: 22, outcome: "positive" },
  { id: 5, type: "email", direction: "out", date: "2026-04-28 09:15", user: "System", subject: "Oylik hisobot", summary: "Aprel oylik hisobot avtomatik yuborildi (PDF)", outcome: "neutral" },
  { id: 6, type: "call", direction: "in", date: "2026-04-26 14:30", user: "Klient", subject: "Mahsulot qaytarish", summary: "1 ta Choco-Boom buzilgan, qaytarib bermoqchi", duration: 4, outcome: "negative" },
  { id: 7, type: "call", direction: "out", date: "2026-04-26 15:00", user: "Babadjanova N.", subject: "Qaytarish", summary: "Qaytarish hal qilindi, refund qilindi", duration: 6, outcome: "positive" },
  { id: 8, type: "note", direction: "neutral", date: "2026-04-25 10:00", user: "Babadjanova N.", subject: "Eslatma", summary: "Klient mart oxirida o'g'lining to'yi bo'ladi — katta zakaz kuting", outcome: "neutral" },
  { id: 9, type: "sms", direction: "out", date: "2026-04-22 18:00", user: "System", subject: "Eslatma", summary: "Ertaga vizit kuni — 11:00 da kelaman", outcome: "neutral" },
  { id: 10, type: "meeting", direction: "neutral", date: "2026-04-20 11:15", user: "Babadjanova N.", subject: "Vizit", summary: "14 SKU 1.64M zakaz, foto-hisobot olindi", duration: 16, outcome: "positive" },
]

const TYPE_ICON: Record<string, any> = {
  call: Phone, sms: MessageSquare, email: Mail, telegram: MessageSquare, meeting: Video, note: FileText,
}
const TYPE_COLOR: Record<string, string> = {
  call: "bg-blue-100 text-blue-700",
  sms: "bg-emerald-100 text-emerald-700",
  email: "bg-violet-100 text-violet-700",
  telegram: "bg-sky-100 text-sky-700",
  meeting: "bg-amber-100 text-amber-700",
  note: "bg-slate-100 text-slate-700",
}
const TYPE_LABEL: Record<string, string> = {
  call: "📞 Qo'ng'iroq", sms: "💬 SMS", email: "📧 Email",
  telegram: "📨 Telegram", meeting: "👥 Vizit", note: "📝 Izoh",
}
const OUTCOME_COLOR: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-slate-100 text-slate-700",
  negative: "bg-rose-100 text-rose-700",
}
const OUTCOME_LABEL: Record<string, string> = {
  positive: "✅ Ijobiy", neutral: "➖ Neytral", negative: "❌ Salbiy",
}

export default function CommunicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [filter, setFilter] = useState<string>("all")

  const filtered = filter === "all" ? COMMUNICATIONS : COMMUNICATIONS.filter(c => c.type === filter)

  const byType = Object.keys(TYPE_LABEL).map(t => ({
    type: t,
    count: COMMUNICATIONS.filter(c => c.type === t).length,
  }))

  const totalDuration = COMMUNICATIONS.filter(c => c.duration).reduce((s, c) => s + (c.duration ?? 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Aloqa tarixi · #{id}</h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · {COMMUNICATIONS.length} ta voqea · {totalDuration} daq aloqa</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi yozuv</Button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <button onClick={() => setFilter("all")} className={`p-3 rounded-lg border-2 transition-all ${filter === "all" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="text-xs font-bold text-slate-700">Hammasi</div>
            <div className="text-2xl font-bold mt-1">{COMMUNICATIONS.length}</div>
          </button>
          {byType.map(t => (
            <button key={t.type} onClick={() => setFilter(t.type)} className={`p-3 rounded-lg border-2 transition-all ${filter === t.type ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="text-xs font-bold text-slate-700">{TYPE_LABEL[t.type]}</div>
              <div className="text-2xl font-bold mt-1">{t.count}</div>
            </button>
          ))}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Voqealar timeline</h2>
          <div className="space-y-3">
            {filtered.map(c => {
              const Icon = TYPE_ICON[c.type]
              return (
                <div key={c.id} className="flex gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[c.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[c.type]} font-semibold`}>{TYPE_LABEL[c.type]}</span>
                      {c.direction === "in" && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">↓ Kirish</span>}
                      {c.direction === "out" && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">↑ Chiqish</span>}
                      {c.outcome && <span className={`text-xs px-2 py-0.5 rounded ${OUTCOME_COLOR[c.outcome]}`}>{OUTCOME_LABEL[c.outcome]}</span>}
                      {c.duration && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration} daq</span>}
                      <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto"><Calendar className="w-3 h-3" /> {c.date}</span>
                    </div>
                    <div className="font-semibold text-sm">{c.subject}</div>
                    <p className="text-sm text-slate-700 mt-1">{c.summary}</p>
                    <div className="text-xs text-slate-500 mt-1">— {c.user}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
