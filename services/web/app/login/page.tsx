"use client"

import { useState } from "react"
import {
  Building2, Eye, EyeOff, Loader2,
  ShieldCheck, TrendingUp, Users, Package,
  KeyRound, User, Phone,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
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

  // Login+parol
  const [login, setLogin] = useState("")
  const [parol, setParol] = useState("")

  // Telefon+parol
  const [telefon, setTelefon] = useState("")
  const [telParol, setTelParol] = useState("")

  // Token
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)

  const [fieldError, setFieldError] = useState("")

  const t = {
    title: locale === "uz" ? "SavdoAI ga kirish" : "Вход в SavdoAI",
    subtitle: locale === "uz" ? "Do\u2018koningizni boshqaring" : "Управляйте магазином",
    loginTab: locale === "uz" ? "Login" : "Логин",
    phoneTab: locale === "uz" ? "Telefon" : "Телефон",
    tokenTab: locale === "uz" ? "Token" : "Токен",
    loginLabel: locale === "uz" ? "Login" : "Логин",
    loginPlaceholder: locale === "uz" ? "Masalan: salimov" : "Например: salimov",
    passwordLabel: locale === "uz" ? "Parol" : "Пароль",
    passwordPlaceholder: locale === "uz" ? "Parolingiz" : "Ваш пароль",
    phonePlaceholder: "+998 90 123 45 67",
    tokenPlaceholder: locale === "uz" ? "Telegram botdan olingan token" : "Токен из Telegram бота",
    enterBtn: locale === "uz" ? "Kirish" : "Войти",
    checking: locale === "uz" ? "Tekshirilmoqda..." : "Проверка...",
    loginRequired: locale === "uz" ? "Login kiriting" : "Введите логин",
    phoneRequired: locale === "uz" ? "Telefon raqam kiriting" : "Введите номер",
    passwordRequired: locale === "uz" ? "Parol kiriting" : "Введите пароль",
    tokenRequired: locale === "uz" ? "Token kiriting" : "Введите токен",
    tokenShort: locale === "uz" ? "Token juda qisqa" : "Токен слишком короткий",
    helpLogin: locale === "uz"
      ? "Admin bergan login va parolni kiriting"
      : "Введите логин и пароль от администратора",
    helpPhone: locale === "uz"
      ? "Ro\u2018yxatdan o\u2018tgan telefon raqam va parol"
      : "Зарегистрированный номер и пароль",
    helpToken: locale === "uz"
      ? "Telegram botda /token buyrug\u2018ini yuboring"
      : "Отправьте /token в Telegram боте",
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
    { label: translations.dashboard.stat1Label[locale], value: "1 200+", icon: Users },
    { label: translations.dashboard.stat2Label[locale], value: "69M so\u2018m", icon: TrendingUp },
    { label: translations.dashboard.stat3Label[locale], value: "340+", icon: Package },
    { label: translations.dashboard.stat4Label[locale], value: "8 500+", icon: ShieldCheck },
  ]

  const methods: { key: LoginMethod; label: string; icon: React.ElementType }[] = [
    { key: "login", label: t.loginTab, icon: User },
    { key: "telefon", label: t.phoneTab, icon: Phone },
    { key: "token", label: t.tokenTab, icon: KeyRound },
  ]

  const hasError = fieldError || authError

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--sidebar-foreground)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

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

        <div className="relative space-y-7">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight text-balance">
              {locale === "uz"
                ? "Biznesingizni yangi darajaga olib chiqing."
                : "Поднимите свой бизнес на новый уровень."}
            </h2>
            <p className="text-sidebar-foreground/55 leading-relaxed text-lg text-pretty max-w-md">
              {locale === "uz"
                ? "Mijozlar, ombor, savdolar, kassaxona va hisobotlar \u2014 barchasi yagona professional panelda."
                : "Клиенты, склад, продажи, касса и отчёты \u2014 всё в едином профессиональном интерфейсе."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-sidebar-accent/50 border border-sidebar-border rounded-2xl p-4 flex items-start gap-3">
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

          <div className="flex items-center gap-2 text-sm text-sidebar-foreground/40">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {locale === "uz"
                ? "Ma\u2018lumotlar xavfsiz. SSL va JWT himoyasi."
                : "Данные защищены. SSL и JWT шифрование."}
            </span>
          </div>
        </div>

        <p className="relative text-xs text-sidebar-foreground/30">
          &copy; 2025 SavdoAI. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
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

        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground text-sm mt-1.5">{t.subtitle}</p>
          </div>

          {/* Method switcher */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {methods.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMethod(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                  method === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
                  <Label htmlFor="login">{t.loginLabel}</Label>
                  <Input
                    id="login"
                    type="text"
                    placeholder={t.loginPlaceholder}
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    className={cn("h-10", hasError && "border-destructive")}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parol">{t.passwordLabel}</Label>
                  <div className="relative">
                    <Input
                      id="parol"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.passwordPlaceholder}
                      value={parol}
                      onChange={e => setParol(e.target.value)}
                      className={cn("h-10 pr-10", hasError && "border-destructive")}
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
                </div>
                <p className="text-xs text-muted-foreground">{t.helpLogin}</p>
              </>
            )}

            {method === "telefon" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="telefon">{t.phoneTab}</Label>
                  <Input
                    id="telefon"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={telefon}
                    onChange={e => setTelefon(e.target.value)}
                    className={cn("h-10", hasError && "border-destructive")}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telParol">{t.passwordLabel}</Label>
                  <div className="relative">
                    <Input
                      id="telParol"
                      type={showPassword ? "text" : "password"}
                      placeholder={t.passwordPlaceholder}
                      value={telParol}
                      onChange={e => setTelParol(e.target.value)}
                      className={cn("h-10 pr-10", hasError && "border-destructive")}
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
                </div>
                <p className="text-xs text-muted-foreground">{t.helpPhone}</p>
              </>
            )}

            {method === "token" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="token">API Token</Label>
                  <div className="relative">
                    <Input
                      id="token"
                      type={showToken ? "text" : "password"}
                      placeholder={t.tokenPlaceholder}
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      className={cn("h-10 pr-10 font-mono text-xs", hasError && "border-destructive")}
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
                </div>
                <p className="text-xs text-muted-foreground">{t.helpToken}</p>
              </>
            )}

            {(fieldError || authError) && (
              <p className="text-xs text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                {fieldError || authError}
              </p>
            )}

            <Button type="submit" className="w-full h-10" disabled={authLoading}>
              {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {authLoading ? t.checking : t.enterBtn}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
