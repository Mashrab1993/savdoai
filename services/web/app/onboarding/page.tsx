"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Package, Users, Settings, ShoppingCart, CheckCircle2,
  ArrowRight, Sparkles, Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    id: "salom",
    icon: Sparkles,
    title: "SavdoAI ga xush kelibsiz! 🎉",
    description: "O'zbekistonning eng aqlli savdo boshqaruv tizimi. Keling, 3 daqiqada sozlab olamiz.",
    color: "emerald",
  },
  {
    id: "tovar",
    icon: Package,
    title: "Tovarlarni qo'shing",
    description: "Tovarlar ro'yxatini kiritish — Excel fayl yuklash yoki qo'lda qo'shish. Barcode scan ham ishlaydi.",
    action: "Tovar qo'shish",
    href: "/products",
    tip: "💡 Telegram botga Excel fayl yuboring — AI avtomatik import qiladi",
    color: "blue",
  },
  {
    id: "klient",
    icon: Users,
    title: "Klientlarni qo'shing",
    description: "Doimiy mijozlaringiz haqida ma'lumot kiriting. Telefon va manzil yetarli — qolganini keyinroq to'ldirasiz.",
    action: "Klient qo'shish",
    href: "/clients",
    tip: "💡 Botga ovoz bilan ayting: 'Yangi klient Akmal do'koni telefon 998901234567'",
    color: "purple",
  },
  {
    id: "sotuv",
    icon: ShoppingCart,
    title: "Birinchi sotuvni qiling!",
    description: "Telegram botga ovoz yuboring: 'Akmalga 5 ta Coca-Cola 8000 dan'. Yoki web paneldan kiriting.",
    action: "Sotuv qilish",
    href: "/sales",
    tip: "💡 SavdoAI 8 ta O'zbek shevasini tushunadi — o'zingizcha gapiring!",
    color: "emerald",
  },
  {
    id: "sozlama",
    icon: Settings,
    title: "Sozlamalarni moslashtiring",
    description: "Klient formasi, buyurtma qoidalari, printer sozlamalari — barchasini admin paneldan boshqaring.",
    action: "Sozlamalar",
    href: "/config",
    tip: "💡 Har bir sozlamani server orqali masofadan o'zgartirish mumkin",
    color: "amber",
  },
  {
    id: "tayyor",
    icon: Rocket,
    title: "Tayyor! 🚀",
    description: "SavdoAI to'liq sozlandi. Endi AI sizning eng kuchli yordamchingiz — ovoz bilan buyruq bering, tahlil so'rang, hisobot oling.",
    color: "emerald",
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const router = useRouter()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0
  const progress = (step / (STEPS.length - 1)) * 100

  const next = () => {
    if (current.id !== "salom" && current.id !== "tayyor") {
      setCompleted(prev => new Set(prev).add(current.id))
    }
    if (isLast) {
      localStorage.setItem("onboarding_done", "true")
      router.push("/dashboard")
    } else {
      setStep(s => s + 1)
    }
  }

  const Icon = current.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{step + 1} / {STEPS.length}</span>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {STEPS.map((s: any, i: number) => (
              <div key={s.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? "bg-emerald-500 text-white" :
                i === step ? `bg-${current.color}-500 text-white scale-110 shadow-lg` :
                "bg-gray-200 dark:bg-gray-700 text-gray-400"
              }`}>
                {completed.has(s.id) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl bg-${current.color}-100 dark:bg-${current.color}-900/30 flex items-center justify-center mx-auto mb-6`}>
            <Icon className={`w-8 h-8 text-${current.color}-600`} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {current.title}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {current.description}
          </p>

          {current.tip && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-6 text-left">
              <p className="text-xs text-blue-700 dark:text-blue-400">{current.tip}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {!isFirst && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="px-6">
                Orqaga
              </Button>
            )}
            {current.action && current.href && (
              <Button variant="outline" onClick={() => router.push(current.href!)}
                className="px-6 border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                {current.action} →
              </Button>
            )}
            <Button onClick={next} className="px-8 bg-emerald-600 hover:bg-emerald-700">
              {isLast ? "Dashboard ga o'tish" : "Keyingi"}
              {!isLast && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {!isFirst && !isLast && (
            <button onClick={() => { localStorage.setItem("onboarding_done", "true"); router.push("/dashboard") }}
              className="text-xs text-gray-400 mt-4 hover:text-gray-600">
              O&apos;tkazib yuborish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
