"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Navigation, Clock, Users, Route, CheckCircle2, AlertCircle, XCircle, Calendar, Plus, Settings } from "lucide-react"
import Link from "next/link"

const DAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sh", "Ya"]

const AGENTS = [
  { id: 1, name: "Nurmatov A.", region: "Sergeli", routes: 5, clients: 84, planVisit: 28, factVisit: 26, color: "emerald" },
  { id: 2, name: "Rasulov B.", region: "Samarqand", routes: 4, clients: 72, planVisit: 24, factVisit: 22, color: "blue" },
  { id: 3, name: "Karimov S.", region: "Yashnobod", routes: 5, clients: 68, planVisit: 24, factVisit: 18, color: "violet" },
  { id: 4, name: "Yusupov D.", region: "Buxoro", routes: 3, clients: 56, planVisit: 18, factVisit: 16, color: "amber" },
]

const VISITS = [
  { id: 1, time: "09:15", client: "Salom Magazin №1", addr: "Sergeli MFY 12", status: "done", duration: 18, sum: 1_240_000 },
  { id: 2, time: "09:45", client: "Asia Optom", addr: "Sergeli, Yangi Qishloq 3", status: "done", duration: 25, sum: 3_800_000 },
  { id: 3, time: "10:25", client: "Lider Chakana", addr: "Sergeli, Bog'ishamol 5", status: "done", duration: 12, sum: 0 },
  { id: 4, time: "10:50", client: "Bobur Magazin", addr: "Sergeli, Yangi 8", status: "in_progress", duration: 0, sum: 0 },
  { id: 5, time: "11:20", client: "Globus Plus", addr: "Sergeli, Markaz 1", status: "planned", duration: 0, sum: 0 },
  { id: 6, time: "11:50", client: "Sharq Bozor", addr: "Sergeli, Hadya 4", status: "planned", duration: 0, sum: 0 },
  { id: 7, time: "12:25", client: "Mega Market", addr: "Sergeli, MFY 22", status: "planned", duration: 0, sum: 0 },
  { id: 8, time: "13:00", client: "Optom Tovar", addr: "Sergeli, Markaz 7", status: "planned", duration: 0, sum: 0 },
  { id: 9, time: "13:45", client: "Yangi Magazin", addr: "Sergeli, Yangi 14", status: "skipped", duration: 0, sum: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const STATUS_CONFIG: Record<string, { color: string; bg: string; text: string; icon: any; label: string }> = {
  done: { color: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2, label: "Bajarildi" },
  in_progress: { color: "blue", bg: "bg-blue-100", text: "text-blue-700", icon: Clock, label: "Davom etyapti" },
  planned: { color: "slate", bg: "bg-slate-100", text: "text-slate-600", icon: MapPin, label: "Rejada" },
  skipped: { color: "rose", bg: "bg-rose-100", text: "text-rose-700", icon: XCircle, label: "O'tkazib yuborildi" },
}

export default function MarshrutPage() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0])
  const [activeDay, setActiveDay] = useState(0)

  const completed = VISITS.filter(v => v.status === "done").length
  const totalSum = VISITS.reduce((s, v) => s + v.sum, 0)
  const totalDuration = VISITS.reduce((s, v) => s + v.duration, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Marshrutlar (Routes)</h1>
            <p className="text-base text-slate-500 mt-1">Agent marshruti rejasi · GPS tracking · Visit planlash</p>
          </div>
          <Button variant="outline" className="gap-2"><Settings className="w-4 h-4" /> Marshrut shabloni</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi marshrut</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {AGENTS.map(a => {
            const isActive = activeAgent.id === a.id
            const visitPct = (a.factVisit / a.planVisit * 100)
            return (
              <Card
                key={a.id}
                onClick={() => setActiveAgent(a)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 bg-${a.color}-50 border-${a.color}-200 ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-full bg-${a.color}-200 text-${a.color}-700 flex items-center justify-center font-bold text-sm`}>
                    {a.name.split(" ")[0][0]}{a.name.split(" ")[1]?.[0] || ""}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${visitPct >= 90 ? "bg-emerald-100 text-emerald-700" : visitPct >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                    {visitPct.toFixed(0)}%
                  </span>
                </div>
                <div className={`text-sm font-bold text-slate-900`}>{a.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.region}</div>
                <div className="grid grid-cols-3 gap-1 mt-3 text-xs">
                  <div><span className="text-slate-500">Yo'l:</span> <span className="font-bold">{a.routes}</span></div>
                  <div><span className="text-slate-500">Klient:</span> <span className="font-bold">{a.clients}</span></div>
                  <div><span className="text-slate-500">Visit:</span> <span className="font-bold">{a.factVisit}/{a.planVisit}</span></div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Hafta marshrut shabloni — {activeAgent.name}
            </h2>
            <div className="text-sm text-slate-500">2026-04-29 dan 2026-05-04 gacha</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((d, i) => {
              const isToday = i === 0
              const isActive = activeDay === i
              const visits = i === 0 ? 8 : i === 6 ? 0 : 6 + (i % 3)
              return (
                <button
                  key={d}
                  onClick={() => setActiveDay(i)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isActive ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200" :
                    isToday ? "border-blue-300 bg-blue-50 hover:border-blue-400" :
                    "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`text-xs font-semibold ${isToday ? "text-blue-700" : "text-slate-500"}`}>{d}</div>
                  <div className={`text-xl font-bold mt-1 ${isToday ? "text-blue-700" : "text-slate-700"}`}>{i + 29}</div>
                  <div className={`text-xs mt-1 ${visits === 0 ? "text-slate-400" : "text-slate-600"}`}>{visits} ta visit</div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Bajarildi</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{completed}/{VISITS.length}</div>
            <div className="text-xs text-slate-600 mt-0.5">{((completed / VISITS.length) * 100).toFixed(0)}% bajarilish</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Clock className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Vaqt</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalDuration} min</div>
            <div className="text-xs text-slate-600 mt-0.5">O'rtacha: {(totalDuration / completed || 0).toFixed(0)} min</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Route className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Sotuv summasi</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{fmt(totalSum)}</div>
            <div className="text-xs text-slate-600 mt-0.5">so'm · bugun</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Users className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Muvaffaqiyat</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{Math.round(VISITS.filter(v => v.sum > 0).length / completed * 100)}%</div>
            <div className="text-xs text-slate-600 mt-0.5">Konversiya · zakaz/visit</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Bugungi marshrut tartibi — {activeAgent.name}
            </h2>
            <span className="text-sm text-slate-500">{VISITS.length} ta visit · 2026-05-02</span>
          </div>

          <div className="space-y-2">
            {VISITS.map((v, idx) => {
              const cfg = STATUS_CONFIG[v.status]
              const Icon = cfg.icon
              return (
                <div key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${cfg.bg} border-${cfg.color}-200 hover:shadow-sm transition-all`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700">
                    {idx + 1}
                  </div>
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-sm font-mono font-bold text-slate-700">{v.time}</div>
                    {v.duration > 0 && <div className="text-xs text-slate-500">{v.duration} min</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{v.client}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {v.addr}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {v.sum > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-700">{fmt(v.sum)} so'm</div>
                        <div className="text-xs text-slate-500">zakaz</div>
                      </div>
                    )}
                  </div>
                  <div className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg} ${cfg.text} font-semibold text-xs border border-${cfg.color}-300`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
