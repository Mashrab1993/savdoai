"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageLoading } from "@/components/ui/loading"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import { useLocale } from "@/lib/locale-context"
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
import { User, Building2, Bell, Shield, Save, Camera, CheckCircle2 } from "lucide-react"
import { useTheme } from "next-themes"

// Bilingual labels for Settings
const S = {
  title:         { uz: "Sozlamalar",                    ru: "Настройки" },
  // Tabs
  tabProfile:    { uz: "Profil",                        ru: "Профиль" },
  tabCompany:    { uz: "Kompaniya",                     ru: "Компания" },
  tabNotif:      { uz: "Bildirishnomalar",              ru: "Уведомления" },
  tabSecurity:   { uz: "Xavfsizlik",                    ru: "Безопасность" },
  // Profile
  profileTitle:  { uz: "Profil sozlamalari",            ru: "Настройки профиля" },
  profileSub:    { uz: "Shaxsiy ma'lumotlaringizni yangilang", ru: "Обновите личную информацию" },
  changePhoto:   { uz: "Rasmni o'zgartirish",           ru: "Изменить фото" },
  photoHint:     { uz: "JPG, PNG — 5 MBgacha",         ru: "JPG, PNG — до 5 МБ" },
  firstName:     { uz: "Ism",                           ru: "Имя" },
  lastName:      { uz: "Familiya",                      ru: "Фамилия" },
  email:         { uz: "Email",                         ru: "Email" },
  phone:         { uz: "Telefon",                       ru: "Телефон" },
  role:          { uz: "Lavozim",                       ru: "Должность" },
  saveChanges:   { uz: "O'zgarishlarni saqlash",        ru: "Сохранить изменения" },
  saved:         { uz: "Saqlandi!",                     ru: "Сохранено!" },
  // Company
  companyTitle:  { uz: "Kompaniya sozlamalari",         ru: "Настройки компании" },
  companySub:    { uz: "Biznes ma'lumotlarini sozlang", ru: "Настройте данные вашего бизнеса" },
  companyName:   { uz: "Kompaniya nomi",                ru: "Название компании" },
  website:       { uz: "Veb-sayt",                      ru: "Веб-сайт" },
  industry:      { uz: "Soha",                          ru: "Отрасль" },
  region:        { uz: "Hudud",                         ru: "Регион" },
  currency:      { uz: "Valyuta",                       ru: "Валюта" },
  taxRate:       { uz: "Standart soliq stavkasi (%)",   ru: "Ставка налога по умолчанию (%)" },
  appearance:    { uz: "Ko'rinish",                     ru: "Внешний вид" },
  appearanceSub: { uz: "Yorug' yoki qorong'u rejimni tanlang", ru: "Выберите светлую или тёмную тему" },
  themeLight:    { uz: "Yorug'",                        ru: "Светлая" },
  themeDark:     { uz: "Qorong'u",                      ru: "Тёмная" },
  themeSystem:   { uz: "Tizim",                         ru: "Системная" },
  // Notifications
  notifTitle:    { uz: "Bildirishnoma sozlamalari",     ru: "Настройки уведомлений" },
  notifSub:      { uz: "Xabarlar qanday va qachon kelishini boshqaring", ru: "Управляйте тем, как и когда вы получаете уведомления" },
  emailNotif:    { uz: "Email bildirishnomalar",        ru: "Email-уведомления" },
  pushNotif:     { uz: "Push bildirishnomalar",         ru: "Push-уведомления" },
  notifInvoice:  { uz: "Yangi hisob-fakturalar",        ru: "Новые счета" },
  notifInvoiceSub: { uz: "Yangi hisob-faktura yaratilganda xabar oling", ru: "Получать уведомление при создании нового счёта" },
  notifPayment:  { uz: "To'lovlar qabul qilindi",       ru: "Платежи получены" },
  notifPaymentSub: { uz: "To'lov qayd etilganda xabar oling", ru: "Получать уведомление при регистрации платежа" },
  notifOverdue:  { uz: "Muddati o'tgan ogohlantirishlar", ru: "Уведомления о просрочке" },
  notifOverdueSub: { uz: "Muddati o'tgan hisob-fakturalar haqida xabar oling", ru: "Уведомления о просроченных счетах" },
  notifReports:  { uz: "Haftalik hisobotlar",           ru: "Еженедельные отчёты" },
  notifReportsSub: { uz: "Haftalik faoliyat xulosasini oling", ru: "Получать еженедельную сводку активности" },
  notifAlerts:   { uz: "Muhim ogohlantirishlar",        ru: "Критические оповещения" },
  notifAlertsSub: { uz: "Muddati o'tgan va ombor ogohlantirishlari", ru: "Просрочки и складские оповещения" },
  notifPushPay:  { uz: "To'lov yangilanishlari",        ru: "Обновления платежей" },
  notifPushPaySub: { uz: "Real vaqtdagi to'lov bildirishnomalari", ru: "Уведомления о платежах в реальном времени" },
  savePrefs:     { uz: "Sozlamalarni saqlash",          ru: "Сохранить настройки" },
  // Security
  secTitle:      { uz: "Xavfsizlik sozlamalari",        ru: "Настройки безопасности" },
  secSub:        { uz: "Parol va hisob xavfsizligini boshqaring", ru: "Управляйте паролем и безопасностью аккаунта" },
  currentPwd:    { uz: "Joriy parol",                   ru: "Текущий пароль" },
  newPwd:        { uz: "Yangi parol",                   ru: "Новый пароль" },
  confirmPwd:    { uz: "Yangi parolni tasdiqlang",      ru: "Подтвердите новый пароль" },
  twoFactor:     { uz: "Ikki bosqichli tasdiqlash",     ru: "Двухфакторная аутентификация" },
  twoFactorSub:  { uz: "Xavfsizlikning qo'shimcha qatlamini qo'shing", ru: "Добавьте дополнительный уровень защиты" },
  sessionTimeout: { uz: "Sessiya muddati",              ru: "Тайм-аут сессии" },
  sessionTimeoutSub: { uz: "Harakatsizlikdan so'ng avtomatik chiqish", ru: "Автовыход после бездействия" },
  min15:         { uz: "15 daqiqa",                     ru: "15 минут" },
  min30:         { uz: "30 daqiqa",                     ru: "30 минут" },
  hour1:         { uz: "1 soat",                        ru: "1 час" },
  never:         { uz: "Hech qachon",                   ru: "Никогда" },
  updatePwd:     { uz: "Parolni yangilash",             ru: "Обновить пароль" },
}

const industries = {
  uz: ["Texnologiya", "Moliya", "Sog'liqni saqlash", "Chakana savdo", "Ishlab chiqarish", "Boshqa"],
  ru: ["Технологии", "Финансы", "Здравоохранение", "Розничная торговля", "Производство", "Другое"],
}

const regions = {
  uz: ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan", "Farg'ona", "Boshqa"],
  ru: ["Ташкент", "Самарканд", "Бухара", "Андижан", "Наманган", "Фергана", "Другой"],
}

export default function SettingsPage() {
  const { locale } = useLocale()
  const { theme, setTheme } = useTheme()
  const { data: meData, loading: meLoading } = useApi(() => api.getMe(), [])
  const [saved, setSaved] = useState(false)

  const [profile, setProfile] = useState({
    firstName: "Alisher",
    lastName: "Ergashev",
    email: "alisher@savdoai.uz",
    phone: "+998 90 100-0001",
    role: "Administrator",
  })

  useEffect(() => {
    if (meData && typeof meData === "object" && meData !== null) {
      const m = meData as Record<string, unknown>
      if (m.ism || m.email) setProfile(prev => ({
        ...prev,
        firstName: String(m.ism ?? m.first_name ?? prev.firstName).split(" ")[0] || prev.firstName,
        lastName: String(m.familiya ?? m.last_name ?? prev.lastName).split(" ").slice(1).join(" ") || prev.lastName,
        email: String(m.email ?? prev.email),
        phone: String(m.telefon ?? m.phone ?? prev.phone),
        role: String(m.lavozim ?? m.role ?? prev.role),
      }))
    }
  }, [meData])

  const [company, setCompany] = useState({
    name: "SavdoAI MChJ",
    website: "https://savdoai.uz",
    industry: industries[locale][0],
    region: regions[locale][0],
    currency: "UZS",
    taxRate: "12",
  })

  const [notif, setNotif] = useState({
    emailInvoices: true,
    emailPayments: true,
    emailOverdue: true,
    emailReports: false,
    pushAlerts: true,
    pushPayments: false,
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const SaveBtn = ({ label }: { label: string }) => (
    <Button onClick={handleSave} className="gap-2">
      {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? S.saved[locale] : label}
    </Button>
  )

  if (meLoading) return <AdminLayout title={S.title[locale]}><PageLoading /></AdminLayout>

  return (
    <AdminLayout title={S.title[locale]}>
      <div className="max-w-3xl space-y-5">
        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile"    className="gap-2"><User className="w-3.5 h-3.5" />{S.tabProfile[locale]}</TabsTrigger>
            <TabsTrigger value="company"    className="gap-2"><Building2 className="w-3.5 h-3.5" />{S.tabCompany[locale]}</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-3.5 h-3.5" />{S.tabNotif[locale]}</TabsTrigger>
            <TabsTrigger value="security"   className="gap-2"><Shield className="w-3.5 h-3.5" />{S.tabSecurity[locale]}</TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="profile">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">{S.profileTitle[locale]}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{S.profileSub[locale]}</p>
              </div>

              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground font-semibold">AE</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="w-3.5 h-3.5" /> {S.changePhoto[locale]}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5">{S.photoHint[locale]}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{S.firstName[locale]}</Label>
                  <Input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.lastName[locale]}</Label>
                  <Input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.email[locale]}</Label>
                  <Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.phone[locale]}</Label>
                  <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>{S.role[locale]}</Label>
                  <Input value={profile.role} disabled className="opacity-60" />
                </div>
              </div>

              <SaveBtn label={S.saveChanges[locale]} />
            </div>
          </TabsContent>

          {/* ── Company Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="company">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">{S.companyTitle[locale]}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{S.companySub[locale]}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>{S.companyName[locale]}</Label>
                  <Input value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.website[locale]}</Label>
                  <Input value={company.website} onChange={e => setCompany(p => ({ ...p, website: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.industry[locale]}</Label>
                  <Select value={company.industry} onValueChange={v => setCompany(p => ({ ...p, industry: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {industries[locale].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{S.region[locale]}</Label>
                  <Select value={company.region} onValueChange={v => setCompany(p => ({ ...p, region: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {regions[locale].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{S.currency[locale]}</Label>
                  <Select value={company.currency} onValueChange={v => setCompany(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UZS">UZS — so'm</SelectItem>
                      <SelectItem value="USD">USD — dollar</SelectItem>
                      <SelectItem value="RUB">RUB — rubl</SelectItem>
                      <SelectItem value="EUR">EUR — yevro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>{S.taxRate[locale]}</Label>
                  <Input
                    type="number" value={company.taxRate}
                    onChange={e => setCompany(p => ({ ...p, taxRate: e.target.value }))}
                    className="max-w-32"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{S.appearance[locale]}</Label>
                <p className="text-xs text-muted-foreground">{S.appearanceSub[locale]}</p>
                <Select value={theme || "light"} onValueChange={setTheme}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{S.themeLight[locale]}</SelectItem>
                    <SelectItem value="dark">{S.themeDark[locale]}</SelectItem>
                    <SelectItem value="system">{S.themeSystem[locale]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <SaveBtn label={S.saveChanges[locale]} />
            </div>
          </TabsContent>

          {/* ── Notifications Tab ────────────────────────────────────────────── */}
          <TabsContent value="notifications">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">{S.notifTitle[locale]}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{S.notifSub[locale]}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">{S.emailNotif[locale]}</h4>
                {([
                  { key: "emailInvoices", label: S.notifInvoice[locale],  desc: S.notifInvoiceSub[locale] },
                  { key: "emailPayments", label: S.notifPayment[locale],   desc: S.notifPaymentSub[locale] },
                  { key: "emailOverdue",  label: S.notifOverdue[locale],   desc: S.notifOverdueSub[locale] },
                  { key: "emailReports",  label: S.notifReports[locale],   desc: S.notifReportsSub[locale] },
                ] as const).map(n => (
                  <div key={n.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch
                      checked={notif[n.key]}
                      onCheckedChange={v => setNotif(p => ({ ...p, [n.key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">{S.pushNotif[locale]}</h4>
                {([
                  { key: "pushAlerts",   label: S.notifAlerts[locale],   desc: S.notifAlertsSub[locale] },
                  { key: "pushPayments", label: S.notifPushPay[locale],  desc: S.notifPushPaySub[locale] },
                ] as const).map(n => (
                  <div key={n.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch
                      checked={notif[n.key]}
                      onCheckedChange={v => setNotif(p => ({ ...p, [n.key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <SaveBtn label={S.savePrefs[locale]} />
            </div>
          </TabsContent>

          {/* ── Security Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="security">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">{S.secTitle[locale]}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{S.secSub[locale]}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{S.currentPwd[locale]}</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.newPwd[locale]}</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>{S.confirmPwd[locale]}</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{S.twoFactor[locale]}</p>
                    <p className="text-xs text-muted-foreground">{S.twoFactorSub[locale]}</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{S.sessionTimeout[locale]}</p>
                    <p className="text-xs text-muted-foreground">{S.sessionTimeoutSub[locale]}</p>
                  </div>
                  <Select defaultValue="30min">
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">{S.min15[locale]}</SelectItem>
                      <SelectItem value="30min">{S.min30[locale]}</SelectItem>
                      <SelectItem value="1hr">{S.hour1[locale]}</SelectItem>
                      <SelectItem value="never">{S.never[locale]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SaveBtn label={S.updatePwd[locale]} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
