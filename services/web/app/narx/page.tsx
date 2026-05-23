"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Check, Sparkles, Crown, Building2, Mic, Brain, BarChart3,
  Shield, Headphones, Users, MapPin, Zap, Bell, ArrowRight
} from "lucide-react"

type Tarif = {
  kod: string
  nomi: string
  narx_oylik: number
  narx_yillik: number
  emoji: string
  rang: string
  taklif?: string
  uchun: string
  fichalar: { matn: string; bor: boolean }[]
  cta: string
  highlight?: boolean
}

const TARIFLAR: Tarif[] = [
  {
    kod: "sinov",
    nomi: "14 KUN BEPUL",
    narx_oylik: 0,
    narx_yillik: 0,
    emoji: "🌱",
    rang: "slate",
    uchun: "Avval sinab ko'ring, keyin to'lang",
    fichalar: [
      { matn: "Barcha funksiyalar 14 kun ochiq", bor: true },
      { matn: "Karta talab qilinmaydi", bor: true },
      { matn: "Demo ma'lumotlar avtomatik", bor: true },
      { matn: "Telegram support guruh", bor: true },
      { matn: "Onboarding qo'llab-quvvatlash", bor: true },
    ],
    cta: "Bepul sinashni boshlash",
  },
  {
    kod: "boshlangich",
    nomi: "Boshlang'ich",
    narx_oylik: 99_000,
    narx_yillik: 990_000,
    emoji: "⭐",
    rang: "emerald",
    uchun: "Kichik do'kon, 1 sotuvchi",
    fichalar: [
      { matn: "500 ta tovargacha", bor: true },
      { matn: "Cheksiz sotuv", bor: true },
      { matn: "200 mijoz", bor: true },
      { matn: "AI ovozli buyurtma (50/kun)", bor: true },
      { matn: "Asosiy hisobotlar", bor: true },
      { matn: "Telegram bot", bor: true },
      { matn: "Mobil ilova (APK)", bor: true },
      { matn: "Click + Payme to'lov", bor: true },
      { matn: "Multi-filial", bor: false },
      { matn: "GPS kuzatuv", bor: false },
    ],
    cta: "Tanlash",
  },
  {
    kod: "biznes",
    nomi: "Biznes",
    narx_oylik: 299_000,
    narx_yillik: 2_990_000,
    emoji: "💎",
    rang: "blue",
    uchun: "O'rta do'kon, ko'p sotuvchi",
    taklif: "Eng mashhur",
    highlight: true,
    fichalar: [
      { matn: "Cheksiz tovarlar", bor: true },
      { matn: "Cheksiz sotuv va mijoz", bor: true },
      { matn: "AI ovozli buyurtma (cheksiz)", bor: true },
      { matn: "AI Copilot (savol-javob)", bor: true },
      { matn: "Anomaliya aniqlash (AI)", bor: true },
      { matn: "Biznes Salomatlik (AI)", bor: true },
      { matn: "Kunlik brifing (AI ovoz)", bor: true },
      { matn: "3 filial gacha", bor: true },
      { matn: "KPI va Loyalty", bor: true },
      { matn: "Excel/PDF export", bor: true },
      { matn: "Tezkor support", bor: true },
    ],
    cta: "Tanlash",
  },
  {
    kod: "premium",
    nomi: "Distribyutor Premium",
    narx_oylik: 799_000,
    narx_yillik: 7_990_000,
    emoji: "👑",
    rang: "purple",
    uchun: "Distribyutor, ko'p filial",
    fichalar: [
      { matn: "Hammasi Biznes paketdan", bor: true },
      { matn: "Cheksiz filial va ombor", bor: true },
      { matn: "GPS kuzatuv (agentlar)", bor: true },
      { matn: "Multi-supplier (Sladus/Krember)", bor: true },
      { matn: "Webhook va integratsiya", bor: true },
      { matn: "Maxsus brending", bor: true },
      { matn: "Shaxsiy menedjer", bor: true },
      { matn: "SLA 99% uptime", bor: true },
      { matn: "Maxsus o'rgatish (jamoa)", bor: true },
      { matn: "Click/Payme bevosita to'lov", bor: true },
    ],
    cta: "Bog'lanish",
  },
]

const FAQ = [
  {
    s: "Sinov muddati tugagandan keyin nima bo'ladi?",
    j: "14 kun keyin sizdan tarifni tanlashingiz so'raladi. Tanlamasangiz, ma'lumotlar 30 kun saqlanadi, lekin yangi zakaz qabul qilolmaysiz. Istalgan vaqtda qaytib kelishingiz mumkin.",
  },
  {
    s: "To'lovni qanday qilaman?",
    j: "Click yoki Payme orqali avtomatik. Avtomatik yangilanadi, istalgan vaqtda bekor qilishingiz mumkin (admin panelda 1 tugma).",
  },
  {
    s: "Mening ma'lumotlarim xavfsizmi?",
    j: "Ha. Har bir do'kon alohida tenant arxitekturada — sizning ma'lumotlaringizni hech kim ko'rolmaydi. Kunlik backup, AES-256 shifrlash.",
  },
  {
    s: "Tovarlarni qanday kiritaman?",
    j: "3 yo'l: (1) Excel'dan yuklab olish, (2) Telefon kamera bilan skanlash, (3) AI ovoz orqali ('Coca-cola 12 dona kelibdi 50 ming so'mdan').",
  },
  {
    s: "Internet bo'lmasa ishlaydimi?",
    j: "Ha, mobil ilovada offline rejim bor. Internet kelganda avtomatik sinxronlanadi.",
  },
  {
    s: "Ovozli buyurtma qaysi tilda?",
    j: "O'zbek (lotin va kirill), rus tilida. Gemini 2.5 Pro modeli — eng aniq STT bozorda.",
  },
  {
    s: "Yillik to'lovda chegirma bormi?",
    j: "Ha — 2 oy bepul (16% chegirma). Yuqorida yillik narxi ko'rsatilgan.",
  },
  {
    s: "Bekor qilsam pulim qaytadimi?",
    j: "Birinchi 30 kun ichida 100% pulingiz qaytariladi (savol bermaymiz). Keyin pro-rata asosida.",
  },
]

function FazaFichalar({ tarif }: { tarif: Tarif }) {
  return (
    <ul className="space-y-3 mt-6">
      {tarif.fichalar.map((f, i) => (
        <li key={i} className={`flex items-start gap-2 text-sm ${!f.bor ? "opacity-40 line-through" : ""}`}>
          <Check className={`w-5 h-5 shrink-0 mt-0.5 ${f.bor ? "text-emerald-600" : "text-slate-400"}`} />
          <span>{f.matn}</span>
        </li>
      ))}
    </ul>
  )
}

export default function NarxPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>14 kun bepul sinov · Karta talab qilinmaydi</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            Sizning do'koningiz uchun
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              AI savdo tizimi
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Ovozli buyurtma · Real-time hisobot · AI Copilot · Multi-filial
            <br />
            <span className="text-slate-500">O'zbekistondagi 1-AI savdo platforma</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {TARIFLAR.map((t) => (
            <Card
              key={t.kod}
              className={`relative p-6 flex flex-col ${
                t.highlight
                  ? "border-2 border-blue-500 shadow-xl scale-105"
                  : "border border-slate-200"
              }`}
            >
              {t.taklif && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {t.taklif}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{t.emoji}</span>
                <h3 className="text-lg font-bold text-slate-900">{t.nomi}</h3>
              </div>
              <p className="text-sm text-slate-500 min-h-[2.5rem]">{t.uchun}</p>

              <div className="mt-6">
                {t.narx_oylik === 0 ? (
                  <div>
                    <div className="text-4xl font-bold text-slate-900">BEPUL</div>
                    <div className="text-sm text-slate-500 mt-1">14 kun</div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        {(t.narx_oylik / 1000).toFixed(0)}
                      </span>
                      <span className="text-lg text-slate-600">ming so'm</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">oyiga</div>
                    <div className="text-xs text-emerald-600 mt-2 font-medium">
                      Yillik: {(t.narx_yillik / 1_000_000).toFixed(2)}M so'm
                      <span className="ml-1 bg-emerald-100 px-1.5 py-0.5 rounded">−16%</span>
                    </div>
                  </div>
                )}
              </div>

              <FazaFichalar tarif={t} />

              <div className="mt-auto pt-6">
                <Link href={t.kod === "sinov" ? "/login?signup=1" : `/login?signup=1&tarif=${t.kod}`}>
                  <Button
                    className={`w-full ${
                      t.highlight
                        ? "bg-blue-600 hover:bg-blue-700"
                        : t.kod === "premium"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : ""
                    }`}
                    size="lg"
                  >
                    {t.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Boshqalardan farqimiz nima?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FichaCard
              icon={<Mic className="w-6 h-6 text-emerald-600" />}
              title="Ovozli buyurtma"
              desc="O'zbek tilida. Tugmaga bosib ovozli aytasiz — tizim avtomatik tovar, miqdor, mijozni aniqlaydi."
            />
            <FichaCard
              icon={<Brain className="w-6 h-6 text-purple-600" />}
              title="6 ta AI moduli"
              desc="Copilot, Anomaliya, Biznes Salomatlik, Kunlik Brifing — boshqa hech qaysi tizimda yo'q."
            />
            <FichaCard
              icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
              title="Real-time hisobot"
              desc="Bugungi sotuv, qarz, foyda — barchasi telefoningizda real vaqtda. Excel/PDF eksport."
            />
            <FichaCard
              icon={<MapPin className="w-6 h-6 text-orange-600" />}
              title="GPS agent kuzatuvi"
              desc="Agentlar qaerda? Qancha do'kon kirdi? Marshrut optimal mi? — Premium tarifda."
            />
            <FichaCard
              icon={<Shield className="w-6 h-6 text-red-600" />}
              title="Bank darajasi xavfsizlik"
              desc="AES-256 shifrlash, kunlik backup, multi-tenant izolyatsiya. Ma'lumotlar — sizniki."
            />
            <FichaCard
              icon={<Headphones className="w-6 h-6 text-cyan-600" />}
              title="Telegram support"
              desc="Telefon-telegram orqali real odam yordami. O'rtacha javob vaqti: 15 daqiqa."
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tez-tez beriladigan savollar</h2>
          <div className="space-y-4">
            {FAQ.map((f, i) => (
              <Card key={i} className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{f.s}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.j}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mt-20 p-10 bg-gradient-to-br from-emerald-600 to-blue-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Hozir boshlang — 14 kun bepul</h2>
          <p className="text-emerald-50 mb-6 text-lg">
            Karta kerak emas. 5 daqiqada signup. Demo ma'lumotlar avtomatik.
          </p>
          <Link href="/login?signup=1">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8">
              Bepul sinashni boshlash
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </Card>

        <div className="mt-16 text-center text-sm text-slate-500">
          <p>
            Savol bormi? Telegram:{" "}
            <a href="https://t.me/savdoai_support" className="text-blue-600 hover:underline">
              @savdoai_support
            </a>
            {" · "}
            Telefon:{" "}
            <a href="tel:+998901234567" className="text-blue-600 hover:underline">
              +998 90 123 45 67
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function FichaCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{desc}</p>
      </div>
    </div>
  )
}
