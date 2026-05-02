"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Save, Bot, Users, Send, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const COMMANDS = [
  { cmd: "/start", description: "Botni ishga tushirish va menyu ko'rish", usage: 1240 },
  { cmd: "/dashboard", description: "Bugungi tushum, KPI", usage: 840 },
  { cmd: "/zakaz", description: "Yangi zakaz yaratish (ovoz orqali)", usage: 480 },
  { cmd: "/klient", description: "Klient qo'shish", usage: 124 },
  { cmd: "/qoldiq", description: "Sklad qoldiqni ko'rish", usage: 96 },
  { cmd: "/hisobot", description: "Oylik/haftalik hisobot", usage: 248 },
  { cmd: "/anomaliya", description: "AI anomaliyalarni ko'rish", usage: 64 },
  { cmd: "/help", description: "Yordam menyusi", usage: 184 },
]

const SUBSCRIBERS = [
  { id: 1, username: "@mashrab_savdo", name: "Mashrab Sayitqulov", role: "Admin", joinedAt: "2025-09-12", lastActive: "16:00", commandsUsed: 484 },
  { id: 2, username: "@nargiza_b", name: "Babadjanova Nargiza", role: "Agent", joinedAt: "2025-10-05", lastActive: "10:25", commandsUsed: 248 },
  { id: 3, username: "@boriev_m", name: "BORIEV MIRJALOL", role: "Agent", joinedAt: "2025-11-01", lastActive: "09:45", commandsUsed: 312 },
  { id: 4, username: "@davlat_uz", name: "ДАВЛАТ", role: "Agent", joinedAt: "2026-01-10", lastActive: "08:20", commandsUsed: 196 },
]

export default function IntegrationTelegramPage() {
  const [config, setConfig] = useState({
    botToken: "8021412345:AAH...••••••",
    botUsername: "@savdo_avtomatlashtirish_bot",
    webhookUrl: "https://api.savdoai.com/telegram/webhook",
    voiceEnabled: true,
    photoEnabled: true,
    notifEnabled: true,
  })

  const totalCmd = COMMANDS.reduce((s, c) => s + c.usage, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              Telegram bot integratsiya
            </h1>
            <p className="text-sm text-slate-500">{config.botUsername} · {SUBSCRIBERS.length} ta foydalanuvchi · {totalCmd.toLocaleString()} marta ishlatilgan</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <Bot className="w-10 h-10 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-emerald-700">BOT HOLATI</div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                ✓ Online
                <span className="text-base text-slate-600 font-normal">— {config.botUsername}</span>
              </h2>
              <p className="text-sm text-slate-600 mt-1">Telegram Bot API + Local API server (port 8081) · 2GB fayllar</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Bot konfiguratsiyasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Bot Token *</label>
              <Input value={config.botToken} className="font-mono" type="password" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Bot Username</label>
              <Input value={config.botUsername} className="font-mono" readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">Webhook URL</label>
              <Input value={config.webhookUrl} className="font-mono text-xs" readOnly />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setConfig({ ...config, voiceEnabled: !config.voiceEnabled })} className={`w-12 h-6 rounded-full relative ${config.voiceEnabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.voiceEnabled ? "translate-x-6" : ""}`} />
              </button>
              <span className="text-sm">🎤 Ovozli xabar (Gemini STT)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setConfig({ ...config, photoEnabled: !config.photoEnabled })} className={`w-12 h-6 rounded-full relative ${config.photoEnabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.photoEnabled ? "translate-x-6" : ""}`} />
              </button>
              <span className="text-sm">📷 Foto qabul qilish (AI Vision)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setConfig({ ...config, notifEnabled: !config.notifEnabled })} className={`w-12 h-6 rounded-full relative ${config.notifEnabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.notifEnabled ? "translate-x-6" : ""}`} />
              </button>
              <span className="text-sm">🔔 Bildirishnoma yuborish</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-violet-600" /> Buyruqlar (komandalar)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 text-left w-32">Komanda</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Tavsif</th>
                  <th className="border border-slate-300 py-2 px-3 text-right w-32">Qo'llanilishi</th>
                </tr>
              </thead>
              <tbody>
                {COMMANDS.map(c => (
                  <tr key={c.cmd} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 font-mono font-bold text-blue-700">{c.cmd}</td>
                    <td className="border border-slate-300 py-2 px-3">{c.description}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono">{c.usage.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Foydalanuvchilar (botga obuna)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 text-left">Username</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Ism</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Rol</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Qo'shildi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Oxirgi aktiv</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Komandalar</th>
                </tr>
              </thead>
              <tbody>
                {SUBSCRIBERS.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 font-mono text-blue-700">{s.username}</td>
                    <td className="border border-slate-300 py-2 px-3 font-bold">{s.name}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${s.role === "Admin" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{s.role}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono text-xs">{s.joinedAt}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono text-xs">{s.lastActive}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold">{s.commandsUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
