"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Search, Book, Video, MessageSquare, Phone, Mail, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const FAQ = [
  { q: "Qanday qilib yangi tovar qo'shish mumkin?", a: "Tovarlar bo'limiga kiring va 'Yangi tovar' tugmasini bosing. Yoki Excel orqali ko'plab tovarlarni import qilishingiz mumkin.", category: "tovarlar" },
  { q: "Telegram bot bilan qanday bog'lash mumkin?", a: "Sozlamalar > Integratsiyalar bo'limiga kiring va Telegram botni faollashtiring. Bot tokeningizni kiritishingiz kerak.", category: "bot" },
  { q: "Faktura va nakladnoy qanday chiqaramiz?", a: "Buyurtmalar yoki Sotuvlar bo'limidan tegishli buyurtmani tanlang va 'Faktura yaratish' yoki 'Nakladnoy chop etish' tugmasini bosing.", category: "hujjatlar" },
  { q: "Mijozga qarz qanday qo'shamiz?", a: "Mijoz profiliga kiring va 'Qarz qo'shish' tugmasini bosing. Yoki sotuv jarayonida 'Qarzga' to'lov usulini tanlang.", category: "qarzlar" },
  { q: "Qanday qilib hisobot olish mumkin?", a: "Hisobotlar bo'limiga kiring. Kunlik, haftalik, oylik hisobotlarni ko'rishingiz va Excel/PDF formatda yuklab olishingiz mumkin.", category: "hisobotlar" },
  { q: "Bonus tizimini qanday sozlash kerak?", a: "Bonuslar bo'limiga kiring va 11 xil bonus turidan birini tanlang. Sana, miqdor va shartlarni belgilang.", category: "bonus" },
]

export default function HelpPage() {
  const [search, setSearch] = useState("")
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const filtered = FAQ.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-emerald-600" />
            Yordam markazi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tez-tez so'raladigan savollar va yordam</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Savolingizni kiriting..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 text-base" />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Book,  label: "Qo'llanma", color: "blue" },
            { icon: Video, label: "Video darslar", color: "red" },
            { icon: MessageSquare, label: "Chat", color: "emerald" },
            { icon: Phone, label: "Qo'ng'iroq", color: "purple" },
          ].map((l, i) => (
            <button key={i} className="bg-card rounded-xl border p-4 hover:shadow-md transition text-center">
              <l.icon className={`w-8 h-8 mx-auto text-${l.color}-600 mb-2`} />
              <div className="font-medium text-sm">{l.label}</div>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold mb-3">Tez-tez so'raladigan savollar</h2>
          <div className="space-y-2">
            {filtered.map((f, i) => (
              <div key={i} className="bg-card rounded-xl border overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 dark:hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{f.category}</Badge>
                    <span className="font-medium">{f.q}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${openIdx === i ? "rotate-90" : ""}`} />
                </button>
                {openIdx === i && (
                  <div className="p-4 border-t bg-muted/50 dark:bg-muted text-sm">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-6">
          <h3 className="font-bold mb-3">Boshqa savol bormi?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>+998 77 003 00 80</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>support@savdoai.uz</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>@savdoai_support</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
