"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, ShoppingBag, Package, User, Wallet, Trash2, Edit2, Plus, Lock, Eye, AlertCircle, Download } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type LogEntry = { id: number; timestamp: string; user: string; action: string; entity: string; details: string; ip: string; severity: "info" | "warn" | "error" }

const ACTIONS: Record<string, { icon: any; accent: string; label: string }> = {
  create: { icon: Plus, accent: "#10B981", label: "Yaratildi" },
  update: { icon: Edit2, accent: "#3B82F6", label: "Tahrirlandi" },
  delete: { icon: Trash2, accent: "#C75D3C", label: "O'chirildi" },
  login: { icon: User, accent: "#7C3AED", label: "Tizimga kirdi" },
  payment: { icon: Wallet, accent: "#D97706", label: "To'lov" },
  order: { icon: ShoppingBag, accent: "#10B981", label: "Zakaz" },
  stock: { icon: Package, accent: "#06B6D4", label: "Sklad" },
  lock: { icon: Lock, accent: "#C75D3C", label: "Bloklandi" },
  view: { icon: Eye, accent: "#9C8A6E", label: "Ko'rib chiqildi" },
}

const LOGS: LogEntry[] = [
  { id: 9842, timestamp: "2026-05-02 12:45:22", user: "Mashrab S.", action: "create", entity: "Zakaz #1024", details: "Salom Magazin №1 — 1.24M so'm", ip: "192.168.1.5", severity: "info" },
  { id: 9841, timestamp: "2026-05-02 12:42:18", user: "Nurmatov A.", action: "payment", entity: "To'lov #5012", details: "Click 2.4M (Salom Magazin)", ip: "10.0.0.42", severity: "info" },
  { id: 9840, timestamp: "2026-05-02 12:38:45", user: "Karimov S.", action: "order", entity: "Zakaz #1023", details: "Lider Chakana — 580K", ip: "10.0.0.18", severity: "info" },
  { id: 9839, timestamp: "2026-05-02 12:30:12", user: "Mashrab S.", action: "delete", entity: "Klient #42", details: "Yopiq do'kon o'chirildi", ip: "192.168.1.5", severity: "warn" },
  { id: 9838, timestamp: "2026-05-02 12:25:08", user: "Nurmatov A.", action: "stock", entity: "Sklad korrektirovka", details: "8 ta tovar, -340K so'm farq", ip: "10.0.0.42", severity: "warn" },
  { id: 9837, timestamp: "2026-05-02 11:45:33", user: "Mashrab S.", action: "lock", entity: "Period closing", details: "Aprel 2026 yopildi (3 lock)", ip: "192.168.1.5", severity: "warn" },
  { id: 9836, timestamp: "2026-05-02 11:30:21", user: "Rasulov B.", action: "login", entity: "Mobile app", details: "Samsung S24 Android", ip: "37.110.214.84", severity: "info" },
  { id: 9835, timestamp: "2026-05-02 11:25:14", user: "Yusupov D.", action: "order", entity: "Zakaz #1022", details: "Optom Tovar — 4.8M", ip: "37.110.214.92", severity: "info" },
  { id: 9834, timestamp: "2026-05-02 10:18:42", user: "system", action: "delete", entity: "Auto-cleanup", details: "12 ta eski session tozalandi", ip: "127.0.0.1", severity: "info" },
  { id: 9833, timestamp: "2026-05-02 10:15:08", user: "Sobirova N.", action: "update", entity: "Klient #128", details: "Telefon raqam yangilandi", ip: "192.168.1.12", severity: "info" },
  { id: 9832, timestamp: "2026-05-02 09:42:15", user: "Mashrab S.", action: "create", entity: "Tovar #156", details: "Yangi SKU: Hilol pechenye 500g", ip: "192.168.1.5", severity: "info" },
  { id: 9831, timestamp: "2026-05-02 09:25:00", user: "Karimov S.", action: "login", entity: "Web app", details: "Chrome/Linux", ip: "10.0.0.18", severity: "info" },
  { id: 9830, timestamp: "2026-05-02 08:30:42", user: "system", action: "stock", entity: "Auto-reservation", details: "Zakaz #1024 → 12 ta tovar reserve", ip: "127.0.0.1", severity: "info" },
  { id: 9829, timestamp: "2026-05-02 08:15:00", user: "Ergashev F.", action: "view", entity: "Foyda hisoboti", details: "Aprel 2026 P&L", ip: "192.168.1.14", severity: "info" },
  { id: 9828, timestamp: "2026-05-01 23:55:00", user: "system", action: "delete", entity: "Failed payments", details: "3 ta failed transaction tozalandi", ip: "127.0.0.1", severity: "info" },
]

const SEVERITY_CFG = {
  info: { bg: "bg-[#F0EAE0]", text: "text-[#6B5B4D]", label: "INFO" },
  warn: { bg: "bg-[#FCE9DD]", text: "text-[#D97706]", label: "WARN" },
  error: { bg: "bg-[#F5E5D6]", text: "text-[#C75D3C]", label: "ERROR" },
}

export default function AuditLogPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<LogEntry[]>(isAuthenticated ? "/api/v1/audit-log" : null)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [severityFilter] = useState<string | null>(null)

  const filtered = LOGS.filter(l => {
    const matchSearch = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase())
    const matchAction = !actionFilter || l.action === actionFilter
    const matchSeverity = !severityFilter || l.severity === severityFilter
    return matchSearch && matchAction && matchSeverity
  })

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Audit <span className="italic text-[#C75D3C]">log</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Tizimdagi barcha o'zgarishlar · {LOGS.length} ta yozuv · So'nggi 24 soat</p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && api && Array.isArray(api) && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real API</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Eye} accent="#9C8A6E" label="Jami" value={LOGS.length.toString()} />
            <KpiCard icon={Plus} accent="#10B981" label="Yaratildi" value={LOGS.filter(l => l.action === "create" || l.action === "order").length.toString()} />
            <KpiCard icon={AlertCircle} accent="#D97706" label="Ogohlantirish" value={LOGS.filter(l => l.severity === "warn").length.toString()} />
            <KpiCard icon={User} accent="#7C3AED" label="User loginlari" value={LOGS.filter(l => l.action === "login").length.toString()} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="User, entity, details..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setActionFilter(null)} className={`px-2 py-1 text-xs font-medium rounded ${!actionFilter ? "bg-[#1A1A1A] text-white" : "bg-[#F0EAE0] text-[#6B5B4D] hover:bg-[#E8E0D3]"}`}>
                  Hammasi
                </button>
                {Object.entries(ACTIONS).map(([k, a]) => (
                  <button key={k} onClick={() => setActionFilter(k)} className={`px-2 py-1 text-xs font-medium rounded ${actionFilter === k ? "text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`} style={actionFilter === k ? { background: a.accent } : {}}>
                    {a.label}
                  </button>
                ))}
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
              {filtered.map(l => {
                const cfg = ACTIONS[l.action] || { icon: Eye, accent: "#9C8A6E", label: l.action }
                const Icon = cfg.icon
                const sev = SEVERITY_CFG[l.severity]
                return (
                  <div key={l.id} className="flex items-start gap-3 p-3 rounded-2xl border border-[#E8E0D3] hover:bg-[#FAF7F2] transition-all" style={{ background: `${cfg.accent}08` }}>
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: cfg.accent }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#1A1A1A]">{l.user}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sev.bg} ${sev.text}`}>{sev.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white" style={{ background: cfg.accent }}>{cfg.label}</span>
                        <span className="font-mono text-xs text-[#6B5B4D]">{l.entity}</span>
                      </div>
                      <div className="text-xs text-[#6B5B4D] mt-0.5">{l.details}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs font-mono text-[#9C8A6E]">{l.timestamp}</div>
                      <div className="text-[10px] font-mono text-[#9C8A6E] mt-0.5">{l.ip}</div>
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

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
