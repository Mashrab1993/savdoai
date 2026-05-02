"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, HelpCircle, MessageSquare, Phone, Book, Send, Search, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"

const FAQ = [
  {
    q: "Yangi tovar qanday qo'shaman?", a: "Sozlamalar → Tovar bo'limiga o'ting va 'Добавить' tugmasini bosing. Kategoriya va brendni avval yarating, keyin tovarni qo'shing.",
    category: "Tovarlar",
  },
  {
    q: "Ovozli zakaz qanday yarataman?",
    a: "Telegram bot orqali /zakaz buyrug'ini bosing va ovozli xabar yuboring. AI klient nomini va tovarlarni avtomatik tanib oladi.",
    category: "Sotuv",
  },
  {
    q: "AI Anomaliya nima beradi?",
    a: "AI Anomaliya Detektori har 5 daqiqada ma'lumotingizni tahlil qilib, g'ayritabiiy holatlarni topadi (klient yo'qolib bormoqda, tovar tugayapti va h.k.).",
    category: "AI",
  },
  {
    q: "Excel'dan tovar import qila olamanmi?",
    a: "Ha. Sozlamalar → Tovar → Добавить → 'Импорт товара из Excel'. Avval shablon yuklab oling.",
    category: "Tovarlar",
  },
  {
    q: "Klient qarz muddati o'tganda nima bo'ladi?",
    a: "Tizim avtomatik 30, 60, 90 kun chegaralarida sizga va klientga eslatma yuboradi (Telegram + SMS).",
    category: "Klient",
  },
  {
    q: "Ko'p valyutada ishlayman, qanday qilaman?",
    a: "Sozlamalar → Valyutalar dan kerakli valyuta yoqing. Sotuv yaratishda har bir tovarda valyuta tanlash mumkin.",
    category: "Moliya",
  },
  {
    q: "Mobil ilova bormi?",
    a: "Ha! Telegram bot @savdo_avtomatlashtirish_bot orqali ishlaysiz. iOS/Android maxsus ilova ham mavjud.",
    category: "Umumiy",
  },
  {
    q: "Tariflar qanday?",
    a: "Boshlang'ich (bepul, 1 agent), Biznes (990k/oy, 10 agent), Pro (2.49M/oy, cheksiz). Sozlamalar → Billing dan tafsilot.",
    category: "Umumiy",
  },
]

const CATEGORIES = ["Hammasi", "Umumiy", "Tovarlar", "Klient", "Sotuv", "Moliya", "AI"]

export default function SupportPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Hammasi")
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const [messageText, setMessageText] = useState("")

  const filtered = FAQ
    .filter(f => category === "Hammasi" || f.category === category)
    .filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))

  const toggle = (i: number) => {
    const next = new Set(expanded)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setExpanded(next)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <HelpCircle className="w-7 h-7 text-blue-600" />
              Yordam markazi (Support)
            </h1>
            <p className="text-sm text-slate-500">{FAQ.length} ta savol-javob · 24/7 chat va telefon yordami</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-emerald-50 border-emerald-200 hover:shadow-md cursor-pointer">
            <MessageSquare className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-base mb-1">Chat</h3>
            <p className="text-sm text-slate-600 mb-3">Telegram orqali real-time chat (24/7)</p>
            <Button size="sm" variant="outline" className="gap-2 w-full">@savdoai_support</Button>
          </Card>

          <Card className="p-5 bg-blue-50 border-blue-200 hover:shadow-md cursor-pointer">
            <Phone className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-bold text-base mb-1">Telefon</h3>
            <p className="text-sm text-slate-600 mb-3">Ish vaqti: 9:00 - 18:00 (Du-Ju)</p>
            <Button size="sm" variant="outline" className="gap-2 w-full font-mono">+998 71 200 00 00</Button>
          </Card>

          <Card className="p-5 bg-violet-50 border-violet-200 hover:shadow-md cursor-pointer">
            <Book className="w-8 h-8 text-violet-600 mb-3" />
            <h3 className="font-bold text-base mb-1">Hujjatlar</h3>
            <p className="text-sm text-slate-600 mb-3">To'liq foydalanuvchi qo'llanmasi</p>
            <Button size="sm" variant="outline" className="gap-2 w-full">docs.savdoai.com</Button>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Tez-tez beriladigan savollar (FAQ)</h2>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Savol qidiring..." className="pl-9" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-2 rounded-md text-xs font-semibold ${category === c ? "bg-blue-600 text-white" : "bg-white border border-slate-300"}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((f, i) => (
              <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => toggle(i)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-bold flex-1">{f.q}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{f.category}</span>
                  {expanded.has(i) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                {expanded.has(i) && (
                  <div className="p-4 bg-emerald-50/30 border-t border-slate-200">
                    <p className="text-sm text-slate-700">💡 {f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-600" /> Bizga xabar yozing</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Mavzu</label>
              <Input placeholder="Qisqa mavzu (masalan: 'Tovar qo'shilmayapti')" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Xabar</label>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={4}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="Muammoni batafsil yozing. Sahifa, brauzer, xato matni..."
              />
            </div>
            <Button className="gap-2"><Send className="w-4 h-4" /> Yuborish</Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">⏱️ O'rtacha javob vaqti: 15 daqiqa (ish vaqtida) yoki 4 soat (kechqurun/dam olish)</p>
        </Card>
      </div>
    </AdminLayout>
  )
}
