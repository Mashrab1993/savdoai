"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Navigation, Clock, Users, Route, CheckCircle2, XCircle, Calendar, Plus, Settings } from "lucide-react"
import Link from "next/link"

const DAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sh", "Ya"]

const AGENTS = [
  { id: 1, name: "Nurmatov A.", region: "Sergeli", routes: 5, clients: 84, planVisit: 28, factVisit: 26, accent: "#10B981" },
  { id: 2, name: "Rasulov B.", region: "Samarqand", routes: 4, clients: 72, planVisit: 24, factVisit: 22, accent: "#3B82F6" },
  { id: 3, name: "Karimov S.", region: "Yashnobod", routes: 5, clients: 68, planVisit: 24, factVisit: 18, accent: "#8B5CF6" },
  { id: 4, name: "Yusupov D.", region: "Buxoro", routes: 3, clients: 56, planVisit: 18, factVisit: 16, accent: "#D97706" },
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  done: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2, label: "Bajarildi" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Clock, label: "Davom etyapti" },
  planned: { bg: "bg-[#FAF7F2]", text: "text-[#6B5B4D]", border: "border-[#E8E0D3]", icon: MapPin, label: "Rejada" },
  skipped: { bg: "bg-[#F5E5D6]", text: "text-[#C75D3C]", border: "border-[#C75D3C]/30", icon: XCircle, label: "O'tkazildi" },
}

export default function MarshrutPage() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0])
  const [activeDay, setActiveDay] = useState(0)

  const completed = VISITS.filter(v => v.status === "done").length
  const totalSum = VISITS.reduce((s, v) => s + v.sum, 0)
  const totalDuration = VISITS.reduce((s, v) => s + v.duration, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Marshrutlar <span className="italic text-[#C75D3C]">(Routes)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Agent marshruti rejasi · GPS tracking · Visit planlash</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Settings className="w-4 h-4" /> Shablon</Button>
            <Button className="gap-2" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi marshrut</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AGENTS.map(a => {
              const isActive = activeAgent.id === a.id
              const visitPct = (a.factVisit / a.planVisit * 100)
              return (
                <Card
                  key={a.id}
                  onClick={() => setActiveAgent(a)}
                  className="p-4 cursor-pointer transition-all hover:shadow-md border bg-white rounded-2xl relative overflow-hidden"
                  style={isActive ? { borderColor: a.accent, boxShadow: `0 0 0 2px ${a.accent}33` } : { borderColor: "#E8E0D3" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-medium text-sm" style={{ background: a.accent, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {a.name.split(" ")[0][0]}{a.name.split(" ")[1]?.[0] || ""}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${visitPct >= 90 ? "bg-emerald-50 text-emerald-700" : visitPct >= 70 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                      {visitPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-sm font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{a.name}</div>
                  <div className="text-xs text-[#9C8A6E] mt-0.5">{a.region}</div>
                  <div className="grid grid-cols-3 gap-1 mt-3 text-xs">
                    <div><span className="text-[#9C8A6E]">Yo'l:</span> <span className="font-medium text-[#1A1A1A]">{a.routes}</span></div>
                    <div><span className="text-[#9C8A6E]">Klient:</span> <span className="font-medium text-[#1A1A1A]">{a.clients}</span></div>
                    <div><span className="text-[#9C8A6E]">Visit:</span> <span className="font-medium text-[#1A1A1A]">{a.factVisit}/{a.planVisit}</span></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: a.accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Calendar className="w-5 h-5 text-[#C75D3C]" />
                Hafta marshrut shabloni — {activeAgent.name}
              </h2>
              <div className="text-sm text-[#9C8A6E]">2026-04-29 — 2026-05-04</div>
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
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${
                      isActive ? "border-[#C75D3C] bg-[#FCE9DD]/50" :
                      isToday ? "border-[#C75D3C]/40 bg-[#FCE9DD]/20" :
                      "border-[#E8E0D3] bg-white hover:border-[#C75D3C]/30"
                    }`}
                  >
                    <div className={`text-xs uppercase tracking-wider font-medium ${isToday ? "text-[#C75D3C]" : "text-[#9C8A6E]"}`}>{d}</div>
                    <div className={`text-2xl font-medium mt-1 ${isToday ? "text-[#C75D3C]" : "text-[#1A1A1A]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{i + 29}</div>
                    <div className={`text-xs mt-1 ${visits === 0 ? "text-[#9C8A6E]" : "text-[#6B5B4D]"}`}>{visits} ta visit</div>
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiCard icon={CheckCircle2} accent="#10B981" label="Bajarildi" value={`${completed}/${VISITS.length}`} sub={`${((completed / VISITS.length) * 100).toFixed(0)}% bajarilish`} />
            <KpiCard icon={Clock} accent="#3B82F6" label="Vaqt" value={`${totalDuration} min`} sub={`O'rtacha: ${(totalDuration / completed || 0).toFixed(0)} min`} />
            <KpiCard icon={Route} accent="#C75D3C" label="Sotuv summasi" value={fmt(totalSum)} sub="so'm · bugun" />
            <KpiCard icon={Users} accent="#D97706" label="Muvaffaqiyat" value={`${Math.round(VISITS.filter(v => v.sum > 0).length / completed * 100)}%`} sub="Konversiya zakaz/visit" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-light flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Navigation className="w-5 h-5 text-[#C75D3C]" />
                Bugungi marshrut tartibi — {activeAgent.name}
              </h2>
              <span className="text-sm text-[#9C8A6E]">{VISITS.length} ta visit · 2026-05-02</span>
            </div>

            <div className="space-y-2">
              {VISITS.map((v, idx) => {
                const cfg = STATUS_CONFIG[v.status]
                const Icon = cfg.icon
                return (
                  <div key={v.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${cfg.bg} ${cfg.border} hover:shadow-sm transition-all`}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-[#E8E0D3] flex items-center justify-center font-medium text-[#6B5B4D]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {idx + 1}
                    </div>
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-sm font-mono font-medium text-[#1A1A1A]">{v.time}</div>
                      {v.duration > 0 && <div className="text-xs text-[#9C8A6E]">{v.duration} min</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1A1A1A]">{v.client}</div>
                      <div className="text-xs text-[#9C8A6E] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {v.addr}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {v.sum > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-emerald-700 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(v.sum)} so'm</div>
                          <div className="text-xs text-[#9C8A6E]">zakaz</div>
                        </div>
                      )}
                    </div>
                    <div className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg} ${cfg.text} font-medium text-xs border ${cfg.border}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
