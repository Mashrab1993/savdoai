"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, MessageSquare, Mail, Smartphone, AlertCircle, Save } from "lucide-react"
import Link from "next/link"

type NotifSetting = {
  id: string; label: string; description: string;
  telegram: boolean; sms: boolean; email: boolean; push: boolean;
}

const INITIAL: NotifSetting[] = [
  { id: "new_order", label: "Yangi zakaz", description: "Agent yangi zakaz qabul qilganda", telegram: true, sms: false, email: false, push: true },
  { id: "order_cancelled", label: "Bekor qilingan zakaz", description: "Klient yoki agent zakazni bekor qilganda", telegram: true, sms: true, email: false, push: true },
  { id: "low_stock", label: "Past zaxira", description: "SKU zaxirasi reorder point ostida tushganda", telegram: true, sms: false, email: true, push: true },
  { id: "client_overdue", label: "Klient qarz muddati o'tdi", description: "Klient qarzi 30 kundan oshganda", telegram: true, sms: true, email: true, push: true },
  { id: "agent_missed", label: "Agent vizit qoldirdi", description: "Agent rejali vizitga bormaganda", telegram: true, sms: false, email: false, push: false },
  { id: "promo_ending", label: "Promo tugayapti", description: "Aktiv promo 3 kunga qolganda", telegram: false, sms: false, email: true, push: false },
  { id: "daily_summary", label: "Kunlik hisobot", description: "Har kuni soat 19:00 da kunlik xulosa", telegram: true, sms: false, email: true, push: false },
  { id: "weekly_summary", label: "Haftalik hisobot", description: "Har juma soat 18:00 da haftalik analiz", telegram: false, sms: false, email: true, push: false },
  { id: "anomaly", label: "Anomaliya aniqlandi", description: "AI Anomaliya Detektori har qanday g'ayritabiiy harakat aniqlaganda", telegram: true, sms: true, email: true, push: true },
  { id: "competitor_change", label: "Raqobat narxi o'zgardi", description: "Raqobatchining narxi 5%+ o'zgarganda", telegram: false, sms: false, email: true, push: false },
]

export default function NotificationsPage() {
  const [settings, setSettings] = useState(INITIAL)
  const [contactInfo, setContactInfo] = useState({
    telegram: "@mashrab_savdo",
    phone: "+998 90 123 45 67",
    email: "sayitkulovmashrab@gmail.com",
  })

  const toggle = (id: string, channel: keyof Omit<NotifSetting, "id" | "label" | "description">) => {
    setSettings(settings.map(s => s.id === id ? { ...s, [channel]: !s[channel] } : s))
  }

  const totalEnabled = settings.filter(s => s.telegram || s.sms || s.email || s.push).length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Bildirishnoma sozlamalari</h1>
            <p className="text-sm text-slate-500">{totalEnabled} ta hodisa faol · 4 kanal (Telegram/SMS/Email/Push)</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" /> Aloqa kanallari
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Telegram</span>
              </div>
              <input value={contactInfo.telegram} onChange={e => setContactInfo({ ...contactInfo, telegram: e.target.value })} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold">SMS / Telefon</span>
              </div>
              <input value={contactInfo.phone} onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-violet-600" />
                <span className="font-semibold">Email</span>
              </div>
              <input value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" /> Hodisalar bo'yicha xabarnoma matritsasi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Hodisa</th>
                  <th className="py-3 px-2 text-center w-24">📱 Telegram</th>
                  <th className="py-3 px-2 text-center w-24">📨 SMS</th>
                  <th className="py-3 px-2 text-center w-24">📧 Email</th>
                  <th className="py-3 px-2 text-center w-24">🔔 Push</th>
                </tr>
              </thead>
              <tbody>
                {settings.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.description}</div>
                    </td>
                    {(["telegram", "sms", "email", "push"] as const).map(ch => (
                      <td key={ch} className="py-3 px-2 text-center">
                        <button
                          onClick={() => toggle(s.id, ch)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${s[ch] ? "bg-emerald-500" : "bg-slate-300"}`}
                          aria-label={`${s.label} ${ch}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${s[ch] ? "translate-x-6" : ""}`} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <h3 className="font-bold text-emerald-800 mb-2">💡 Tavsiya</h3>
          <p className="text-sm text-slate-700">
            Anomaliya, qarz muddati va past zaxira — bu uch hodisa har 4 kanalda faol bo'lishi tavsiya etiladi.
            Daily/Weekly summary'larni Email + Telegram'da yetarli (SMS shart emas).
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}
