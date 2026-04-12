"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Building2, Bell, Shield, Camera, Lock, CheckCircle2, MonitorSmartphone, Settings } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const S = {
  title:              { uz: "Sozlamalar",                            ru: "Настройки" },
  tabProfile:         { uz: "Profil",                                ru: "Профиль" },
  tabCompany:         { uz: "Ko'rinish",                             ru: "Внешний вид" },
  tabNotif:           { uz: "Bildirishnomalar",                      ru: "Уведомления" },
  tabSecurity:        { uz: "Xavfsizlik",                            ru: "Безопасность" },

  // Profile
  profileTitle:       { uz: "Hisob ma'lumotlari",                   ru: "Данные аккаунта" },
  profileSub:         { uz: "Serverdan olingan, faqat o'qish uchun", ru: "Получено с сервера, только для просмотра" },
  changePhoto:        { uz: "Rasm yuklash",                          ru: "Загрузить фото" },
  photoHint:          { uz: "JPG, PNG — tez orada",                  ru: "JPG, PNG — скоро" },
  username:           { uz: "Login",                                 ru: "Логин" },
  fullName:           { uz: "To'liq ism",                            ru: "Полное имя" },
  email:              { uz: "Email",                                  ru: "Email" },
  role:               { uz: "Lavozim",                               ru: "Роль" },
  readOnlyNote:       { uz: "Profil ma'lumotlarini o'zgartirish uchun tizim ma'muri bilan bog'laning.", ru: "Для изменения данных профиля обратитесь к администратору системы." },

  // Appearance
  appearanceTitle:    { uz: "Ko'rinish sozlamalari",                 ru: "Настройки внешнего вида" },
  appearanceSub:      { uz: "Ushbu sozlamalar faqat bu qurilmada saqlanadi", ru: "Эти настройки сохраняются только на этом устройстве" },
  themeLabel:         { uz: "Interfeys rejimi",                      ru: "Тема интерфейса" },
  themeLight:         { uz: "Yorug'",                                ru: "Светлая" },
  themeDark:          { uz: "Qorong'u",                              ru: "Тёмная" },
  themeSystem:        { uz: "Tizim",                                  ru: "Системная" },

  // Notifications
  notifTitle:         { uz: "Bildirishnoma sozlamalari",             ru: "Настройки уведомлений" },
  notifSub:           { uz: "Mahalliy afzalliklar sifatida saqlanadi", ru: "Сохраняются как локальные предпочтения" },
  notifNote:          { uz: "Bildirishnoma xizmati ulangandan so'ng bu sozlamalar serverda saqlanadi. Hozircha faqat shu qurilmada.", ru: "После подключения службы уведомлений настройки будут синхронизированы с сервером. Пока они хранятся только на этом устройстве." },
  emailSection:       { uz: "Email bildirishnomalari",               ru: "Email-уведомления" },
  pushSection:        { uz: "Push bildirishnomalari",                ru: "Push-уведомления" },
  notifInvoice:       { uz: "Yangi faktura",                         ru: "Новый счёт" },
  notifInvoiceSub:    { uz: "Yangi faktura yaratilganda",            ru: "При создании нового счёта" },
  notifPayment:       { uz: "To'lov qabul qilindi",                 ru: "Платёж получен" },
  notifPaymentSub:    { uz: "To'lov qayd etilganda",                ru: "При регистрации платежа" },
  notifOverdue:       { uz: "Muddati o'tgan eslatmasi",             ru: "Уведомление о просрочке" },
  notifOverdueSub:    { uz: "Muddati o'tgan qarzdorliklar",         ru: "Просроченные долги" },
  notifReports:       { uz: "Haftalik xulosa",                       ru: "Еженедельная сводка" },
  notifReportsSub:    { uz: "Haftalik faoliyat hisoboti",            ru: "Отчёт о недельной активности" },
  notifAlerts:        { uz: "Kritik ogohlantirishlar",               ru: "Критические оповещения" },
  notifAlertsSub:     { uz: "Muddati o'tgan va ombor ogohlantirishlari", ru: "Просрочки и складские оповещения" },
  notifPushPay:       { uz: "To'lov yangilanishlari",               ru: "Обновления платежей" },
  notifPushPaySub:    { uz: "Real vaqtdagi to'lov bildiriahnomalari", ru: "Уведомления в реальном времени" },
  savePrefs:          { uz: "Sozlamalarni saqlash",                  ru: "Сохранить настройки" },
  savedLocal:         { uz: "Saqlandi",                              ru: "Сохранено" },

  // Security
  secTitle:           { uz: "Xavfsizlik sozlamalari",                ru: "Безопасность аккаунта" },
  secSub:             { uz: "Parol va kirish xavfsizligini boshqaring", ru: "Управляйте паролем и доступом" },
  secNote:            { uz: "Parolni o'zgartirish keyingi yangilanishda qo'shiladi. Hozircha tizim ma'muri orqali o'zgartirishingiz mumkin.", ru: "Смена пароля будет доступна в следующем обновлении. Сейчас обратитесь к администратору системы." },
  currentPwd:         { uz: "Joriy parol",                           ru: "Текущий пароль" },
  newPwd:             { uz: "Yangi parol",                           ru: "Новый пароль" },
  confirmPwd:         { uz: "Yangi parolni tasdiqlang",              ru: "Подтвердите новый пароль" },
  twoFactor:          { uz: "Ikki bosqichli tasdiqlash",             ru: "Двухфакторная аутентификация" },
  twoFactorSub:       { uz: "SMS yoki authenticator orqali",         ru: "Через SMS или authenticator" },
  sessionTimeout:     { uz: "Sessiya muddati",                       ru: "Тайм-аут сессии" },
  sessionTimeoutSub:  { uz: "Harakatsizlikdan keyin chiqish",        ru: "Выход после бездействия" },
  min15:              { uz: "15 daqiqa",                             ru: "15 минут" },
  min30:              { uz: "30 daqiqa",                             ru: "30 минут" },
  hour1:              { uz: "1 soat",                                ru: "1 час" },
  never:              { uz: "Hech qachon",                           ru: "Никогда" },
  updatePwd:          { uz: "Parolni yangilash",                     ru: "Обновить пароль" },
  comingSoon:         { uz: "Tez orada",                             ru: "Скоро" },
  deviceLocal:        { uz: "Qurilmada saqlanadi",                   ru: "На устройстве" },
  serverManaged:      { uz: "Server boshqaradi",                     ru: "Управляет сервер" },
  comingSoonBadge:    { uz: "Tez orada",                             ru: "Скоро" },
}

function initials(user: { ism?: string; full_name?: string; username?: string } | null): string {
  if (!user) return "?"
  const name = user.ism ?? user.full_name ?? user.username ?? "?"
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

function SectionBadge({ type }: { type: "server" | "local" | "soon" }) {
  const { locale } = useLocale()
  const configs = {
    server: { label: S.serverManaged[locale], color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    local:  { label: S.deviceLocal[locale],   color: "bg-secondary text-muted-foreground" },
    soon:   { label: S.comingSoonBadge[locale], color: "bg-secondary text-muted-foreground" },
  }
  const c = configs[type]
  return (
    <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide", c.color)}>
      {c.label}
    </span>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex items-center h-9 px-3 rounded-md border border-border bg-secondary/50 text-sm text-foreground font-medium">
        {value || <span className="text-muted-foreground italic">{" — "}</span>}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { locale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const [notif, setNotif] = useState({
    emailInvoices: true,
    emailPayments: true,
    emailOverdue: true,
    emailReports: false,
    pushAlerts: true,
    pushPayments: false,
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const [profileForm, setProfileForm] = useState({
    ism: user?.ism ?? "",
    telefon: user?.telefon ?? "",
    dokon_nomi: user?.dokon_nomi ?? "",
    manzil: "",
    inn: "",
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaveMsg, setProfileSaveMsg] = useState("")
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState("")

  async function saveProfile() {
    setProfileSaving(true)
    setProfileSaveMsg("")
    try {
      const { api } = await import("@/lib/api/client")
      await api.put("/api/v1/me", profileForm)
      setProfileSaveMsg(locale === "uz" ? "Saqlandi!" : "Сохранено!")
      setTimeout(() => setProfileSaveMsg(""), 3000)
    } catch {
      setProfileSaveMsg(locale === "uz" ? "Xato yuz berdi" : "Ошибка")
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePwdChange() {
    setPwdMsg("")
    if (pwdForm.newPwd.length < 4) {
      setPwdMsg(locale === "uz" ? "Kamida 4 belgi" : "Минимум 4 символа")
      return
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdMsg(locale === "uz" ? "Parollar mos kelmaydi" : "Пароли не совпадают")
      return
    }
    setPwdSaving(true)
    try {
      const { api } = await import("@/lib/api/client")
      await api.put("/api/v1/me/parol", {
        eski_parol: pwdForm.current,
        yangi_parol: pwdForm.newPwd,
      })
      setPwdMsg("✅ " + (locale === "uz" ? "Parol o'zgartirildi" : "Пароль изменён"))
      setPwdForm({ current: "", newPwd: "", confirm: "" })
    } catch {
      setPwdMsg(locale === "uz" ? "Xato — eski parol noto'g'ri" : "Ошибка — неверный старый пароль")
    } finally {
      setPwdSaving(false)
    }
  }

  function saveNotifPrefs() {
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2500)
  }

  return (
    <AdminLayout title={S.title[locale]}>
      <div className="max-w-2xl space-y-5">
        <PageHeader
          icon={Settings}
          gradient="blue"
          title={S.title[locale]}
          subtitle={locale === "uz" ? "Profil, ko'rinish, bildirishnoma va xavfsizlik" : "Профиль, внешний вид, уведомления и безопасность"}
        />
        <Tabs defaultValue="profile">
          <TabsList className="mb-5 h-9">
            <TabsTrigger value="profile" className="gap-1.5 text-xs">
              <User className="w-3.5 h-3.5" /> {S.tabProfile[locale]}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs">
              <MonitorSmartphone className="w-3.5 h-3.5" /> {S.tabCompany[locale]}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs">
              <Bell className="w-3.5 h-3.5" /> {S.tabNotif[locale]}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" /> {S.tabSecurity[locale]}
            </TabsTrigger>
          </TabsList>

          {/* ── Profile ── */}
          <TabsContent value="profile">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{S.profileTitle[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{S.profileSub[locale]}</p>
                </div>
                <SectionBadge type="server" />
              </div>

              <div className="p-6 space-y-6">
                {/* Avatar row */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarFallback className="text-base bg-primary text-primary-foreground font-bold">
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{profileForm.ism || user?.ism || "—"}</p>
                    <p className="text-xs text-muted-foreground">{profileForm.telefon || user?.telefon || "—"}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{S.username[locale]}</Label>
                    <ReadOnlyField label="" value={user?.username ?? ""} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{S.fullName[locale]}</Label>
                    <Input value={profileForm.ism} onChange={e => setProfileForm(f => ({...f, ism: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{S.email[locale]}</Label>
                    <Input value={profileForm.telefon} onChange={e => setProfileForm(f => ({...f, telefon: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{locale === "uz" ? "Do'kon nomi" : "Название магазина"}</Label>
                    <Input value={profileForm.dokon_nomi} onChange={e => setProfileForm(f => ({...f, dokon_nomi: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{locale === "uz" ? "Manzil" : "Адрес"}</Label>
                    <Input value={profileForm.manzil} onChange={e => setProfileForm(f => ({...f, manzil: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">INN</Label>
                    <Input value={profileForm.inn} onChange={e => setProfileForm(f => ({...f, inn: e.target.value}))} />
                  </div>
                </div>

                {profileSaveMsg && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {profileSaveMsg}
                  </p>
                )}

                <Button onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving
                    ? (locale === "uz" ? "Saqlanmoqda..." : "Сохранение...")
                    : (locale === "uz" ? "Profilni saqlash" : "Сохранить профиль")}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Appearance ── */}
          <TabsContent value="appearance">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{S.appearanceTitle[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{S.appearanceSub[locale]}</p>
                </div>
                <SectionBadge type="local" />
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{S.themeLabel[locale]}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["light", "dark", "system"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-colors",
                          theme === t
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-5 rounded border",
                          t === "light" ? "bg-card border-border" :
                          t === "dark"  ? "bg-slate-800 border-slate-700" :
                          "bg-gradient-to-r from-white to-slate-800 border-border"
                        )} />
                        {t === "light" ? S.themeLight[locale] : t === "dark" ? S.themeDark[locale] : S.themeSystem[locale]}
                        {theme === t && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Notifications ── */}
          <TabsContent value="notifications">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{S.notifTitle[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{S.notifSub[locale]}</p>
                </div>
                <SectionBadge type="local" />
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-muted-foreground bg-secondary/70 rounded-lg px-3 py-2.5">{S.notifNote[locale]}</p>

                {/* Email */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{S.emailSection[locale]}</p>
                  {([
                    { key: "emailInvoices", label: S.notifInvoice[locale], desc: S.notifInvoiceSub[locale] },
                    { key: "emailPayments", label: S.notifPayment[locale], desc: S.notifPaymentSub[locale] },
                    { key: "emailOverdue",  label: S.notifOverdue[locale], desc: S.notifOverdueSub[locale] },
                    { key: "emailReports",  label: S.notifReports[locale], desc: S.notifReportsSub[locale] },
                  ] as const).map(n => (
                    <div key={n.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                      <Switch
                        checked={notif[n.key]}
                        onCheckedChange={v => setNotif(p => ({ ...p, [n.key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Push */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{S.pushSection[locale]}</p>
                  {([
                    { key: "pushAlerts",   label: S.notifAlerts[locale],   desc: S.notifAlertsSub[locale] },
                    { key: "pushPayments", label: S.notifPushPay[locale],  desc: S.notifPushPaySub[locale] },
                  ] as const).map(n => (
                    <div key={n.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                      <Switch
                        checked={notif[n.key]}
                        onCheckedChange={v => setNotif(p => ({ ...p, [n.key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={saveNotifPrefs}
                  variant={notifSaved ? "secondary" : "default"}
                  size="sm"
                  className="gap-2"
                >
                  {notifSaved
                    ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {S.savedLocal[locale]}</>
                    : S.savePrefs[locale]
                  }
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Security ── */}
          <TabsContent value="security">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{S.secTitle[locale]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{S.secSub[locale]}</p>
                </div>
                <SectionBadge type="server" />
              </div>

              <div className="p-6 space-y-6">
                {/* Password change — working */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>{S.currentPwd[locale]}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" className="pl-9"
                             value={pwdForm.current}
                             onChange={e => setPwdForm(f => ({...f, current: e.target.value}))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{S.newPwd[locale]}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" className="pl-9"
                               value={pwdForm.newPwd}
                               onChange={e => setPwdForm(f => ({...f, newPwd: e.target.value}))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{S.confirmPwd[locale]}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" className="pl-9"
                               value={pwdForm.confirm}
                               onChange={e => setPwdForm(f => ({...f, confirm: e.target.value}))} />
                      </div>
                    </div>
                  </div>
                  {pwdMsg && (
                    <p className={`text-xs ${pwdMsg.includes("✅") ? "text-green-600" : "text-destructive"}`}>{pwdMsg}</p>
                  )}
                  <Button size="sm" className="gap-2" disabled={pwdSaving}
                          onClick={handlePwdChange}>
                    {pwdSaving ? (locale === "uz" ? "O'zgartirilmoqda..." : "Изменение...") : S.updatePwd[locale]}
                  </Button>
                </div>

                <Separator />

                {/* 2FA + session — visually present but clearly disabled */}
                <div className="space-y-4 opacity-50 pointer-events-none select-none" aria-hidden>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{S.twoFactor[locale]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{S.twoFactorSub[locale]}</p>
                    </div>
                    <Switch disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{S.sessionTimeout[locale]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{S.sessionTimeoutSub[locale]}</p>
                    </div>
                    <Select defaultValue="30min" disabled>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15min">{S.min15[locale]}</SelectItem>
                        <SelectItem value="30min">{S.min30[locale]}</SelectItem>
                        <SelectItem value="1hr">{S.hour1[locale]}</SelectItem>
                        <SelectItem value="never">{S.never[locale]}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
