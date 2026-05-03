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

const TYPE_CFG: Record<string, { tone: string; bar: string; label: string }> = {
  storecheck: { tone: "bg-blue-50 text-blue-700", bar: "border-blue-500", label: "Storecheck" },
  delivery: { tone: "bg-purple-50 text-purple-700", bar: "border-purple-500", label: "Yetkazish" },
  collection: { tone: "bg-[#FCE9DD] text-[#D97706]", bar: "border-[#D97706]", label: "Inkasaciya" },
  photo: { tone: "bg-emerald-50 text-emerald-700", bar: "border-emerald-500", label: "Foto" },
  install: { tone: "bg-[#F5E5D6] text-[#C75D3C]", bar: "border-[#C75D3C]", label: "Montaj" },
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Vazifalar <span className="italic text-[#C75D3C]">agent tasks</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{TASKS.length} ta vazifa · jamoaga tayinlangan</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi vazifa</Button>
          </div>

          {showForm && (
            <Card className="bg-white border border-[#C75D3C] shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Yangi vazifa yaratish</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Sarlavha *</label>
                  <Input placeholder="Storecheck Klient X" className="border-[#E8E0D3]" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Agent</label>
                  <select className="w-full px-3 py-2 border border-[#E8E0D3] rounded-lg text-sm bg-white text-[#1A1A1A]">
                    <option>Nurmatov A.</option>
                    <option>Karimov S.</option>
                    <option>Rasulov B.</option>
                    <option>Yusupov D.</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Klient</label>
                  <Input placeholder="Klient nomi" className="border-[#E8E0D3]" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Tur</label>
                  <select className="w-full px-3 py-2 border border-[#E8E0D3] rounded-lg text-sm bg-white text-[#1A1A1A]">
                    {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Muhimligi</label>
                  <select className="w-full px-3 py-2 border border-[#E8E0D3] rounded-lg text-sm bg-white text-[#1A1A1A]">
                    <option>Yuqori</option>
                    <option>O'rtacha</option>
                    <option>Past</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Muddat</label>
                  <Input type="datetime-local" className="border-[#E8E0D3]" />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-[#E8E0D3] text-[#6B5B4D]">Bekor</Button>
                <Button onClick={() => { toast.success("Vazifa yaratildi"); setShowForm(false) }} className="text-white" style={{ background: "#C75D3C" }}>Yaratish</Button>
              </div>
            </Card>
          )}

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Vazifa..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setStatusFilter(null)} className={`px-3 py-1.5 text-xs font-medium rounded ${!statusFilter ? "text-white" : "bg-[#F0EAE0] text-[#6B5B4D]"}`} style={!statusFilter ? { background: "#C75D3C" } : undefined}>Hammasi ({TASKS.length})</button>
                <button onClick={() => setStatusFilter("pending")} className={`px-3 py-1.5 text-xs font-medium rounded ${statusFilter === "pending" ? "text-white" : "bg-[#FCE9DD] text-[#D97706]"}`} style={statusFilter === "pending" ? { background: "#C75D3C" } : undefined}>Kutilmoqda ({TASKS.filter(t => t.status === "pending").length})</button>
                <button onClick={() => setStatusFilter("in_progress")} className={`px-3 py-1.5 text-xs font-medium rounded ${statusFilter === "in_progress" ? "text-white" : "bg-blue-50 text-blue-700"}`} style={statusFilter === "in_progress" ? { background: "#C75D3C" } : undefined}>Davom etyapti ({TASKS.filter(t => t.status === "in_progress").length})</button>
                <button onClick={() => setStatusFilter("completed")} className={`px-3 py-1.5 text-xs font-medium rounded ${statusFilter === "completed" ? "text-white" : "bg-emerald-50 text-emerald-700"}`} style={statusFilter === "completed" ? { background: "#C75D3C" } : undefined}>Bajarildi ({TASKS.filter(t => t.status === "completed").length})</button>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            {filtered.map(t => {
              const typeCfg = TYPE_CFG[t.type]
              return (
                <Card key={t.id} className={`bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 hover:shadow-md transition-all border-l-4 ${typeCfg.bar}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${typeCfg.tone} flex items-center justify-center flex-shrink-0`}>
                      {t.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> : t.status === "in_progress" ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-[#1A1A1A]">{t.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeCfg.tone}`}>{typeCfg.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.priority === "high" ? "bg-[#F5E5D6] text-[#C75D3C]" : t.priority === "medium" ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F0EAE0] text-[#6B5B4D]"}`}>
                          {t.priority === "high" ? "Yuqori" : t.priority === "medium" ? "O'rtacha" : "Past"}
                        </span>
                      </div>
                      <div className="text-sm text-[#6B5B4D] mt-2 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.agent}</span>
                        <span>{t.client}</span>
                        <span className="flex items-center gap-1 font-mono tabular-nums"><Calendar className="w-3 h-3" /> {t.deadline}</span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                      t.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                      t.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                      "bg-[#FCE9DD] text-[#D97706]"
                    }`}>
                      {t.status === "completed" ? "Bajarildi" : t.status === "in_progress" ? "Davom etyapti" : "Kutilmoqda"}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
