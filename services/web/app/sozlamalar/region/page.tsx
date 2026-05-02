"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, MapPin, Pencil, Trash2, X, Globe } from "lucide-react"
import Link from "next/link"

type Region = {
  id: number; name: string; nameRu: string; type: "viloyat" | "tuman" | "shahar" | "mavzu";
  parentId: number | null; clientsCount: number; sort: number; active: boolean;
}

const INITIAL: Region[] = [
  { id: 1, name: "Toshkent shahar", nameRu: "г. Ташкент", type: "shahar", parentId: null, clientsCount: 412, sort: 100, active: true },
  { id: 11, name: "Yashnobod tumani", nameRu: "Яшнабадский район", type: "tuman", parentId: 1, clientsCount: 84, sort: 110, active: true },
  { id: 12, name: "Sergeli tumani", nameRu: "Сергелийский район", type: "tuman", parentId: 1, clientsCount: 72, sort: 120, active: true },
  { id: 13, name: "Bektemir tumani", nameRu: "Бектемирский район", type: "tuman", parentId: 1, clientsCount: 96, sort: 130, active: true },
  { id: 14, name: "Mirzo Ulug'bek tumani", nameRu: "Мирзо-Улугбекский район", type: "tuman", parentId: 1, clientsCount: 102, sort: 140, active: true },
  { id: 15, name: "Yunusobod tumani", nameRu: "Юнусабадский район", type: "tuman", parentId: 1, clientsCount: 48, sort: 150, active: true },
  { id: 111, name: "Yangi Hayot 4-mavzu", nameRu: "Новая Жизнь, 4-й район", type: "mavzu", parentId: 11, clientsCount: 24, sort: 111, active: true },
  { id: 2, name: "Sirdaryo viloyati", nameRu: "Сырдарьинская область", type: "viloyat", parentId: null, clientsCount: 36, sort: 200, active: true },
  { id: 21, name: "Yangiyer shahar", nameRu: "г. Янгиер", type: "shahar", parentId: 2, clientsCount: 36, sort: 210, active: true },
  { id: 3, name: "Samarqand viloyati", nameRu: "Самаркандская область", type: "viloyat", parentId: null, clientsCount: 58, sort: 300, active: true },
  { id: 31, name: "Samarqand markaziy", nameRu: "Самарканд центр", type: "shahar", parentId: 3, clientsCount: 58, sort: 310, active: true },
  { id: 4, name: "Andijon viloyati", nameRu: "Андижанская область", type: "viloyat", parentId: null, clientsCount: 32, sort: 400, active: true },
]

const TYPE_LABEL: Record<string, string> = {
  viloyat: "🌐 Viloyat", tuman: "📍 Tuman", shahar: "🏙️ Shahar", mavzu: "🏘️ Mavzu",
}
const TYPE_COLOR: Record<string, string> = {
  viloyat: "bg-rose-100 text-rose-700",
  tuman: "bg-blue-100 text-blue-700",
  shahar: "bg-emerald-100 text-emerald-700",
  mavzu: "bg-violet-100 text-violet-700",
}

function buildTree(regs: Region[], parentId: number | null = null, depth = 0): { reg: Region; depth: number }[] {
  return regs
    .filter(r => r.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .flatMap(r => [{ reg: r, depth }, ...buildTree(regs, r.id, depth + 1)])
}

export default function RegionPage() {
  const [regs, setRegs] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<Region> | null>(null)

  const flat = buildTree(regs)

  const openAdd = (parentId: number | null = null) => setEditing({ id: 0, name: "", nameRu: "", type: "tuman", parentId, clientsCount: 0, sort: 100, active: true })
  const openEdit = (r: Region) => setEditing({ ...r })

  const save = () => {
    if (!editing) return
    if (!editing.id) setRegs([...regs, { ...editing as Region, id: Math.max(0, ...regs.map(r => r.id)) + 1 }])
    else setRegs(regs.map(r => r.id === editing.id ? editing as Region : r))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="w-7 h-7 text-blue-600" />
              Hududlar (geografiya)
            </h1>
            <p className="text-sm text-slate-500">{regs.filter(r => r.active).length} ta hudud · ko'p darajali daraxt (Viloyat → Tuman → Mavzu)</p>
          </div>
          <Button onClick={() => openAdd()} className="gap-1"><Plus className="w-4 h-4" /> Yangi hudud</Button>
        </div>

        <Card className="p-5">
          <div className="border border-slate-200 rounded-lg p-2">
            {flat.map(({ reg, depth }) => (
              <div
                key={reg.id}
                className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg group ${!reg.active ? "opacity-50" : ""}`}
                style={{ paddingLeft: `${12 + depth * 24}px` }}
              >
                <MapPin className={`w-4 h-4 ${reg.active ? "text-blue-600" : "text-slate-400"}`} />
                <span className="font-semibold flex-1">{reg.name}</span>
                <span className="text-xs text-slate-500">{reg.nameRu}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[reg.type]}`}>{TYPE_LABEL[reg.type]}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{reg.clientsCount} klient</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openAdd(reg.id)} className="p-1 hover:bg-emerald-100 rounded"><Plus className="w-3.5 h-3.5 text-emerald-600" /></button>
                  <button onClick={() => openEdit(reg)} className="p-1 hover:bg-blue-100 rounded"><Pencil className="w-3.5 h-3.5 text-blue-600" /></button>
                  <button className="p-1 hover:bg-rose-100 rounded"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  {editing.id ? `Hudud #${editing.id}` : "Yangi hudud"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Nom (uz/lat) *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Nom (ru)</label>
                  <Input value={editing.nameRu} onChange={e => setEditing({ ...editing, nameRu: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Turi</label>
                    <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as any })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      <option value="viloyat">🌐 Viloyat</option>
                      <option value="tuman">📍 Tuman</option>
                      <option value="shahar">🏙️ Shahar</option>
                      <option value="mavzu">🏘️ Mavzu</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Ota hudud</label>
                    <select value={editing.parentId ?? ""} onChange={e => setEditing({ ...editing, parentId: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      <option value="">— ROOT —</option>
                      {regs.filter(r => r.id !== editing.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Aktiv</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Bekor</Button>
                <Button onClick={save}>{editing.id ? "Saqlash" : "Yaratish"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
