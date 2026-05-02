"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Sparkles, Edit2, Trash2, ToggleRight, ToggleLeft, Calendar, TrendingUp, Award } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const RLP_INIT = [
  { id: 1, brand: "Bonjur", quarter: "Q2 2026", from: "2026-04-01", to: "2026-06-30", target: 100_000_000, current: 42_800_000, rate: 4, color: "emerald", active: true },
  { id: 2, brand: "Coca-Cola", quarter: "Q2 2026", from: "2026-04-01", to: "2026-06-30", target: 240_000_000, current: 86_400_000, rate: 5, color: "rose", active: true },
  { id: 3, brand: "Choco-Boom", quarter: "Q2 2026", from: "2026-04-01", to: "2026-06-30", target: 80_000_000, current: 24_500_000, rate: 3, color: "amber", active: true },
  { id: 4, brand: "Sladkiy Mir", quarter: "Q1 2026", from: "2026-01-01", to: "2026-03-31", target: 60_000_000, current: 64_200_000, rate: 4, color: "violet", active: false },
  { id: 5, brand: "Aqua-Plus", quarter: "Q2 2026", from: "2026-04-01", to: "2026-06-30", target: 50_000_000, current: 18_400_000, rate: 2, color: "cyan", active: true },
  { id: 6, brand: "Hilol", quarter: "Q2 2026", from: "2026-04-01", to: "2026-06-30", target: 40_000_000, current: 9_800_000, rate: 3, color: "blue", active: true },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function RLPPage() {
  const [items, setItems] = useState(RLP_INIT)
  const totalTarget = items.reduce((s, r) => s + r.target, 0)
  const totalCurrent = items.reduce((s, r) => s + r.current, 0)
  const totalBonus = items.reduce((s, r) => s + (r.current * r.rate / 100), 0)

  const toggle = (id: number) => {
    setItems(items.map(r => r.id === id ? { ...r, active: !r.active } : r))
    toast.success("Yangilandi")
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">RLP Bonus (Retro-Bonus)</h1>
            <p className="text-base text-slate-500 mt-1">Brand-specific retro-bonus · Kvartallik aylanma maqsadi</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi qoida</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Award className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol RLP</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{items.filter(r => r.active).length}/{items.length}</div>
            <div className="text-xs text-slate-600 mt-1">{items.filter(r => r.active).map(r => r.brand).join(", ")}</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <TrendingUp className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Jami target</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalTarget / 1_000_000)} M</div>
            <div className="text-xs text-slate-600 mt-1">Bajarildi: {fmt(totalCurrent / 1_000_000)} M ({(totalCurrent / totalTarget * 100).toFixed(1)}%)</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <Sparkles className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Hisoblangan bonus</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalBonus)}</div>
            <div className="text-xs text-slate-600 mt-1">so'm · O'rtacha: {(totalBonus / totalCurrent * 100).toFixed(2)}%</div>
          </Card>
        </div>

        <div className="space-y-3">
          {items.map(r => {
            const pct = (r.current / r.target * 100)
            const bonus = r.current * r.rate / 100
            const isComplete = pct >= 100
            return (
              <Card key={r.id} className={`p-5 border-2 transition-all hover:shadow-md group bg-${r.color}-50 border-${r.color}-200 ${!r.active ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-${r.color}-200 text-${r.color}-700 flex items-center justify-center`}>
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-slate-900">{r.brand}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold bg-${r.color}-200 text-${r.color}-800`}>{r.quarter}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {r.rate}% retro
                      </span>
                      {isComplete && <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">✓ Bajarildi</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.from} → {r.to}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-slate-500">Target</div>
                        <div className="font-bold text-base">{fmt(r.target / 1_000_000)} M so'm</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Joriy aylanma</div>
                        <div className={`font-bold text-base ${pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-rose-700"}`}>
                          {fmt(r.current / 1_000_000)} M ({pct.toFixed(1)}%)
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Hisoblangan bonus</div>
                        <div className={`font-bold text-base text-${r.color}-700`}>{fmt(bonus)} so'm</div>
                      </div>
                    </div>
                    <div className="mt-3 h-3 bg-white/60 rounded-full overflow-hidden relative">
                      <div className={`h-full ${isComplete ? "bg-emerald-500" : pct >= 50 ? `bg-${r.color}-500` : "bg-amber-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      {isComplete && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">✓ TARGET BAJARILDI</div>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggle(r.id)}>
                      {r.active ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => toast.info("Tahrir")} className="p-1.5 hover:bg-blue-100 rounded">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => toast.error("O'chirish")} className="p-1.5 hover:bg-rose-100 rounded">
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
