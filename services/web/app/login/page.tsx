"use client"

import { useState } from "react"
import {
  Building2, Eye, EyeOff, Loader2,
  ShieldCheck, TrendingUp, Users, Package,
  KeyRound, User, Phone, Sparkles, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

type LoginMethod = "login" | "telefon" | "token"

export default function LoginPage() {
  const { locale } = useLocale()
  const { loginWithToken, loginWithCredentials, loading: authLoading, error: authError, clearError } = useAuth()

  const [method, setMethod] = useState<LoginMethod>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [login, setLogin] = useState("")
  const [parol, setParol] = useState("")
  const [telefon, setTelefon] = useState("")
  const [telParol, setTelParol] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [fieldError, setFieldError] = useState("")

  const t = {
    title: locale === "uz" ? "Xush kelibsiz" : "Добро пожаловать",
    subtitle: locale === "uz"
      ? "Hisobingizga kirish uchun ma\u2018lumotlaringizni kiriting"
      : "Войдите в свою учётную запись",
    loginTab: locale === "uz" ? "Login" : "Логин",
    phoneTab: locale === "uz" ? "Telefon" : "Телефон",
    tokenTab: "Token",
    loginLabel: locale === "uz" ? "Login" : "Логин",
    loginPlaceholder: locale === "uz" ? "salimov" : "salimov",
    passwordLabel: locale === "uz" ? "Parol" : "Пароль",
    passwordPlaceholder: locale === "uz" ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    phonePlaceholder: "+998 90 123 45 67",
    tokenPlaceholder: locale === "uz" ? "Telegram botdan olingan token" : "Токен из Telegram бота",
    enterBtn: locale === "uz" ? "Tizimga kirish" : "Войти в систему",
    checking: locale === "uz" ? "Tekshirilmoqda..." : "Проверка...",
    loginRequired: locale === "uz" ? "Login kiriting" : "Введите логин",
    phoneRequired: locale === "uz" ? "Telefon raqam kiriting" : "Введите номер",
    passwordRequired: locale === "uz" ? "Parol kiriting" : "Введите пароль",
    tokenRequired: locale === "uz" ? "Token kiriting" : "Введите токен",
    tokenShort: locale === "uz" ? "Token juda qisqa" : "Токен слишком короткий",
    helpLogin: locale === "uz" ? "Admin bergan login va parol" : "Логин и пароль от администратора",
    helpPhone: locale === "uz" ? "Ro\u2018yxatdan o\u2018tgan telefon raqam" : "Зарегистрированный номер",
    helpToken: locale === "uz" ? "Telegram botda /token buyrug\u2018ini yuboring" : "Отправьте /token в Telegram боте",
    tagline: locale === "uz" ? "Zamonaviy savdo boshqaruvi" : "Современное управление продажами",
    headline: locale === "uz"
      ? "Biznesingizni\u00a0aqlli boshqaring"
      : "Умное\u00a0управление\u00a0бизнесом",
    sub: locale === "uz"
      ? "Mijozlar, ombor, savdolar, kassa va hisobotlar \u2014 barchasi yagona AI-quvvatlangan platformada."
      : "Клиенты, склад, продажи, касса и отчёты \u2014 всё в единой AI-платформе.",
    poweredBy: locale === "uz" ? "O\u2018zbekiston bo\u2018yicha 1 200+ biznes ishonadi" : "Более 1 200 бизнесов в Узбекистане",
    secure: locale === "uz" ? "Ma\u2018lumotlar SSL va JWT bilan himoyalangan" : "Данные защищены SSL и JWT",
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError("")
    clearError()

    if (method === "login") {
      if (!login.trim()) { setFieldError(t.loginRequired); return }
      if (!parol.trim()) { setFieldError(t.passwordRequired); return }
      await loginWithCredentials({ login: login.trim(), parol: parol.trim() })
    } else if (method === "telefon") {
      if (!telefon.trim()) { setFieldError(t.phoneRequired); return }
      if (!telParol.trim()) { setFieldError(t.passwordRequired); return }
      await loginWithCredentials({ telefon: telefon.trim(), parol: telParol.trim() })
    } else {
      const trimmed = token.trim()
      if (!trimmed) { setFieldError(t.tokenRequired); return }
      if (trimmed.length < 10) { setFieldError(t.tokenShort); return }
      await loginWithToken(trimmed)
    }
  }

  function switchMethod(m: LoginMethod) {
    setMethod(m)
    setFieldError("")
    clearError()
  }

  const stats = [
    { label: translations.dashboard.stat1Label[locale], value: "1 200+", icon: Users, color: "text-sky-400" },
    { label: translations.dashboard.stat2Label[locale], value: "69M so\u2018m", icon: TrendingUp, color: "text-emerald-400" },
    { label: translations.dashboard.stat3Label[locale], value: "340+", icon: Package, color: "text-violet-400" },
    { label: translations.dashboard.stat4Label[locale], value: "8 500+", icon: ShieldCheck, color: "text-amber-400" },
  ]

  const methods: { key: LoginMethod; label: string; icon: React.ElementType }[] = [
    { key: "login", label: t.loginTab, icon: User },
    { key: "telefon", label: t.phoneTab, icon: Phone },
    { key: "token", label: t.tokenTab, icon: KeyRound },
  ]

  const hasError = fieldError || authError

  return (
    <div className="min-h-screen bg-background flex">
      {/* ═══ LEFT HERO PANEL — gradient, vibrant, investor-grade ═══ */}
      <div
        className="hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col justify-between p-14"
        style={{
          background:
            "radial-gradient(at 0% 0%, oklch(0.38 0.2 260) 0px, transparent 50%), " +
            "radial-gradient(at 100% 100%, oklch(0.4 0.2 170) 0px, transparent 50%), " +
            "linear-gradient(135deg, oklch(0.2 0.04 260) 0%, oklch(0.16 0.03 250) 100%)",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Glowing orb accents */}
        <div
          aria-hidden
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "oklch(0.7 0.17 237)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "oklch(0.72 0.17 156)" }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.17 237), oklch(0.72 0.17 156))",
                boxShadow: "0 8px 32px oklch(0.72 0.17 237 / 0.4)",
              }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">SavdoAI</span>
              <span className="block text-[10px] text-white/40 -mt-0.5 font-medium tracking-[0.2em] uppercase">
                {t.tagline}
              </span>
            </div>
          </div>
          <div className="relative z-10 text-white/70">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Main message */}
        <div className="relative space-y-10 max-w-xl">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI-powered \u00b7 v25.7</span>
            </div>
            <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.05] tracking-tight text-balance">
              {t.headline}
            </h2>
            <p className="text-white/60 leading-relaxed text-lg text-pretty max-w-lg">
              {t.sub}
            </p>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded-lg bg-white/10", color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-white leading-none tabular-nums">{value}</p>
                    <p className="text-xs text-white/50 mt-1.5 truncate">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div className="flex items-center gap-2 text-sm text-white/40">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.secure}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between text-xs text-white/30">
          <span>&copy; 2026 SavdoAI. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.poweredBy}
          </span>
        </div>
      </div>

      {/* ═══ RIGHT FORM PANEL ═══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile header */}
        <div className="w-full max-w-sm mb-10 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shadow-md"
                style={{ background: "linear-gradient(135deg, oklch(0.64 0.17 237), oklch(0.72 0.17 156))" }}
              >
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground tracking-tight">SavdoAI</span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="w-full max-w-sm space-y-7">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{t.subtitle}</p>
          </div>

          {/* Method switcher — segmented */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {methods.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMethod(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all",
                  method === key
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {method === "login" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="login" className="text-xs font-medium">
                    {t.loginLabel}
                  </Label>
                  <Input
                    id="login"
                    type="text"
                    placeholder={t.loginPlaceholder}
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    className={cn(
                      "h-11 text-sm transition-colors",
                      hasError && "border-destructive bg-destructive/5 focus-visible:ring-destructive/50",
                    )}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parol" className="text-xs font-medium">
                    {t.passwordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="parol"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.passwordPlaceholder}
                      value={parol}
                      onChange={e => setParol(e.target.value)}
                      className={cn(
                        "h-11 pr-10 text-sm transition-colors",
                        hasError && "border-destructive bg-destructive/5 focus-visible:ring-destructive/50",
                      )}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t.helpLogin}</p>
              </>
            )}

            {method === "telefon" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="telefon" className="text-xs font-medium">
                    {t.phoneTab}
                  </Label>
                  <Input
                    id="telefon"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={telefon}
                    onChange={e => setTelefon(e.target.value)}
                    className={cn(
                      "h-11 text-sm transition-colors",
                      hasError && "border-destructive bg-destructive/5 focus-visible:ring-destructive/50",
                    )}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telParol" className="text-xs font-medium">
                    {t.passwordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="telParol"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.passwordPlaceholder}
                      value={telParol}
                      onChange={e => setTelParol(e.target.value)}
                      className={cn(
                        "h-11 pr-10 text-sm transition-colors",
                        hasError && "border-destructive bg-destructive/5 focus-visible:ring-destructive/50",
                      )}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t.helpPhone}</p>
              </>
            )}

            {method === "token" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="token" className="text-xs font-medium">
                    API Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="token"
                      type={showToken ? "text" : "password"}
                      placeholder={t.tokenPlaceholder}
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      className={cn(
                        "h-11 pr-10 font-mono text-xs transition-colors",
                        hasError && "border-destructive bg-destructive/5 focus-visible:ring-destructive/50",
                      )}
                      autoComplete="off"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="toggle token visibility"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t.helpToken}</p>
              </>
            )}

            {(fieldError || authError) && (
              <div className="flex items-start gap-2 text-xs text-destructive rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <div className="w-1 h-1 rounded-full bg-destructive mt-1.5 shrink-0" />
                <span>{fieldError || authError}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold shadow-sm group"
              disabled={authLoading}
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.checking}
                </>
              ) : (
                <>
                  {t.enterBtn}
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer trust */}
          <div className="pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.secure}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
