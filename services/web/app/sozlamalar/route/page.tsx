"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Route as RouteIcon, Pencil, Trash2, X, Calendar, Clock } from "lucide-react"
import Link from "next/link"

type Route = {
  id: number; name: string; agent: string;
  weekday: string; territory: string;
  pointsCount: number; estimatedKm: number; estimatedHours: number;
  active: boolean;
}

const ROUTES_INIT: Route[] = [
  { id: 1, name: "Yashnobod #1 (du-pa-ju)", agent: "Babadjanova N.", weekday: "Du, Pa, Ju", territory: "Toshkent — Yashnobod", pointsCount: 14, estimatedKm: 28, estimatedHours: 6, active: true },
  { id: 2, name: "Yashnobod #2 (se-ch-sh)", agent: "Babadjanova N.", weekday: "Se, Ch, Sh", territory: "Toshkent — Yashnobod", pointsCount: 12, estimatedKm: 24, estimatedHours: 5, active: true },
  { id: 3, name: "Sergeli #1 (du-pa-ju)", agent: "Berdiyev R.", weekday: "Du, Pa, Ju", territory: "Toshkent — Sergeli", pointsCount: 10, estimatedKm: 22, estimatedHours: 5, active: true },
  { id: 4, name: "Sergeli #2 (se-ch-sh)", agent: "Berdiyev R.", weekday: "Se, Ch, Sh", territory: "Toshkent — Sergeli", pointsCount: 12, estimatedKm: 26, estimatedHours: 5.5, active: true },
  { id: 5, name: "Bektemir kunlik", agent: "ДАВЛАТ", weekday: "Har kun", territory: "Toshkent — Bektemir", pointsCount: 16, estimatedKm: 32, estimatedHours: 7, active: true },
  { id: 6, name: "Mirzo Ulug'bek (du-ch-sh)", agent: "BORIEV M.", weekday: "Du, Ch, Sh", territory: "Mirzo Ulug'bek", pointsCount: 18, estimatedKm: 36, estimatedHours: 7.5, active: true },
  { id: 7, name: "Sirdaryo (haftada 1)", agent: "Sayitqulov M.", weekday: "Pa", territory: "Sirdaryo viloyati", pointsCount: 8, estimatedKm: 240, estimatedHours: 8, active: true },
  { id: 8, name: "Yunusobod (eski)", agent: "—", weekday: "—", territory: "Yunusobod", pointsCount: 6, estimatedKm: 14, estimatedHours: 3, active: false },
]

export default function RoutePage() {
  const [routes, setRoutes] = useState(ROUTES_INIT)
  const [editing, setEditing] = useState<Partial<Route> | null>(null)

  const total = {
    routes: routes.filter(r => r.active).length,
    points: routes.reduce((s, r) => r.active ? s + r.pointsCount : s, 0),
    km: routes.reduce((s, r) => r.active ? s + r.estimatedKm : s, 0),
    hours: routes.reduce((s, r) => r.active ? s + r.estimatedHours : s, 0),
  }

  const openAdd = () => setEditing({ id: 0, name: "", agent: "", weekday: "Har kun", territory: "", pointsCount: 0, estimatedKm: 0, estimatedHours: 0, active: true })
  const openEdit = (r: Route) => setEditing({ ...r })

  const save = () => {
    if (!editing) return
    if (!editing.id) setRoutes([...routes, { ...editing as Route, id: Math.max(0, ...routes.map(r => r.id)) + 1 }])
    else setRoutes(routes.map(r => r.id === editing.id ? editing as Route : r))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <RouteIcon className="w-7 h-7 text-emerald-600" />
              Marshrutlar
            </h1>
            <p className="text-sm text-slate-500">{total.routes} ta faol marshrut · {total.points} nuqta · {total.km} km · {total.hours.toFixed(1)} soat</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi marshrut</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <RouteIcon className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol marshrut</div>
            <div className="text-2xl font-bold mt-1">{total.routes}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">Jami nuqta</div>
            <div className="text-2xl font-bold mt-1">{total.points}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700">Jami km</div>
            <div className="text-2xl font-bold mt-1">{total.km}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Clock className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Jami soat</div>
            <div className="text-2xl font-bold mt-1">{total.hours.toFixed(1)}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Marshrut nomi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Agent</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Kunlar</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Hudud</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Nuqta</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Km</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Soat</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Status</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {routes.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{r.id}</td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{r.name}</td>
                    <td className="border border-slate-300 py-2 px-3">{r.agent}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono flex items-center gap-1 justify-center">
                        <Calendar className="w-3 h-3" /> {r.weekday}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">{r.territory}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold">{r.pointsCount}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono">{r.estimatedKm}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono">{r.estimatedHours}h</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      {r.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                                : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">○ Off</span>}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <button onClick={() => openEdit(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Pencil className="w-4 h-4" /></button>
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
                  <RouteIcon className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Marshrut #${editing.id}` : "Yangi marshrut"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Marshrut nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Yashnobod #1 (du-pa-ju)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Agent</label>
                    <Input value={editing.agent} onChange={e => setEditing({ ...editing, agent: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Kunlar</label>
                    <Input value={editing.weekday} onChange={e => setEditing({ ...editing, weekday: e.target.value })} placeholder="Du, Pa, Ju yoki Har kun" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Hudud</label>
                  <Input value={editing.territory} onChange={e => setEditing({ ...editing, territory: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nuqta soni</label>
                    <Input type="number" value={editing.pointsCount} onChange={e => setEditing({ ...editing, pointsCount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Km</label>
                    <Input type="number" value={editing.estimatedKm} onChange={e => setEditing({ ...editing, estimatedKm: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Soat</label>
                    <Input type="number" step="0.5" value={editing.estimatedHours} onChange={e => setEditing({ ...editing, estimatedHours: Number(e.target.value) })} />
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
