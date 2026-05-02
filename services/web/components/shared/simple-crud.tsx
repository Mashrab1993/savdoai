"use client"
import { useState } from "react"
import Link from "next/link"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Edit2, Trash2, Search, ToggleRight, ToggleLeft } from "lucide-react"
import { toast } from "sonner"

export type CrudItem = { id: number; name: string; desc?: string; usage?: number; active: boolean; color?: string }

export function SimpleCrudPage({
  title, subtitle, backHref, items: initial, addLabel = "Yangi", icon: Icon, accentColor = "emerald",
}: {
  title: string
  subtitle: string
  backHref: string
  items: CrudItem[]
  addLabel?: string
  icon: any
  accentColor?: string
}) {
  const [items, setItems] = useState(initial)
  const [search, setSearch] = useState("")
  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
  const totalUsage = items.reduce((s, i) => s + (i.usage || 0), 0)

  const toggle = (id: number) => {
    setItems(items.map(i => i.id === id ? { ...i, active: !i.active } : i))
    toast.success("Yangilandi")
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-base text-slate-500 mt-1">{subtitle} · {items.length} ta · {items.filter(i => i.active).length} faol{totalUsage > 0 ? ` · ${totalUsage.toLocaleString()} marta ishlatilgan` : ""}</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> {addLabel}</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(item => {
              const color = item.color || accentColor
              return (
                <Card key={item.id} className={`p-4 border-2 transition-all hover:shadow-md group bg-${color}-50 border-${color}-200 ${!item.active ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${color}-200 text-${color}-700 flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {item.desc && <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>}
                      {item.usage !== undefined && item.usage > 0 && <p className="text-xs text-slate-500 mt-1">Ishlatildi: <span className="font-bold">{item.usage}</span> marta</p>}
                    </div>
                    <button onClick={() => toggle(item.id)}>
                      {item.active ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                  </div>
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
