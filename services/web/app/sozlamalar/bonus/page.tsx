"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Gift, Sparkles, Edit2, Trash2, Search, Percent, Calendar, ToggleRight, ToggleLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const TYPES = [
  { key: "auto", name: "Avtomatik chegirma", desc: "Mahsulot summasi/miqdoriga qarab", color: "emerald" },
  { key: "manual", name: "Qo'l chegirma", desc: "Agent qo'lda kiritadi (max %)", color: "blue" },
  { key: "cumul", name: "Накопительная", desc: "Klient aylanmasiga qarab", color: "violet" },
  { key: "season", name: "Mavsumiy aksiya", desc: "Sana oralig'i bo'yicha", color: "amber" },
  { key: "rlp", name: "RLP Bonus", desc: "Brand-specific retro-bonus", color: "rose" },
]

const RULES = [
  { id: 1, name: "Coca-Cola оптом 100+ dona", type: "auto", value: "5%", scope: "1 brand", clients: "All", from: "2026-04-01", to: "2026-12-31", active: true, used: 142 },
  { id: 2, name: "VIP klient avto-skidka", type: "auto", value: "8%", scope: "All", clients: "VIP only (24)", from: "2026-01-01", to: "Doimiy", active: true, used: 386 },
  { id: 3, name: "Agent qo'l skidka (max)", type: "manual", value: "max 10%", scope: "All", clients: "All", from: "2026-01-01", to: "Doimiy", active: true, used: 824 },
  { id: 4, name: "1 oy aylanma 50M+", type: "cumul", value: "3%", scope: "All", clients: "Auto-tier", from: "2026-01-01", to: "Doimiy", active: true, used: 96 },
  { id: 5, name: "May aksiyasi 2026", type: "season", value: "10%", scope: "Shokolad kategoriya", clients: "All", from: "2026-05-01", to: "2026-05-15", active: true, used: 0 },
  { id: 6, name: "Bonjur Q1 RLP", type: "rlp", value: "4% retro", scope: "Bonjur brand", clients: "All", from: "2026-04-01", to: "2026-06-30", active: true, used: 28 },
  { id: 7, name: "Yangi yil aksiyasi 2025", type: "season", value: "15%", scope: "All", clients: "All", from: "2025-12-25", to: "2026-01-08", active: false, used: 1240 },
]

export default function BonusPage() {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState(RULES)

  const filtered = items.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !activeType || r.type === activeType
    return matchSearch && matchType
  })

  const typeStats = TYPES.map(t => ({ ...t, count: items.filter(r => r.type === t.key).length }))

  const toggleActive = (id: number) => {
    setItems(items.map(r => r.id === id ? { ...r, active: !r.active } : r))
    const r = items.find(r => r.id === id)!
    toast.success(`${r.name} ${r.active ? "o'chirildi" : "yoqildi"}`)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Bonuslar va chegirmalar</h1>
            <p className="text-base text-slate-500 mt-1">5 ta bonus turi · {items.filter(r => r.active).length}/{items.length} ta faol qoida</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi qoida</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {typeStats.map(t => {
            const isActive = activeType === t.key
            return (
              <Card
                key={t.key}
                onClick={() => setActiveType(isActive ? null : t.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 bg-${t.color}-50 border-${t.color}-200 ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
              >
                <Gift className={`w-5 h-5 text-${t.color}-600 mb-2`} />
                <div className={`text-xs font-bold text-${t.color}-700`}>{t.name}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{t.count}</div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.desc}</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qoida nomi..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta qoida</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Qoida nomi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Turi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Qiymat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Klient</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Muddat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Ishlatildi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Faol</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const t = TYPES.find(x => x.key === r.type)!
                  return (
                    <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!r.active ? "opacity-50" : ""}`}>
                      <td className="py-3 px-2 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-${t.color}-100 text-${t.color}-700`}>
                          {t.name}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-mono font-bold border border-emerald-200">
                          <Percent className="w-3 h-3" /> {r.value}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{r.scope}</td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{r.clients}</td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-xs">
                        <Calendar className="w-3 h-3 inline mr-1" />{r.from} → {r.to}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{r.used.toLocaleString()}</td>
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => toggleActive(r.id)}>
                          {r.active ? (
                            <ToggleRight className="w-7 h-7 text-emerald-600 hover:text-emerald-700" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-400 hover:text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex gap-1">
                          <button className="p-1.5 hover:bg-blue-100 rounded-lg" title="Tahrirlash">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-1.5 hover:bg-rose-100 rounded-lg" title="O'chirish">
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
