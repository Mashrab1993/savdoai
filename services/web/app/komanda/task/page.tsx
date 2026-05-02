"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, CheckCircle2, Clock, AlertCircle, User, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const TASKS = [
  { id: 1, title: "Storecheck Asia Optom", agent: "Nurmatov A.", client: "Asia Optom Market", type: "storecheck", priority: "high", deadline: "2026-05-02 12:00", status: "in_progress" },
  { id: 2, title: "Yetkazib berish #1024", agent: "Toxirov M.", client: "Salom Magazin", type: "delivery", priority: "high", deadline: "2026-05-02 14:00", status: "pending" },
  { id: 3, title: "Inkasaciya Globus Plus", agent: "Karimov S.", client: "Globus Plus", type: "collection", priority: "high", deadline: "2026-05-02 16:00", status: "pending" },
  { id: 4, title: "Foto Coca-Cola facing", agent: "Yusupov D.", client: "Mega Market", type: "photo", priority: "medium", deadline: "2026-05-03 12:00", status: "pending" },
  { id: 5, title: "Холодильник montaj", agent: "Aminov R.", client: "Bobur Magazin", type: "install", priority: "low", deadline: "2026-05-04 10:00", status: "completed" },
]

const TYPE_CFG: Record<string, { color: string; label: string }> = {
  storecheck: { color: "blue", label: "Storecheck" },
  delivery: { color: "violet", label: "Yetkazish" },
  collection: { color: "amber", label: "Inkasaciya" },
  photo: { color: "emerald", label: "Foto" },
  install: { color: "rose", label: "Montaj" },
}

export default function AgentTasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = TASKS.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Vazifalar (Agent Tasks)</h1>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Yangi vazifa</Button>
        </div>

        {showForm && (
          <Card className="p-5 border-2 border-emerald-300 bg-emerald-50/30">
            <h2 className="text-lg font-bold mb-4">Yangi vazifa yaratish</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sarlavha *</label>
                <Input placeholder="Storecheck Klient X" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Agent</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>Nurmatov A.</option>
                  <option>Karimov S.</option>
                  <option>Rasulov B.</option>
                  <option>Yusupov D.</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Klient</label>
                <Input placeholder="Klient nomi" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Tur</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Muhimligi</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>Yuqori</option>
                  <option>O'rtacha</option>
                  <option>Past</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Muddat</label>
                <Input type="datetime-local" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
              <Button onClick={() => { toast.success("Vazifa yaratildi"); setShowForm(false) }}>Yaratish</Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Vazifa..." className="pl-9" />
            </div>
            <div className="flex gap-1">
              <button onClick={() => setStatusFilter(null)} className={`px-3 py-1.5 text-xs font-semibold rounded ${!statusFilter ? "bg-slate-900 text-white" : "bg-slate-100"}`}>Hammasi ({TASKS.length})</button>
              <button onClick={() => setStatusFilter("pending")} className={`px-3 py-1.5 text-xs font-semibold rounded ${statusFilter === "pending" ? "bg-slate-900 text-white" : "bg-amber-100 text-amber-700"}`}>Kutilmoqda ({TASKS.filter(t => t.status === "pending").length})</button>
              <button onClick={() => setStatusFilter("in_progress")} className={`px-3 py-1.5 text-xs font-semibold rounded ${statusFilter === "in_progress" ? "bg-slate-900 text-white" : "bg-blue-100 text-blue-700"}`}>Davom etyapti ({TASKS.filter(t => t.status === "in_progress").length})</button>
              <button onClick={() => setStatusFilter("completed")} className={`px-3 py-1.5 text-xs font-semibold rounded ${statusFilter === "completed" ? "bg-slate-900 text-white" : "bg-emerald-100 text-emerald-700"}`}>Bajarildi ({TASKS.filter(t => t.status === "completed").length})</button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {filtered.map(t => {
            const typeCfg = TYPE_CFG[t.type]
            return (
              <Card key={t.id} className={`p-4 hover:shadow-md transition-all border-l-4 border-${typeCfg.color}-500`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${typeCfg.color}-100 text-${typeCfg.color}-700 flex items-center justify-center flex-shrink-0`}>
                    {t.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> : t.status === "in_progress" ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{t.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold bg-${typeCfg.color}-100 text-${typeCfg.color}-700`}>{typeCfg.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.priority === "high" ? "bg-rose-100 text-rose-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {t.priority === "high" ? "Yuqori" : t.priority === "medium" ? "O'rtacha" : "Past"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mt-2 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.agent}</span>
                      <span>📍 {t.client}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.deadline}</span>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    t.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    t.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {t.status === "completed" ? "✓ Bajarildi" : t.status === "in_progress" ? "⏳ Davom etyapti" : "⚠ Kutilmoqda"}
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
