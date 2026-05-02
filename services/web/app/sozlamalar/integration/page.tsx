"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Cable, Settings, RefreshCw, AlertCircle, CheckCircle2, XCircle, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const PLATFORMS = [
  { id: 1, name: "Telegram Bot", desc: "Voice + komanda + mini app", logo: "🤖", color: "blue", connected: true, lastSync: "Hozir", orders: 142, sum: 18_400_000 },
  { id: 2, name: "Uzum Market", desc: "Marketplace integratsiya", logo: "🛒", color: "violet", connected: true, lastSync: "5 daqiqa", orders: 84, sum: 12_400_000 },
  { id: 3, name: "Yandex Market", desc: "Yandex marketplace", logo: "🚚", color: "amber", connected: false, lastSync: "—", orders: 0, sum: 0 },
  { id: 4, name: "OLX biznes", desc: "Е'lon platformasi", logo: "📋", color: "lime", connected: true, lastSync: "1 soat", orders: 24, sum: 4_200_000 },
  { id: 5, name: "1C Buxgalteriya", desc: "Bukgalter sinxronizatsiya", logo: "💼", color: "emerald", connected: true, lastSync: "Bugun 09:00", orders: 0, sum: 0 },
  { id: 6, name: "Click API", desc: "To'lov tizimi", logo: "💳", color: "rose", connected: true, lastSync: "Hozir", orders: 824, sum: 142_800_000 },
  { id: 7, name: "Payme API", desc: "To'lov tizimi", logo: "💳", color: "violet", connected: true, lastSync: "Hozir", orders: 612, sum: 96_500_000 },
  { id: 8, name: "Google Sheets", desc: "Excel sync", logo: "📊", color: "cyan", connected: false, lastSync: "—", orders: 0, sum: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function IntegrationPage() {
  const [items, setItems] = useState(PLATFORMS)

  const toggleConnect = (id: number) => {
    setItems(items.map(p => p.id === id ? { ...p, connected: !p.connected, lastSync: p.connected ? "—" : "Hozir" } : p))
    const p = items.find(p => p.id === id)!
    toast.success(p.connected ? `${p.name} uzildi` : `${p.name} ulandi`)
  }

  const connectedCount = items.filter(p => p.connected).length
  const totalOrders = items.reduce((s, p) => s + p.orders, 0)
  const totalSum = items.reduce((s, p) => s + p.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Integratsiya</h1>
            <p className="text-base text-slate-500 mt-1">{items.length} platforma · {connectedCount} ulangan · {totalOrders} zakaz · {fmt(totalSum / 1_000_000)} M so'm</p>
          </div>
          <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> Sync</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi integratsiya</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Cable className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol integratsiya</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{connectedCount}/{items.length}</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <CheckCircle2 className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Online zakazlar (oy)</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{totalOrders}</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <Settings className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Total summa</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalSum / 1_000_000)} M</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(p => (
            <Card key={p.id} className={`p-5 border-2 transition-all hover:shadow-md ${p.connected ? `bg-${p.color}-50 border-${p.color}-200` : "bg-slate-50 border-slate-200 opacity-70"}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl text-3xl flex items-center justify-center ${p.connected ? `bg-${p.color}-200` : "bg-slate-200"}`}>
                  {p.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {p.connected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ulangan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <XCircle className="w-3.5 h-3.5" /> Uzilgan
                      </span>
                    )}
                    {p.connected && <span className="text-xs text-slate-500">· So'nggi sync: {p.lastSync}</span>}
                  </div>
                </div>
              </div>

              {p.connected && p.orders > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/60">
                  <div>
                    <div className="text-xs text-slate-500">Zakaz (oy)</div>
                    <div className="font-bold">{p.orders}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Summa</div>
                    <div className="font-bold">{fmt(p.sum / 1_000_000)} M</div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button
                  variant={p.connected ? "outline" : "default"}
                  onClick={() => toggleConnect(p.id)}
                  className="flex-1 text-xs"
                  size="sm"
                >
                  {p.connected ? "Uzish" : "Ulash"}
                </Button>
                {p.connected && (
                  <Button variant="outline" size="sm" className="px-2"><Settings className="w-3.5 h-3.5" /></Button>
                )}
                {p.connected && (
                  <Button variant="outline" size="sm" className="px-2"><ExternalLink className="w-3.5 h-3.5" /></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
