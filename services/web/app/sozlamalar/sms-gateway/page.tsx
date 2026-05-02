"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MessageSquare, Save, Send, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const PROVIDERS = [
  { id: "playmobile", name: "Play Mobile", logo: "🎮", price: 65, rating: 4.7 },
  { id: "eskiz", name: "Eskiz.uz", logo: "📨", price: 75, rating: 4.5 },
  { id: "sms_uz", name: "SMS.uz", logo: "📱", price: 80, rating: 4.3 },
  { id: "infobip", name: "Infobip (xalqaro)", logo: "🌍", price: 120, rating: 4.8 },
]

const MONTHLY_USAGE = [
  { month: "Yanvar", sent: 1240, cost: 80_600 },
  { month: "Fevral", sent: 1480, cost: 96_200 },
  { month: "Mart", sent: 1840, cost: 119_600 },
  { month: "Aprel", sent: 2240, cost: 145_600 },
  { month: "May (current)", sent: 480, cost: 31_200 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function SmsGatewayPage() {
  const [provider, setProvider] = useState("playmobile")
  const [config, setConfig] = useState({
    apiKey: "pm_live_a1b2c3d4e5...",
    sender: "Mashrab",
    balance: 184_000,
    testPhone: "+998 90 123 45 67",
    testMessage: "Test SMS — SavdoAI tizimidan",
  })

  const selected = PROVIDERS.find(p => p.id === provider)!
  const totalSent = MONTHLY_USAGE.reduce((s, m) => s + m.sent, 0)
  const totalCost = MONTHLY_USAGE.reduce((s, m) => s + m.cost, 0)
  const max = Math.max(...MONTHLY_USAGE.map(m => m.sent))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-emerald-600" />
              SMS provayder
            </h1>
            <p className="text-sm text-slate-500">{PROVIDERS.length} variant · joriy: {selected.name} · balans {fmt(config.balance)} so'm</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Provayder tanlash</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => setProvider(p.id)} className={`p-4 rounded-lg border-2 transition-all text-left ${provider === p.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{p.logo}</span>
                  <div className="flex-1">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-slate-500">⭐ {p.rating}</div>
                  </div>
                  {provider === p.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">{p.price}<span className="text-xs text-slate-500"> so'm/SMS</span></div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Sozlamalar — {selected.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">API Key *</label>
              <Input value={config.apiKey} onChange={e => setConfig({ ...config, apiKey: e.target.value })} className="font-mono" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Yuboruvchi (sender ID)</label>
              <Input value={config.sender} onChange={e => setConfig({ ...config, sender: e.target.value })} maxLength={11} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Joriy balans</label>
              <Input type="number" value={config.balance} readOnly className="font-mono" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Limit (kunlik max SMS)</label>
              <Input type="number" defaultValue={500} className="font-mono" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Test SMS yuborish</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Telefon raqam</label>
              <Input value={config.testPhone} onChange={e => setConfig({ ...config, testPhone: e.target.value })} className="font-mono" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">Xabar (160 simvol)</label>
              <Input value={config.testMessage} onChange={e => setConfig({ ...config, testMessage: e.target.value })} maxLength={160} />
              <div className="text-xs text-slate-500 mt-1">{config.testMessage.length} / 160 · narx: {selected.price} so'm</div>
            </div>
          </div>
          <Button className="mt-3 gap-2"><Send className="w-4 h-4" /> Test SMS yuborish</Button>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Send className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">5-oy SMS</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalSent)}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">5-oy xarajat</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalCost / 1000)}k</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700">O'rta SMS/oy</div>
            <div className="text-2xl font-bold mt-1">{fmt(Math.round(totalSent / MONTHLY_USAGE.length))}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-xs font-bold text-amber-700">Joriy balans</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(config.balance / 1000)}k</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Oylik dinamika</h2>
          <div className="flex items-end gap-3 h-40">
            {MONTHLY_USAGE.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-mono mb-1">{fmt(m.sent)}</span>
                  <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${(m.sent / max) * 95}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700">{m.month.slice(0, 3)}</span>
                <span className="text-xs text-slate-500 font-mono">{fmt(m.cost / 1000)}k</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
