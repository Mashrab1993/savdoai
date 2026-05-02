"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, MapPin, Pencil, Trash2, X, Search } from "lucide-react"
import Link from "next/link"

type RoutePoint = {
  id: number; name: string;
  city: string; address: string;
  lat: number; lng: number;
  type: "warehouse" | "client" | "office" | "checkpoint";
  agent: string;
  active: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  warehouse: "📦 Ombor", client: "🏪 Klient", office: "🏢 Ofis", checkpoint: "🚥 Kontrol",
}
const TYPE_COLOR: Record<string, string> = {
  warehouse: "bg-blue-500", client: "bg-emerald-500", office: "bg-violet-500", checkpoint: "bg-amber-500",
}

const POINTS: RoutePoint[] = [
  { id: 1, name: "Markaziy ombor", city: "Toshkent", address: "Yashnobod, Yangi Hayot 4-mavzu", lat: 41.32, lng: 69.27, type: "warehouse", agent: "—", active: true },
  { id: 2, name: "Sergeli filial", city: "Toshkent", address: "Sergeli, Bozor ko'chasi 12", lat: 41.28, lng: 69.30, type: "warehouse", agent: "—", active: true },
  { id: 3, name: "Bektemir filial", city: "Toshkent", address: "Bektemir, Magistral 5-uy", lat: 41.26, lng: 69.32, type: "warehouse", agent: "—", active: true },
  { id: 4, name: "Bosh ofis", city: "Toshkent", address: "Yashnobod, A.Temur ko'chasi 23", lat: 41.31, lng: 69.28, type: "office", agent: "—", active: true },
  { id: 5, name: "Salom Magazin №1", city: "Toshkent", address: "Yashnobod 4-mavzu, 24-uy", lat: 41.32, lng: 69.27, type: "client", agent: "Babadjanova N.", active: true },
  { id: 6, name: "Bona Магазин", city: "Toshkent", address: "Sergeli, Yangi Bozor", lat: 41.28, lng: 69.30, type: "client", agent: "Berdiyev R.", active: true },
  { id: 7, name: "Дастархон Сервис", city: "Toshkent", address: "Mirzo Ulug'bek, 14-mikrorayon", lat: 41.31, lng: 69.24, type: "client", agent: "Sayitqulov M.", active: true },
  { id: 8, name: "GPS-checkpoint #1 (Kommunal)", city: "Toshkent", address: "Magistral 7-km", lat: 41.30, lng: 69.31, type: "checkpoint", agent: "—", active: true },
  { id: 9, name: "Гулямов Маркет", city: "Toshkent", address: "Bektemir, 5-mikrorayon", lat: 41.26, lng: 69.32, type: "client", agent: "ДАВЛАТ", active: true },
  { id: 10, name: "Eski klient (chiqib ketgan)", city: "Toshkent", address: "—", lat: 0, lng: 0, type: "client", agent: "—", active: false },
]

export default function RoutePointPage() {
  const [points, setPoints] = useState(POINTS)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [editing, setEditing] = useState<Partial<RoutePoint> | null>(null)

  const filtered = points
    .filter(p => typeFilter === "all" || p.type === typeFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    all: points.length,
    warehouse: points.filter(p => p.type === "warehouse").length,
    client: points.filter(p => p.type === "client").length,
    office: points.filter(p => p.type === "office").length,
    checkpoint: points.filter(p => p.type === "checkpoint").length,
  }

  const openAdd = () => setEditing({ id: 0, name: "", city: "Toshkent", address: "", lat: 41.30, lng: 69.27, type: "client", agent: "", active: true })
  const openEdit = (p: RoutePoint) => setEditing({ ...p })

  const save = () => {
    if (!editing) return
    if (!editing.id) setPoints([...points, { ...editing as RoutePoint, id: Math.max(0, ...points.map(p => p.id)) + 1 }])
    else setPoints(points.map(p => p.id === editing.id ? editing as RoutePoint : p))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Marshrut nuqtalari</h1>
            <p className="text-sm text-slate-500">{points.filter(p => p.active).length} ta faol nuqta · GPS koordinatalar bilan</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi nuqta</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button onClick={() => setTypeFilter("all")} className={`p-3 rounded-lg border-2 ${typeFilter === "all" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">Hammasi</div>
            <div className="text-2xl font-bold mt-1">{counts.all}</div>
          </button>
          <button onClick={() => setTypeFilter("warehouse")} className={`p-3 rounded-lg border-2 ${typeFilter === "warehouse" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">📦 Omborlar</div>
            <div className="text-2xl font-bold mt-1">{counts.warehouse}</div>
          </button>
          <button onClick={() => setTypeFilter("client")} className={`p-3 rounded-lg border-2 ${typeFilter === "client" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">🏪 Klientlar</div>
            <div className="text-2xl font-bold mt-1">{counts.client}</div>
          </button>
          <button onClick={() => setTypeFilter("office")} className={`p-3 rounded-lg border-2 ${typeFilter === "office" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">🏢 Ofislar</div>
            <div className="text-2xl font-bold mt-1">{counts.office}</div>
          </button>
          <button onClick={() => setTypeFilter("checkpoint")} className={`p-3 rounded-lg border-2 ${typeFilter === "checkpoint" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">🚥 Checkpointlar</div>
            <div className="text-2xl font-bold mt-1">{counts.checkpoint}</div>
          </button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500">Поиск:</span>
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nuqta nomi yoki manzil..." className="pl-9" />
            </div>
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} ta nuqta</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-10">#</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Nuqta nomi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Turi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Manzil</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">GPS</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Agent</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Status</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <div className={`w-7 h-7 rounded-full ${TYPE_COLOR[p.type]} flex items-center justify-center mx-auto`}>
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{p.name}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{TYPE_LABEL[p.type]}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">
                      <div>{p.address}</div>
                      <div className="text-xs text-slate-500">{p.city}</div>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono text-xs">
                      {p.lat !== 0 ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "—"}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">{p.agent}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      {p.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                                : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">○ Off</span>}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <button onClick={() => openEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Pencil className="w-4 h-4" /></button>
                      <button className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Nuqta #${editing.id}` : "Yangi nuqta"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Nuqta nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Salom Magazin №1" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Turi *</label>
                  <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as any })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Shahar</label>
                    <Input value={editing.city} onChange={e => setEditing({ ...editing, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Agent</label>
                    <Input value={editing.agent} onChange={e => setEditing({ ...editing, agent: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Manzil</label>
                  <Input value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} placeholder="Yashnobod 4-mavzu, 24-uy" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Latitude</label>
                    <Input type="number" step="0.0001" value={editing.lat} onChange={e => setEditing({ ...editing, lat: Number(e.target.value) })} className="font-mono" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Longitude</label>
                    <Input type="number" step="0.0001" value={editing.lng} onChange={e => setEditing({ ...editing, lng: Number(e.target.value) })} className="font-mono" />
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
