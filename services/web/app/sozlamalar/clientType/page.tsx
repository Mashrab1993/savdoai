"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Edit2, Trash2, Search, Building2, ShoppingCart, Boxes, Percent, ToggleRight, ToggleLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const TYPES_INIT = [
  { id: 1, name: "Магазин", code: "MGZ", icon: Building2, color: "emerald", priceType: "Розница", clients: 312, avg: 1_180_000, active: true },
  { id: 2, name: "Хорека (Ресторан/Кафе)", code: "HRK", icon: ShoppingCart, color: "violet", priceType: "VIP", clients: 84, avg: 2_640_000, active: true },
  { id: 3, name: "Опт (Wholesale)", code: "OPT", icon: Boxes, color: "blue", priceType: "ОПТ", clients: 56, avg: 6_840_000, active: true },
  { id: 4, name: "Супермаркет (Network)", code: "SPM", icon: Building2, color: "amber", priceType: "VIP", clients: 24, avg: 12_400_000, active: true },
  { id: 5, name: "Маршрут (Mob)", code: "MRH", icon: Boxes, color: "rose", priceType: "Маршрут", clients: 142, avg: 480_000, active: true },
  { id: 6, name: "Skidochnik", code: "SKD", icon: Percent, color: "lime", priceType: "ОПТ", clients: 38, avg: 3_240_000, active: true },
  { id: 7, name: "Прайс-список", code: "PRL", icon: Building2, color: "cyan", priceType: "Розница", clients: 12, avg: 240_000, active: false },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientTypePage() {
  const [types, setTypes] = useState(TYPES_INIT)
  const [search, setSearch] = useState("")
  const totalClients = types.reduce((s, t) => s + t.clients, 0)
  const totalAvg = types.reduce((s, t) => s + t.avg * t.clients, 0) / totalClients

  const filtered = types.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))

  const toggle = (id: number) => {
    setTypes(types.map(t => t.id === id ? { ...t, active: !t.active } : t))
    toast.success("Yangilandi")
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Klient tipi</h1>
            <p className="text-base text-slate-500 mt-1">7 ta tip · {totalClients} klient · O'rtacha chek: {fmt(Math.round(totalAvg))} so'm</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi tip</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Building2 className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami klient</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{totalClients}</div>
            <div className="text-xs text-slate-600 mt-1">{types.filter(t => t.active).length} faol tip</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <ShoppingCart className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">O'rtacha chek</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(Math.round(totalAvg / 1000))}K</div>
            <div className="text-xs text-slate-600 mt-1">so'm/zakaz</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <Boxes className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Eng katta</div>
            <div className="text-base font-bold text-slate-900 mt-1">Супермаркет</div>
            <div className="text-xs text-slate-600 mt-1">{fmt(12_400_000 / 1_000_000)} M/zakaz</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tip..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(t => {
              const Icon = t.icon
              const pct = (t.clients / totalClients * 100)
              return (
                <Card key={t.id} className={`p-5 border-2 transition-all hover:shadow-md group bg-${t.color}-50 border-${t.color}-200 ${!t.active ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${t.color}-200 text-${t.color}-700 flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{t.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold bg-${t.color}-200 text-${t.color}-800`}>{t.code}</span>
                        <span className="text-xs text-slate-500">→ {t.priceType}</span>
                      </div>
                    </div>
                    <button onClick={() => toggle(t.id)}>
                      {t.active ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-white/60">
                    <div>
                      <div className="text-xs text-slate-500">Klientlar</div>
                      <div className="font-bold text-lg">{t.clients}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">O'rt. chek</div>
                      <div className="font-bold text-lg">{fmt(Math.round(t.avg / 1000))}K</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full bg-${t.color}-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">{pct.toFixed(1)}% jami klientlardan</div>
                  <div className="mt-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toast.info("Tahrirlanmoqda")} className="p-1.5 hover:bg-blue-100 rounded">
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button onClick={() => toast.error("O'chirildi")} className="p-1.5 hover:bg-rose-100 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
