"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageSquare, Mail, Smartphone, Shield, Save } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface NotifSetting {
  id: string
  label: string
  desc: string
  telegram: boolean
  email: boolean
  sms: boolean
  push: boolean
}

const DEFAULT: NotifSetting[] = [
  { id: "new_order",     label: "Yangi buyurtma",         desc: "Mijozdan yangi buyurtma kelganda",      telegram: true,  email: false, sms: false, push: true },
  { id: "low_stock",     label: "Zaxira kam",             desc: "Tovar zaxirasi minimaldan kam bo'lsa",  telegram: true,  email: true,  sms: false, push: true },
  { id: "out_of_stock",  label: "Tovar tugadi",           desc: "Tovar zaxirasi 0 bo'lsa",               telegram: true,  email: true,  sms: true,  push: true },
  { id: "debt_overdue",  label: "Qarz muddati o'tdi",     desc: "Mijoz qarz muddati o'tib ketganda",     telegram: true,  email: true,  sms: false, push: true },
  { id: "payment_in",    label: "To'lov keldi",           desc: "Mijozdan to'lov qabul qilinganda",      telegram: true,  email: false, sms: false, push: true },
  { id: "agent_offline", label: "Agent offline",          desc: "Agent uzoq vaqt offline bo'lsa",        telegram: true,  email: false, sms: false, push: false },
  { id: "report_ready",  label: "Hisobot tayyor",         desc: "Kunlik/oylik hisobot tayyor bo'lganda", telegram: false, email: true,  sms: false, push: false },
]

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT)

  const toggle = (id: string, channel: keyof NotifSetting) => {
    setSettings(s => s.map(x => x.id === id ? { ...x, [channel]: !x[channel] } : x))
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Bell}
          gradient="amber"
          title="Bildirishnoma sozlamalari"
          subtitle="Qanday hodisalar uchun va qaysi kanallar orqali xabar olish"
        />
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-1" /> Saqlash
          </Button>
        </div>

        {/* Channels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: MessageSquare, label: "Telegram", color: "blue" },
            { icon: Mail, label: "Email", color: "purple" },
            { icon: Smartphone, label: "SMS", color: "emerald" },
            { icon: Bell, label: "Push", color: "orange" },
          ].map((c, i) => (
            <div key={i} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 text-center">
              <c.icon className={`w-8 h-8 mx-auto text-${c.color}-600 mb-2`} />
              <div className="font-bold">{c.label}</div>
              <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs mt-1">Faol</Badge>
            </div>
          ))}
        </div>

        {/* Settings Table */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-bold">Hodisa</th>
                <th className="text-center p-4 font-bold">📨 Telegram</th>
                <th className="text-center p-4 font-bold">📧 Email</th>
                <th className="text-center p-4 font-bold">📱 SMS</th>
                <th className="text-center p-4 font-bold">🔔 Push</th>
              </tr>
            </thead>
            <tbody>
              {settings.map(s => (
                <tr key={s.id} className="border-b hover:bg-muted/50 dark:hover:bg-muted">
                  <td className="p-4">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" checked={s.telegram} onChange={() => toggle(s.id, "telegram")} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" checked={s.email} onChange={() => toggle(s.id, "email")} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" checked={s.sms} onChange={() => toggle(s.id, "sms")} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="text-center p-4">
                    <input type="checkbox" checked={s.push} onChange={() => toggle(s.id, "push")} className="w-4 h-4 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <div className="font-bold mb-1">Bildirishnomalar haqida</div>
              <div>SMS to'lovli xizmat (~70 so'm/SMS). Telegram va Push bepul. Email bepul (1000 ta/kun).</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
