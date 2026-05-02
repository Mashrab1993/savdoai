"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Newspaper, Volume2, Share2, Bell, Sparkles } from "lucide-react"
import Link from "next/link"

const BRIEFING_DATE = "2 may 2026, juma · 09:00 brifingi"

const SECTIONS = [
  {
    title: "🌅 Bugungi 3 ustuvorlik",
    accent: "#10B981",
    items: [
      { priority: "🔴 1", text: "Bonjur 50g muddati 2 kun ichida tugaydi (216k riskda) — auto-promo −40% ishga tushirish kerak", action: "Promo yarat" },
      { priority: "🟠 2", text: "Salom Magazin №1 bilan premium taklif (Coca + Voda paket) — 25% sotuv ko'paytirish imkoniyati", action: "Taklif tayyorla" },
      { priority: "🟡 3", text: "Турсунов Ж. KPI past (4.5/5) — bugun mentor bilan suhbat rejalashtirilgan", action: "Suhbat" },
    ]
  },
  {
    title: "📊 Kechagi natijalar (1 may)",
    accent: "#3B82F6",
    items: [
      { priority: "💰", text: "Kunlik tushum: 12.4M so'm (target 12M, +3.3%)", action: null },
      { priority: "📦", text: "38 ta zakaz qabul qilindi (rejada 42 ta — 90.5%)", action: null },
      { priority: "🆕", text: "4 ta yangi klient ro'yxatga olindi", action: null },
      { priority: "✅", text: "BORIEV M. — kunlik chempion (3.84M tushum)", action: null },
    ]
  },
  {
    title: "🎯 Bu hafta progress",
    accent: "#8B5CF6",
    items: [
      { priority: "📈", text: "Haftalik tushum 84.6M / 90M (94%)", action: null },
      { priority: "🏆", text: "Plan bajarish 92%, oxirgi 3 hafta yaxshilanmoqda", action: null },
      { priority: "🔥", text: "BORIEV M. 28 kun streak — agentlar orasida rekord", action: null },
    ]
  },
  {
    title: "⚠️ Risk va muammolar",
    accent: "#C75D3C",
    items: [
      { priority: "🚨", text: "Klient #1389 (Ali Ake Магазин) — sotuv 70% pasaygan, At Risk segment", action: "Qo'ng'iroq" },
      { priority: "📉", text: "Logistika xarajati rejadan 9% oshdi (yoqilg'i + remont)", action: "Tahlil" },
      { priority: "⏰", text: "Voda Premium 1L zaxirasi 0.4 kun qoldi — kritik!", action: "Buyurtma 560 dona" },
    ]
  },
  {
    title: "🎁 Imkoniyatlar",
    accent: "#D97706",
    items: [
      { priority: "💎", text: "5 ta Champions klientga premium VIP taklif yaratish — 184M potensial", action: null },
      { priority: "🌱", text: "FRESH Маркет (yangi referral) — 1-haftada 720k tushum, perspektiv", action: null },
      { priority: "🚀", text: "Choco-Boom narxi raqobatdan past — narxni 2k ko'tarish mumkin (margin +12%)", action: null },
    ]
  },
]

const STATS = [
  { label: "Bugun rejasi", value: "15 M", subtext: "Target tushum", accent: "#10B981" },
  { label: "Vizitlar", value: "42", subtext: "Rejalashtirilgan", accent: "#3B82F6" },
  { label: "Klient kuzata", value: "8", subtext: "Yangi vizit", accent: "#8B5CF6" },
  { label: "Toza foyda", value: "+38%", subtext: "Margin (target 35%)", accent: "#C75D3C" },
]

export default function BriefingPage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/dashboard" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AI</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Newspaper className="w-8 h-8 text-[#D97706]" />
                AI Kunlik <span className="italic text-[#C75D3C]">Brifing</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Dunyoda yagona AI · {BRIEFING_DATE}</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Volume2 className="w-4 h-4" /> Eshitish (TTS)</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Share2 className="w-4 h-4" /> Telegram'ga</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map(s => (
              <Card key={s.label} className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
                <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: s.accent }}>{s.label}</div>
                <div className="text-3xl font-medium font-mono tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.value}</div>
                <div className="text-xs text-[#9C8A6E] mt-1">{s.subtext}</div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: s.accent }} />
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-white border-2 border-[#D97706]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#D97706]" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.2em] text-[#D97706] font-medium mb-1">AI XULOSA — 30 SONIYALIK O'QISH</div>
                <p className="text-base text-[#1A1A1A] leading-relaxed">
                  <span className="font-medium" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Bugun foydali kun bo'ladi</span> — kechagi tushum reja+3.3%, target 15M qabul qilingan.
                  Lekin <span className="font-medium text-[#C75D3C]">3 ta diqqatga molik holat</span>: Bonjur muddati 2 kunda tugaydi (216k risk),
                  Voda Premium zaxirasi tugaydi, Klient #1389 At Risk. Birinchi navbatda ular bilan ishlash.
                  Yaxshi xabar: <span className="font-medium text-emerald-700">BORIEV M. 28 kun streak rekordi</span>!
                </p>
              </div>
            </div>
          </Card>

          {SECTIONS.map((section, i) => (
            <Card key={i} className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-7 rounded-full" style={{ background: section.accent }} />
                <h2 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{section.title}</h2>
              </div>
              <div className="space-y-2">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D3]">
                    <span className="text-base flex-shrink-0">{item.priority}</span>
                    <div className="flex-1 text-sm text-[#1A1A1A]">{item.text}</div>
                    {item.action && (
                      <Button size="sm" className="h-7 text-xs flex-shrink-0" style={{ background: section.accent }}>{item.action}</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <Card className="p-5 bg-white border border-emerald-200 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>📅 Brifing avtomatik yetkaziladi</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  Har kuni soat 09:00 da Telegram'ga yuboriladi. SMS va Email orqali ham qabul qilish mumkin —
                  /sozlamalar/notifications da kanallarni belgilang.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-2 border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#C75D3C]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">DUNYODA YAGONA</div>
                <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>AI Brifing</h3>
                <p className="text-sm text-[#6B5B4D] mt-2 leading-relaxed">
                  Har kuni AI sizning ma'lumotingizdan eng muhim 5 ta bo'limni avtomatik yig'adi:
                  ustuvorliklar, kechagi natijalar, hafta progressi, risklari, va imkoniyatlari.
                  <span className="font-medium text-[#C75D3C]"> SalesDoc va raqobatchilarda yo'q</span> — bu SavdoAI'ning eksklyuziv ficha.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
