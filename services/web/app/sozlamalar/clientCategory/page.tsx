"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Crown, Award, Star, Trophy, Edit2, Trash2, ToggleRight, ToggleLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const CATEGORIES_INIT = [
  { id: 1, name: "VIP A+", code: "VIPA", icon: Crown, color: "amber", priority: 1, minSum: 50_000_000, discount: 8, clients: 12, active: true },
  { id: 2, name: "VIP A", code: "VIPB", icon: Trophy, color: "violet", priority: 2, minSum: 25_000_000, discount: 6, clients: 24, active: true },
  { id: 3, name: "Premium", code: "PRM", icon: Award, color: "blue", priority: 3, minSum: 10_000_000, discount: 4, clients: 56, active: true },
  { id: 4, name: "Standart+", code: "STD+", icon: Star, color: "emerald", priority: 4, minSum: 3_000_000, discount: 2, clients: 124, active: true },
  { id: 5, name: "Standart", code: "STD", icon: Star, color: "lime", priority: 5, minSum: 500_000, discount: 0, clients: 312, active: true },
  { id: 6, name: "New (yangi)", code: "NEW", icon: Plus, color: "cyan", priority: 6, minSum: 0, discount: 0, clients: 84, active: true },
  { id: 7, name: "Inactive", code: "INC", icon: Trash2, color: "slate", priority: 7, minSum: 0, discount: 0, clients: 42, active: false },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientCategoryPage() {
  const [items, setItems] = useState(CATEGORIES_INIT)
  const totalClients = items.reduce((s, c) => s + c.clients, 0)
  const vipCount = items.filter(c => c.code.includes("VIP")).reduce((s, c) => s + c.clients, 0)

  const toggle = (id: number) => {
    setItems(items.map(c => c.id === id ? { ...c, active: !c.active } : c))
    toast.success("Yangilandi")
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Klient kategoriyasi (Tier)</h1>
            <p className="text-base text-slate-500 mt-1">{items.length} ta tier · {totalClients} klient · {vipCount} VIP ({(vipCount / totalClients * 100).toFixed(1)}%)</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi tier</Button>
        </div>

        <div className="space-y-3">
          {items.sort((a, b) => a.priority - b.priority).map(c => {
            const Icon = c.icon
            const pct = (c.clients / totalClients * 100)
            return (
              <Card key={c.id} className={`p-5 border-2 transition-all hover:shadow-md group bg-${c.color}-50 border-${c.color}-200 ${!c.active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-${c.color}-200 text-${c.color}-700 flex items-center justify-center`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold bg-${c.color}-200 text-${c.color}-800`}>{c.code}</span>
                      <span className="text-xs text-slate-500">Priority: {c.priority}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-slate-500">Klientlar</div>
                        <div className="font-bold text-lg">{c.clients}</div>
                        <div className="text-xs text-slate-400">{pct.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Min. aylanma (oy)</div>
                        <div className="font-bold text-lg">{c.minSum >= 1_000_000 ? `${fmt(c.minSum / 1_000_000)} M` : fmt(c.minSum)} so'm</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Standart skidka</div>
                        <div className={`font-bold text-lg ${c.discount > 0 ? `text-${c.color}-700` : "text-slate-400"}`}>
                          {c.discount > 0 ? `${c.discount}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Auto-tier</div>
                        <div className="font-bold text-lg text-emerald-700">✓ Yoqilgan</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full bg-${c.color}-500`} style={{ width: `${pct * 2}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggle(c.id)}>
                      {c.active ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => toast.info("Tahrirlanmoqda")} className="p-1.5 hover:bg-blue-100 rounded">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => toast.error("O'chirildi")} className="p-1.5 hover:bg-rose-100 rounded">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
