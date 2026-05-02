"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Ruler, Edit2, Trash2, Search, ToggleRight, ToggleLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const UNITS_INIT = [
  { id: 1, name: "Dona", code: "dn", category: "count", base: 1, parent: null, color: "emerald", usage: 4280, active: true },
  { id: 2, name: "Blok (24 dona)", code: "blok", category: "count", base: 24, parent: "Dona", color: "blue", usage: 856, active: true },
  { id: 3, name: "Korobka (48 dona)", code: "kor", category: "count", base: 48, parent: "Dona", color: "violet", usage: 412, active: true },
  { id: 4, name: "Pachka (12 dona)", code: "pch", category: "count", base: 12, parent: "Dona", color: "amber", usage: 96, active: true },
  { id: 5, name: "Kg (kilogram)", code: "kg", category: "weight", base: 1000, parent: null, color: "rose", usage: 248, active: true },
  { id: 6, name: "Gramm", code: "g", category: "weight", base: 1, parent: "Kg", color: "rose", usage: 18, active: true },
  { id: 7, name: "Litr", code: "l", category: "volume", base: 1000, parent: null, color: "cyan", usage: 184, active: true },
  { id: 8, name: "Millilitr", code: "ml", category: "volume", base: 1, parent: "Litr", color: "cyan", usage: 24, active: false },
  { id: 9, name: "Metr", code: "m", category: "length", base: 100, parent: null, color: "lime", usage: 12, active: true },
]

const CATEGORIES = [
  { key: "count", name: "Sanaladigan", color: "emerald" },
  { key: "weight", name: "Vazn", color: "rose" },
  { key: "volume", name: "Hajm", color: "cyan" },
  { key: "length", name: "Uzunlik", color: "lime" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function MeasureUnitPage() {
  const [items, setItems] = useState(UNITS_INIT)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = items.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCategory || u.category === activeCategory
    return matchSearch && matchCat
  })

  const toggle = (id: number) => {
    setItems(items.map(u => u.id === id ? { ...u, active: !u.active } : u))
    toast.success("Yangilandi")
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">O'lchov birliklari</h1>
            <p className="text-base text-slate-500 mt-1">{items.length} ta birlik · {items.filter(u => u.active).length} faol · {CATEGORIES.length} kategoriya</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi birlik</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map(c => {
            const count = items.filter(u => u.category === c.key).length
            const isActive = activeCategory === c.key
            return (
              <Card
                key={c.key}
                onClick={() => setActiveCategory(isActive ? null : c.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 bg-${c.color}-50 border-${c.color}-200 ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
              >
                <Ruler className={`w-5 h-5 text-${c.color}-600 mb-2`} />
                <div className={`text-xs font-bold text-${c.color}-700`}>{c.name}</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{count}</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Birlik nomi yoki kod..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Birlik</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Kod</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Kategoriya</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Ota birlik</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Konversiya</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Ishlatildi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Faol</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const cat = CATEGORIES.find(c => c.key === u.category)!
                  return (
                    <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!u.active ? "opacity-50" : ""}`}>
                      <td className="py-3 px-2 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                          {u.code}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-${cat.color}-100 text-${cat.color}-700`}>
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{u.parent || "—"}</td>
                      <td className="py-3 px-2 text-right font-mono">
                        {u.parent ? `1 ${u.code} = ${u.base} ${u.category === "weight" ? "g" : u.category === "volume" ? "ml" : "dn"}` : `Asosiy birlik`}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600">{fmt(u.usage)}</td>
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => toggle(u.id)}>
                          {u.active ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex gap-1">
                          <button onClick={() => toast.info("Tahrirlanmoqda")} className="p-1.5 hover:bg-blue-100 rounded-lg">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button onClick={() => toast.error("O'chirildi")} className="p-1.5 hover:bg-rose-100 rounded-lg">
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
