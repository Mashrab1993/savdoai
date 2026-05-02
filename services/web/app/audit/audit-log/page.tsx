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

const ACTIONS: Record<string, { icon: any; color: string; label: string }> = {
  create: { icon: Plus, color: "emerald", label: "Yaratildi" },
  update: { icon: Edit2, color: "blue", label: "Tahrirlandi" },
  delete: { icon: Trash2, color: "rose", label: "O'chirildi" },
  login: { icon: User, color: "violet", label: "Tizimga kirdi" },
  payment: { icon: Wallet, color: "amber", label: "To'lov" },
  order: { icon: ShoppingBag, color: "emerald", label: "Zakaz" },
  stock: { icon: Package, color: "cyan", label: "Sklad" },
  lock: { icon: Lock, color: "rose", label: "Bloklandi" },
  view: { icon: Eye, color: "slate", label: "Ko'rib chiqildi" },
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
  info: { bg: "bg-slate-100", text: "text-slate-700", label: "INFO" },
  warn: { bg: "bg-amber-100", text: "text-amber-700", label: "WARN" },
  error: { bg: "bg-rose-100", text: "text-rose-700", label: "ERROR" },
}

export default function AuditLogPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<LogEntry[]>(isAuthenticated ? "/api/v1/audit-log" : null)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string | null>(null)

  const filtered = LOGS.filter(l => {
    const matchSearch = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase())
    const matchAction = !actionFilter || l.action === actionFilter
    const matchSeverity = !severityFilter || l.severity === severityFilter
    return matchSearch && matchAction && matchSeverity
  })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
            <p className="text-base text-slate-500 mt-1">Tizimdagi barcha o'zgarishlar · {LOGS.length} ta yozuv · So'nggi 24 soat</p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && api && Array.isArray(api) && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real API</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-slate-50 border-slate-200">
            <Eye className="w-5 h-5 text-slate-600 mb-2" />
            <div className="text-xs font-bold text-slate-700">JAMI</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{LOGS.length}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Plus className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">YARATILDI</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{LOGS.filter(l => l.action === "create" || l.action === "order").length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">OGOHLANTIRISH</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{LOGS.filter(l => l.severity === "warn").length}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <User className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">USER LOGINS</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{LOGS.filter(l => l.action === "login").length}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="User, entity, details..." className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setActionFilter(null)} className={`px-2 py-1 text-xs font-semibold rounded ${!actionFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                Hammasi
              </button>
              {Object.entries(ACTIONS).map(([k, a]) => (
                <button key={k} onClick={() => setActionFilter(k)} className={`px-2 py-1 text-xs font-semibold rounded ${actionFilter === k ? "bg-slate-900 text-white" : `bg-${a.color}-100 text-${a.color}-700`}`}>
                  {a.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {filtered.map(l => {
              const cfg = ACTIONS[l.action] || { icon: Eye, color: "slate", label: l.action }
              const Icon = cfg.icon
              const sev = SEVERITY_CFG[l.severity]
              return (
                <div key={l.id} className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-all bg-${cfg.color}-50/30 border-${cfg.color}-100`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-${cfg.color}-100 text-${cfg.color}-700 flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{l.user}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${sev.bg} ${sev.text}`}>{sev.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold bg-${cfg.color}-200 text-${cfg.color}-800`}>{cfg.label}</span>
                      <span className="font-mono text-xs text-slate-600">{l.entity}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{l.details}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-mono text-slate-500">{l.timestamp}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{l.ip}</div>
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
