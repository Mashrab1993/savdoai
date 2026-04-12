"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPublicApiBaseUrl } from "@/lib/api/base-url"

/**
 * /tg — Telegram Mini App landing sahifasi
 *
 * Telegram ichidan ochilganda:
 * 1. Telegram.WebApp.initData oladi
 * 2. /auth/webapp ga yuboradi
 * 3. JWT token oladi → localStorage ga saqlaydi
 * 4. /dashboard ga redirect qiladi
 *
 * Oddiy brauzerdan ochilsa — login sahifasiga yo'naltiradi.
 */

type TgStatus = "loading" | "authenticating" | "success" | "error" | "not-telegram"

export default function TelegramMiniAppPage() {
  const router = useRouter()
  const [status, setStatus] = useState<TgStatus>("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    // Telegram WebApp SDK yuklash
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-web-app.js"
    script.async = true
    script.onload = () => initTelegram()
    script.onerror = () => {
      setStatus("not-telegram")
      setTimeout(() => router.push("/login"), 2000)
    }
    document.head.appendChild(script)

    return () => {
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  async function initTelegram() {
    const tg = (window as any).Telegram?.WebApp
    if (!tg || !tg.initData) {
      setStatus("not-telegram")
      setTimeout(() => router.push("/login"), 2000)
      return
    }

    // Telegram UI sozlamalari
    tg.ready()
    tg.expand()
    if (tg.setHeaderColor) tg.setHeaderColor("#1a1a2e")
    if (tg.setBackgroundColor) tg.setBackgroundColor("#0f0f23")

    setStatus("authenticating")

    try {
      const base = getPublicApiBaseUrl()
      if (!base) throw new Error("API URL sozlanmagan")

      const res = await fetch(`${base}/auth/webapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Xato: ${res.status}`)
      }

      const { token, user_id, ism } = await res.json()

      // Token va user saqlash
      localStorage.setItem("auth_token", token)
      localStorage.setItem("auth_user", JSON.stringify({
        id: user_id,
        ism: ism || tg.initDataUnsafe?.user?.first_name || "",
        username: tg.initDataUnsafe?.user?.username || "",
      }))

      setStatus("success")

      // Dashboard ga o'tish
      setTimeout(() => router.push("/dashboard"), 500)
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function retry() {
    setStatus("loading")
    setError("")
    initTelegram()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f23] text-white p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight">SavdoAI</span>
          <span className="block text-[10px] text-white/40 font-medium tracking-widest uppercase">Mini App</span>
        </div>
      </div>

      {/* Status */}
      {status === "loading" && (
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-sm text-white/60">Telegram tekshirilmoqda...</p>
        </div>
      )}

      {status === "authenticating" && (
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-sm text-white/60">Avtorizatsiya...</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-sm text-green-400">Muvaffaqiyat! Dashboard ochilmoqda...</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <div>
            <p className="text-sm font-medium text-red-400">Xatolik yuz berdi</p>
            <p className="text-xs text-white/40 mt-1">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={retry}
                    className="gap-1.5 border-white/20 text-white hover:bg-card/10">
              <RefreshCw className="w-3.5 h-3.5" />
              Qayta urinish
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/login")}
                    className="border-white/20 text-white hover:bg-card/10">
              Login sahifasi
            </Button>
          </div>
        </div>
      )}

      {status === "not-telegram" && (
        <div className="text-center space-y-3">
          <p className="text-sm text-white/60">Bu sahifa faqat Telegram ichidan ishlaydi.</p>
          <p className="text-xs text-white/40">Login sahifasiga yo'naltirilmoqda...</p>
        </div>
      )}
    </div>
  )
}
