"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Eye, EyeOff, Loader2, Send,
  ShieldCheck, TrendingUp, Users, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const L = translations.login

  const [showAdminForm, setShowAdminForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = L.emailRequired[locale]
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = L.emailInvalid[locale]
    if (!password) e.password = L.passwordRequired[locale]
    else if (password.length < 6) e.password = L.passwordShort[locale]
    return e
  }

  async function handleTelegramLogin() {
    setTelegramLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    router.push("/dashboard")
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    router.push("/dashboard")
  }

  const stats = [
    { label: L.stat1Label[locale], value: "1 200+",  icon: Users },
    { label: L.stat2Label[locale], value: "69M so'm", icon: TrendingUp },
    { label: L.stat3Label[locale], value: "340+",    icon: Package },
    { label: L.stat4Label[locale], value: "8 500+",  icon: ShieldCheck },
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
          {L.copyright[locale]}
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
            <h1 className="text-2xl font-bold text-foreground">{L.title[locale]}</h1>
            <p className="text-muted-foreground text-sm mt-1.5">{L.subtitle[locale]}</p>
          </div>

          {/* Primary CTA — Telegram */}
          <div className="space-y-3">
            <Button
              className="w-full h-11 gap-3 text-sm font-semibold shadow-sm"
              onClick={handleTelegramLogin}
              disabled={telegramLoading || loading}
            >
              {telegramLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {telegramLoading
                ? (locale === "uz" ? "Ulanyapti..." : "Подключение...")
                : L.telegramBtn[locale]
              }
            </Button>
            <p className="text-center text-xs text-muted-foreground">{L.telegramNote[locale]}</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{L.adminDivider[locale]}</span>
            <Separator className="flex-1" />
          </div>

          {/* Secondary — Admin form (collapsed by default) */}
          {!showAdminForm ? (
            <Button
              variant="outline"
              className="w-full h-10 text-sm text-muted-foreground"
              onClick={() => setShowAdminForm(true)}
            >
              {locale === "uz" ? "Admin sifatida kirish" : "Войти как администратор"}
            </Button>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{L.email[locale]}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={locale === "uz" ? "admin@savdoai.uz" : "admin@savdoai.ru"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={cn("h-10", errors.email && "border-destructive")}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{L.password[locale]}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={cn("h-10 pr-10", errors.password && "border-destructive")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full h-10" disabled={loading || telegramLoading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? L.signingIn[locale] : L.signinBtn[locale]}
              </Button>

              <p className="text-center text-xs text-muted-foreground">{L.demoNote[locale]}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
