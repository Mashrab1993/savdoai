"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Newspaper, Volume2, Share2, Bell, Sparkles, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

const BRIEFING_DATE = "2 may 2026, juma · 09:00 brifingi"

const SECTIONS = [
  {
    title: "🌅 Bugungi 3 ustuvorlik",
    color: "bg-emerald-50 border-emerald-300",
    items: [
      { priority: "🔴 1", text: "Bonjur 50g muddati 2 kun ichida tugaydi (216k riskda) — auto-promo −40% ishga tushirish kerak", action: "Promo yarat" },
      { priority: "🟠 2", text: "Salom Magazin №1 bilan premium taklif (Coca + Voda paket) — 25% sotuv ko'paytirish imkoniyati", action: "Taklif tayyorla" },
      { priority: "🟡 3", text: "Турсунов Ж. KPI past (4.5/5) — bugun mentor bilan suhbat rejalashtirilgan", action: "Suhbat" },
    ]
  },
  {
    title: "📊 Kechagi natijalar (1 may)",
    color: "bg-blue-50 border-blue-300",
    items: [
      { priority: "💰", text: "Kunlik tushum: 12.4M so'm (target 12M, +3.3%)", action: null },
      { priority: "📦", text: "38 ta zakaz qabul qilindi (rejada 42 ta — 90.5%)", action: null },
      { priority: "🆕", text: "4 ta yangi klient ro'yxatga olindi", action: null },
      { priority: "✅", text: "BORIEV M. — kunlik chempion (3.84M tushum)", action: null },
    ]
  },
  {
    title: "🎯 Bu hafta progress",
    color: "bg-violet-50 border-violet-300",
    items: [
      { priority: "📈", text: "Haftalik tushum 84.6M / 90M (94%)", action: null },
      { priority: "🏆", text: "Plan bajarish 92%, oxirgi 3 hafta yaxshilanmoqda", action: null },
      { priority: "🔥", text: "BORIEV M. 28 kun streak — agentlar orasida rekord", action: null },
    ]
  },
  {
    title: "⚠️ Risk va muammolar",
    color: "bg-rose-50 border-rose-300",
    items: [
      { priority: "🚨", text: "Klient #1389 (Ali Ake Магазин) — sotuv 70% pasaygan, At Risk segment", action: "Qo'ng'iroq" },
      { priority: "📉", text: "Logistika xarajati rejadan 9% oshdi (yoqilg'i + remont)", action: "Tahlil" },
      { priority: "⏰", text: "Voda Premium 1L zaxirasi 0.4 kun qoldi — kritik!", action: "Buyurtma 560 dona" },
    ]
  },
  {
    title: "🎁 Imkoniyatlar",
    color: "bg-amber-50 border-amber-300",
    items: [
      { priority: "💎", text: "5 ta Champions klientga premium VIP taklif yaratish — 184M potensial", action: null },
      { priority: "🌱", text: "FRESH Маркет (yangi referral) — 1-haftada 720k tushum, perspektiv", action: null },
      { priority: "🚀", text: "Choco-Boom narxi raqobatdan past — narxni 2k ko'tarish mumkin (margin +12%)", action: null },
    ]
  },
]

const STATS = [
  { label: "Bugun rejasi", value: "15 M", subtext: "Target tushum" },
  { label: "Vizitlar", value: "42", subtext: "Rejalashtirilgan" },
  { label: "Klient kuzata", value: "8", subtext: "Yangi vizit" },
  { label: "Toza foyda", value: "+38%", subtext: "Margin (target 35%)" },
]

export default function BriefingPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Newspaper className="w-7 h-7 text-amber-500" />
              AI Kunlik Brifing
            </h1>
            <p className="text-sm text-slate-500">Dunyoda yagona AI · {BRIEFING_DATE}</p>
          </div>
          <Button variant="outline" className="gap-2"><Volume2 className="w-4 h-4" /> Eshitish (TTS)</Button>
          <Button variant="outline" className="gap-2"><Share2 className="w-4 h-4" /> Telegram'ga yuborish</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map(s => (
            <Card key={s.label} className="p-4">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-3xl font-bold font-mono mt-1">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.subtext}</div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-300">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-700 mb-1">AI XULOSA — 30 SONIYALIK O'QISH</div>
              <p className="text-base text-slate-800">
                <span className="font-bold">Bugun foydali kun bo'ladi</span> — kechagi tushum reja+3.3%, target 15M qabul qilingan.
                Lekin <span className="font-bold text-rose-700">3 ta diqqatga molik holat</span>: Bonjur muddati 2 kunda tugaydi (216k risk),
                Voda Premium zaxirasi tugaydi, Klient #1389 At Risk. Birinchi navbatda ular bilan ishlash.
                Yaxshi xabar: <span className="font-bold text-emerald-700">BORIEV M. 28 kun streak rekordi</span>!
              </p>
            </div>
          </div>
        </Card>

        {SECTIONS.map((section, i) => (
          <Card key={i} className={`p-5 border-2 ${section.color}`}>
            <h2 className="text-lg font-bold mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <div key={j} className="flex items-start gap-3 p-2 rounded-lg bg-white/60">
                  <span className="text-base flex-shrink-0">{item.priority}</span>
                  <div className="flex-1 text-sm">{item.text}</div>
                  {item.action && (
                    <Button size="sm" className="h-7 text-xs flex-shrink-0">{item.action}</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <Bell className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-emerald-800">📅 Brifing avtomatik yetkaziladi</h3>
              <p className="text-sm text-slate-700 mt-1">
                Har kuni soat 09:00 da Telegram'ga yuboriladi. SMS va Email orqali ham qabul qilish mumkin —
                /sozlamalar/notifications da kanallarni belgilang.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-violet-50 border-2 border-amber-300">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800">AI Brifing — bizdan boshqa hech kimda yo'q</h3>
              <p className="text-sm text-slate-700 mt-1">
                Har kuni AI sizning ma'lumotingizdan eng muhim 5 ta bo'limni avtomatik yig'adi:
                ustuvorliklar, kechagi natijalar, hafta progressi, risklari, va imkoniyatlari.
                <span className="font-bold"> SalesDoc va raqobatchilarda yo'q</span> — bu SavdoAI'ning eksklyuziv ficha.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
