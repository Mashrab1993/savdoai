"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { X, Sparkles, Copy, Check, Users, ArrowRight } from "lucide-react"

const DISMISS_KEY = "welcome_banner_dismissed"

export function WelcomeBanner() {
  const searchParams = useSearchParams()
  const [companyKod, setCompanyKod] = useState<string>("")
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const welcome = searchParams?.get("welcome") === "1"
    const kodFromUrl = searchParams?.get("kod")
    const kodFromStorage = localStorage.getItem("company_kod")
    const kod = kodFromUrl || kodFromStorage || ""
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1"

    if (kod) setCompanyKod(kod)

    if (welcome && kod && !dismissed) {
      setShow(true)
    } else if (welcome) {
      // 1 marotaba ko'rsatib, dismiss qilamiz
      const oncePerSession = sessionStorage.getItem("welcome_shown")
      if (!oncePerSession && kod) {
        setShow(true)
        sessionStorage.setItem("welcome_shown", "1")
      }
    }
  }, [searchParams])

  function dismiss() {
    setShow(false)
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "1")
    }
  }

  function copyKod() {
    if (!companyKod) return
    navigator.clipboard.writeText(companyKod)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!show || !companyKod) return null

  return (
    <Card className="relative p-6 bg-gradient-to-r from-emerald-500 to-blue-600 text-white border-0 shadow-xl mb-6">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded transition"
        aria-label="Yopish"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold mb-2">
            Xush kelibsiz! 14 kun bepul sinov boshlandi.
          </h2>
          <p className="text-emerald-50 mb-4">
            Sizning kompaniyangiz alohida tenant — barcha ma'lumotlar himoyalangan va faqat sizniki.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
            <div className="text-xs uppercase font-semibold text-emerald-100 mb-1">
              Sizning kompaniya kodingiz
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-mono font-bold tracking-wider">
                {companyKod}
              </div>
              <button
                onClick={copyKod}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Nusxalandi</>
                ) : (
                  <><Copy className="w-4 h-4" /> Nusxa olish</>
                )}
              </button>
            </div>
            <div className="text-sm text-emerald-50 mt-2">
              Xodimlaringiz bu kod + o'z logini bilan kiradi.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/sozlamalar/users"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-lg font-medium text-sm transition"
            >
              <Users className="w-4 h-4" />
              Sotuvchi qo'shish
            </Link>
            <Link
              href="/sklad"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition"
            >
              Tovar kiritish
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={dismiss}
              className="px-4 py-2 text-sm text-emerald-50 hover:text-white"
            >
              Keyinroq
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
