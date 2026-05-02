"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Calendar, Filter as FilterIcon, Activity, RotateCcw, Crosshair, Plus, Minus, Layers } from "lucide-react"
import Link from "next/link"

const AGENTS_GPS = [
  { id: 1, name: "Nurmatov A.", lat: 41.272, lng: 69.213, status: "active", visits: 8, color: "emerald" },
  { id: 2, name: "Karimov S.", lat: 41.290, lng: 69.245, status: "active", visits: 6, color: "blue" },
  { id: 3, name: "Rasulov B.", lat: 41.260, lng: 69.260, status: "moving", visits: 4, color: "violet" },
  { id: 4, name: "Yusupov D.", lat: 41.280, lng: 69.198, status: "active", visits: 7, color: "amber" },
  { id: 5, name: "Toxirov M.", lat: 41.295, lng: 69.230, status: "stopped", visits: 0, color: "rose" },
  { id: 6, name: "Aminov R.", lat: 41.265, lng: 69.218, status: "active", visits: 9, color: "cyan" },
]

export default function GpsPage() {
  const [date, setDate] = useState("2026-05-02")
  const [tab, setTab] = useState<"realtime" | "route">("realtime")
  const [selected, setSelected] = useState<typeof AGENTS_GPS[0] | null>(null)

  const minLat = 41.250, maxLat = 41.305
  const minLng = 69.170, maxLng = 69.270
  const xFor = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100
  const yFor = (lat: number) => 100 - ((lat - minLat) / (maxLat - minLat)) * 100

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">GPS Tracker — Live</h1>
          <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
            <button onClick={() => setTab("realtime")} className={`px-3 py-1.5 text-xs font-semibold rounded ${tab === "realtime" ? "bg-emerald-600 text-white" : "text-slate-600"}`}>
              Мониторинг
            </button>
            <button onClick={() => setTab("route")} className={`px-3 py-1.5 text-xs font-semibold rounded ${tab === "route" ? "bg-emerald-600 text-white" : "text-slate-600"}`}>
              Маршрут
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Card className="p-3 col-span-12 lg:col-span-9 relative">
            <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-50 via-blue-50 to-slate-50 rounded-lg overflow-hidden border-2 border-slate-200">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
                backgroundSize: "5% 5%",
                opacity: 0.4,
              }} />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg p-3 shadow-sm">
                <div className="text-xs text-slate-500 italic">Bu sahifada Google haqirixin yoyobotda mualima qaytmadi.</div>
              </div>
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                <button className="bg-white rounded shadow p-2 hover:bg-slate-50"><Plus className="w-4 h-4" /></button>
                <button className="bg-white rounded shadow p-2 hover:bg-slate-50"><Minus className="w-4 h-4" /></button>
                <button className="bg-white rounded shadow p-2 hover:bg-slate-50"><Crosshair className="w-4 h-4" /></button>
                <button className="bg-white rounded shadow p-2 hover:bg-slate-50"><Layers className="w-4 h-4" /></button>
              </div>
              {AGENTS_GPS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-${a.color}-500 ring-4 ring-white shadow-lg hover:scale-150 transition-transform cursor-pointer ${selected?.id === a.id ? "scale-150 ring-emerald-500" : ""} ${a.status === "moving" ? "animate-pulse" : ""}`}
                  style={{ left: `${xFor(a.lng)}%`, top: `${yFor(a.lat)}%` }}
                  title={a.name}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 hover:opacity-100">
                    {a.name}
                  </span>
                </button>
              ))}
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <div className="bg-white rounded-lg shadow px-3 py-2 flex items-center gap-2">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-xs" />
                  <button className="text-xs text-emerald-700 font-semibold ml-2">Маршрут ▾</button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3 col-span-12 lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold">Сотрудники</h3>
              <span className="ml-auto text-xs text-slate-500">{AGENTS_GPS.length}</span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {AGENTS_GPS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`w-full text-left flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${selected?.id === a.id ? `border-${a.color}-500 bg-${a.color}-50` : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-${a.color}-500 ${a.status === "moving" ? "animate-pulse" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate">{a.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {a.status === "active" ? "● онлайн" : a.status === "moving" ? "▶ движется" : "○ остановка"} · {a.visits} visits
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t pt-3">
              <button className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Сбросить
              </button>
            </div>

            {selected && (
              <Card className="p-3 bg-slate-50">
                <h4 className="font-bold text-sm">{selected.name}</h4>
                <div className="text-xs text-slate-600 mt-1">
                  <div>📍 {selected.lat}, {selected.lng}</div>
                  <div>📊 {selected.visits} visits today</div>
                  <div>⚡ {selected.status}</div>
                </div>
                <Link href={`/komanda/${selected.id}`}>
                  <Button size="sm" className="w-full mt-2">Профиль</Button>
                </Link>
              </Card>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
