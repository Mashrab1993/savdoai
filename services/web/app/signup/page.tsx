"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sparkles, Check, X, ArrowRight, Store, User, Phone, Lock, Tag, AlertCircle
} from "lucide-react"

type KodHolat = "idle" | "tekshirilmoqda" | "bos" | "band" | "noto_gri"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    dokon_nomi: "",
    ism: "",
    telefon: "+998",
    parol: "",
    parol2: "",
    company_kod: "",
  })
  const [kodHolat, setKodHolat] = useState<KodHolat>("idle")
  const [kodAutoSuggested, setKodAutoSuggested] = useState(true)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || ""
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  function update<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
    setError(null)
    if (key === "company_kod") {
      setKodAutoSuggested(false)
    }
  }

  useEffect(() => {
    if (kodAutoSuggested && form.dokon_nomi.trim().length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          const r = await fetch(
            `${apiBase}/auth/suggest_kod?dokon_nomi=${encodeURIComponent(form.dokon_nomi.trim())}`,
            { method: "POST" }
          )
          const data = await r.json()
          if (data.kod) {
            setForm((f) => ({ ...f, company_kod: data.kod }))
            setKodHolat("bos")
          }
        } catch {
          // ignore
        }
      }, 400)
    }
  }, [form.dokon_nomi, kodAutoSuggested, apiBase])

  useEffect(() => {
    if (kodAutoSuggested || !form.company_kod) return
    const kod = form.company_kod.trim().toLowerCase()
    if (!/^[a-z0-9\-]{2,30}$/.test(kod)) {
      setKodHolat("noto_gri")
      return
    }
    setKodHolat("tekshirilmoqda")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${apiBase}/auth/check_kod`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kod }),
        })
        const data = await r.json()
        setKodHolat(data.mavjud ? "band" : "bos")
      } catch {
        setKodHolat("idle")
      }
    }, 400)
  }, [form.company_kod, kodAutoSuggested, apiBase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.parol.length < 6) {
      setError("Parol kamida 6 belgi bo'lishi kerak")
      return
    }
    if (form.parol !== form.parol2) {
      setError("Parollar mos kelmadi")
      return
    }
    if (kodHolat === "band") {
      setError("Bu kompaniya kodi band, boshqa kod tanlang")
      return
    }
    if (kodHolat === "noto_gri") {
      setError("Kompaniya kodi faqat lotin harf, raqam va tire (-) bo'lishi mumkin")
      return
    }

    setLoading(true)
    try {
      const r = await fetch(`${apiBase}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dokon_nomi: form.dokon_nomi.trim(),
          ism: form.ism.trim(),
          telefon: form.telefon.trim(),
          parol: form.parol,
          company_kod: form.company_kod.trim().toLowerCase() || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.detail || "Xato yuz berdi")
        setLoading(false)
        return
      }
      if (data.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token)
          localStorage.setItem("user_id", String(data.user_id))
          localStorage.setItem("company_kod", data.company_kod || "")
        }
        router.push(`/dashboard?welcome=1&kod=${encodeURIComponent(data.company_kod || "")}`)
      }
    } catch {
      setError("Server bilan bog'lanish xatosi. Internet aloqasini tekshiring.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-start">

        <div className="hidden md:block space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>14 kun bepul · Karta kerak emas</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            5 daqiqada<br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              do'koningizni AI'ga ulang
            </span>
          </h1>

          <p className="text-lg text-slate-600">
            Ovozli buyurtma. Real-time hisobot. 6 ta AI moduli. Toshkentdagi sotuvchilar ishlatadi.
          </p>

          <ul className="space-y-3 text-slate-700">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span>14 kun barcha funksiyalar ochiq</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span>O'zingizning kompaniya kodi (SalesDoc tipida)</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span>Sotuvchilarni keyin qo'shasiz (har biriga login)</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span>Karta talab qilinmaydi</span>
            </li>
          </ul>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Sinov 14 kundan keyin tarifni tanlash kerak — 99,000 so'm/oy dan.
              <Link href="/narx" className="text-emerald-600 hover:underline ml-1">
                Narxlarni ko'rish →
              </Link>
            </p>
          </div>
        </div>

        <Card className="p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ro'yxatdan o'tish</h2>
          <p className="text-sm text-slate-600 mb-6">
            Allaqachon hisobingiz bormi?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Login qiling
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <Store className="w-4 h-4 inline mr-1.5 text-slate-500" />
                Do'kon yoki kompaniya nomi
              </label>
              <Input
                type="text"
                placeholder="Salom Market"
                value={form.dokon_nomi}
                onChange={(e) => update("dokon_nomi", e.target.value)}
                required
                minLength={2}
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <Tag className="w-4 h-4 inline mr-1.5 text-slate-500" />
                Kompaniya kodi
                <span className="text-xs text-slate-500 font-normal ml-2">
                  (sizning unikal URL'ingiz: savdoai.uz/c/<b>{form.company_kod || "kod"}</b>)
                </span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="salom-market"
                  value={form.company_kod}
                  onChange={(e) => update("company_kod", e.target.value.toLowerCase())}
                  pattern="^[a-z0-9\-]{2,30}$"
                  maxLength={30}
                  required
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {kodHolat === "tekshirilmoqda" && (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                  )}
                  {kodHolat === "bos" && form.company_kod && (
                    <Check className="w-5 h-5 text-emerald-600" />
                  )}
                  {kodHolat === "band" && <X className="w-5 h-5 text-red-500" />}
                  {kodHolat === "noto_gri" && <AlertCircle className="w-5 h-5 text-amber-500" />}
                </div>
              </div>
              {kodHolat === "band" && (
                <p className="text-xs text-red-600 mt-1">Bu kod band — boshqa tanlang</p>
              )}
              {kodHolat === "noto_gri" && (
                <p className="text-xs text-amber-600 mt-1">
                  Faqat lotin harf, raqam va tire (-). 2-30 belgi.
                </p>
              )}
              {kodAutoSuggested && form.company_kod && (
                <p className="text-xs text-slate-500 mt-1">
                  Avtomatik tanlandi — istasangiz o'zgartiring
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <User className="w-4 h-4 inline mr-1.5 text-slate-500" />
                Sizning ismingiz
              </label>
              <Input
                type="text"
                placeholder="Aziz Aka"
                value={form.ism}
                onChange={(e) => update("ism", e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <Phone className="w-4 h-4 inline mr-1.5 text-slate-500" />
                Telefon raqami
              </label>
              <Input
                type="tel"
                placeholder="+998901234567"
                value={form.telefon}
                onChange={(e) => update("telefon", e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Telegram orqali tasdiqlash xabari yuboriladi
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <Lock className="w-4 h-4 inline mr-1.5 text-slate-500" />
                Parol
              </label>
              <Input
                type="password"
                placeholder="Kamida 6 ta belgi"
                value={form.parol}
                onChange={(e) => update("parol", e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Parolni qaytaring
              </label>
              <Input
                type="password"
                placeholder="Yana bir marta yozing"
                value={form.parol2}
                onChange={(e) => update("parol2", e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || kodHolat === "band" || kodHolat === "noto_gri"}
            >
              {loading ? "Yaratilmoqda..." : "14 kun bepul boshlash"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            <p className="text-xs text-center text-slate-500 mt-4">
              Ro'yxatdan o'tib siz{" "}
              <Link href="/terms" className="text-slate-600 hover:underline">shartlar</Link>
              {" va "}
              <Link href="/privacy" className="text-slate-600 hover:underline">maxfiylik siyosati</Link>
              ga rozi bo'lasiz.
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
