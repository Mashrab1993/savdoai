"use client"

import { useState } from "react"
import {
  Building2, Eye, EyeOff, Loader2,
  ShieldCheck, TrendingUp, Users, Package,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const { locale } = useLocale()
  const { loginWithToken, loading: authLoading, error: authError, clearError } = useAuth()

  const [showTokenForm, setShowTokenForm] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [token, setToken] = useState("")
  const [tokenError, setTokenError] = useState("")

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) {
      setTokenError(locale === "uz" ? "Token kiritish shart" : "Введите токен")
      return
    }
    if (trimmed.length < 10) {
      setTokenError(locale === "uz" ? "Token juda qisqa" : "Токен слишком короткий")
      return
    }
    setTokenError("")
    clearError()
    await loginWithToken(trimmed)
  }

  const stats = [
    { label: translations.dashboard.stat1Label[locale], value: "1 200+",  icon: Users },
    { label: translations.dashboard.stat2Label[locale], value: "69M so'm", icon: TrendingUp },
    { label: translations.dashboard.stat3Label[locale], value: "340+",    icon: Package },
    { label: translations.dashboard.stat4Label[locale], value: "8 500+",  icon: ShieldCheck },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left panel ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--sidebar-foreground)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

        {/* Logo + Language switcher */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-lg">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">SavdoAI</span>
              <span className="block text-[10px] text-sidebar-foreground/40 -mt-0.5 font-medium tracking-widest uppercase">v25</span>
            </div>
          </div>
          <div className="opacity-70">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Main copy */}
        <div className="relative space-y-7">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight text-balance">
              {locale === "uz"
                ? "Biznesingizni yangi darajaga olib chiqing."
                : "Поднимите свой бизнес на новый уровень."}
            </h2>
            <p className="text-sidebar-foreground/55 leading-relaxed text-lg text-pretty max-w-md">
              {locale === "uz"
                ? "Mijozlar, ombor, savdolar, kassaxona va hisobotlar — barchasi yagona professional panelda."
                : "Клиенты, склад, продажи, касса и отчёты — всё в едином профессиональном интерфейсе."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-sidebar-accent/50 border border-sidebar-border rounded-xl p-4 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-sidebar-primary/10 shrink-0">
                  <Icon className="w-4 h-4 text-sidebar-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-sidebar-foreground leading-none">{value}</p>
                  <p className="text-xs text-sidebar-foreground/45 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground/40">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {locale === "uz"
                ? "Ma'lumotlar xavfsiz. SSL va JWT himoyasi."
                : "Данные защищены. SSL и JWT шифрование."}
            </span>
          </div>
        </div>

        <p className="relative text-xs text-sidebar-foreground/30">
          © 2025 SavdoAI. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile header */}
        <div className="w-full max-w-sm mb-8 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">SavdoAI</span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="w-full max-w-sm space-y-7">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {locale === "uz" ? "SavdoAI ga kirish" : "Вход в SavdoAI"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {locale === "uz" ? "Telegram yoki admin token orqali tizimga kiring" : "Войдите через Telegram или токен администратора"}
            </p>
          </div>

          {/* Token login — primary and only auth method */}
          {!showTokenForm ? (
            <div className="space-y-3">
              <Button
                className="w-full h-11 gap-3 text-sm font-semibold shadow-sm"
                onClick={() => setShowTokenForm(true)}
              >
                <KeyRound className="w-4 h-4" />
                {locale === "uz" ? "Token bilan kirish" : "Войти по токену"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {locale === "uz"
                  ? "Telegram botda /token buyrug'ini yuboring"
                  : "Отправьте /token в Telegram боте"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="token">
                  {locale === "uz" ? "API Token" : "API Токен"}
                </Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    placeholder={locale === "uz" ? "Telegram botdan olingan token" : "Токен из Telegram бота"}
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className={cn("h-10 pr-10 font-mono text-xs", (tokenError || authError) && "border-destructive")}
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {tokenError && <p className="text-xs text-destructive">{tokenError}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "uz"
                    ? "Telegram botda /token buyrug'ini yuboring va olingan tokenni kiriting."
                    : "Отправьте /token в Telegram боте и вставьте полученный токен."}
                </p>
              </div>

              {authError && (
                <p className="text-xs text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                  {authError}
                </p>
              )}

              <Button type="submit" className="w-full h-10" disabled={authLoading}>
                {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {authLoading ? (locale === "uz" ? "Tekshirilmoqda..." : "Проверка...") : (locale === "uz" ? "Kirish" : "Войти")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
