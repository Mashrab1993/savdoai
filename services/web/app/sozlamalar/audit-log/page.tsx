"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Activity, Eye, Edit, Trash2, LogIn, Shield } from "lucide-react"
import Link from "next/link"

type AuditEvent = {
  id: number; timestamp: string; user: string; ip: string;
  action: "login" | "create" | "update" | "delete" | "view" | "export";
  module: string; entityId: string; description: string;
  status: "success" | "failed";
}

const EVENTS: AuditEvent[] = [
  { id: 1, timestamp: "2026-05-02 10:25:14", user: "Mashrab (Admin)", ip: "188.95.165.40", action: "create", module: "Sotuv", entityId: "Order #9024", description: "Yangi zakaz yaratildi", status: "success" },
  { id: 2, timestamp: "2026-05-02 10:18:32", user: "Mashrab (Admin)", ip: "188.95.165.40", action: "update", module: "Klient", entityId: "#1024", description: "Klient telefoni o'zgardi", status: "success" },
  { id: 3, timestamp: "2026-05-02 10:12:08", user: "Babadjanova N.", ip: "92.241.52.110", action: "create", module: "Sotuv", entityId: "Order #9023", description: "Yangi zakaz yaratildi", status: "success" },
  { id: 4, timestamp: "2026-05-02 10:05:52", user: "Berdiyev R.", ip: "92.241.48.72", action: "view", module: "Klient", entityId: "#1058", description: "Klient karta ochildi", status: "success" },
  { id: 5, timestamp: "2026-05-02 09:58:24", user: "ДАВЛАТ", ip: "92.241.51.18", action: "update", module: "Sklad", entityId: "Stock #BJ-050", description: "Inventarizatsiya tugadi", status: "success" },
  { id: 6, timestamp: "2026-05-02 09:42:11", user: "Sayitqulov M.", ip: "82.215.99.14", action: "delete", module: "Sotuv", entityId: "Order #9020 (qoralama)", description: "Qoralama o'chirildi", status: "success" },
  { id: 7, timestamp: "2026-05-02 09:30:45", user: "BORIEV M.", ip: "92.241.50.28", action: "export", module: "Hisobot", entityId: "Aprel-foyda.xlsx", description: "Excel eksport qilindi", status: "success" },
  { id: 8, timestamp: "2026-05-02 08:55:18", user: "unknown@hotmail.com", ip: "144.31.122.18", action: "login", module: "Tizim", entityId: "—", description: "Login urinishi (noto'g'ri parol)", status: "failed" },
  { id: 9, timestamp: "2026-05-02 08:42:07", user: "Турсунов Ж.", ip: "92.241.49.45", action: "login", module: "Tizim", entityId: "—", description: "Login muvaffaqiyatli", status: "success" },
  { id: 10, timestamp: "2026-05-02 08:30:12", user: "Mashrab (Admin)", ip: "188.95.165.40", action: "update", module: "Sozlamalar", entityId: "permissions", description: "Menejer rolida 'delete' o'chirildi", status: "success" },
  { id: 11, timestamp: "2026-05-02 08:18:55", user: "Aminov R. (Ekspeditor)", ip: "92.241.48.99", action: "create", module: "Yetkazma", entityId: "Shipment #7024", description: "Yetkazma yaratildi", status: "success" },
  { id: 12, timestamp: "2026-05-02 08:05:30", user: "Mashrab (Admin)", ip: "188.95.165.40", action: "login", module: "Tizim", entityId: "—", description: "Login muvaffaqiyatli (Telegram OAuth)", status: "success" },
]

const ACTION_ICON: Record<string, any> = {
  login: LogIn, create: Edit, update: Edit, delete: Trash2, view: Eye, export: Download,
}
const ACTION_COLOR: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-amber-100 text-amber-700",
  delete: "bg-rose-100 text-rose-700",
  view: "bg-slate-100 text-slate-700",
  export: "bg-violet-100 text-violet-700",
}
const ACTION_LABEL: Record<string, string> = {
  login: "Kirish", create: "Yaratish", update: "O'zgartirish", delete: "O'chirish", view: "Ko'rish", export: "Eksport",
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = EVENTS
    .filter(e => actionFilter === "all" || e.action === actionFilter)
    .filter(e => statusFilter === "all" || e.status === statusFilter)
    .filter(e => !search || e.user.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()))

  const failedCount = EVENTS.filter(e => e.status === "failed").length
  const uniqueUsers = new Set(EVENTS.map(e => e.user)).size

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Tizim audit jurnali</h1>
            <p className="text-sm text-slate-500">{EVENTS.length} ta voqea · {uniqueUsers} foydalanuvchi · {failedCount} muvaffaqiyatsiz</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 24-soat</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Activity className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Muvaffaqiyatli</div>
            <div className="text-2xl font-bold mt-1">{EVENTS.filter(e => e.status === "success").length}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <Shield className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Muvaffaqiyatsiz</div>
            <div className="text-2xl font-bold mt-1">{failedCount}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <LogIn className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Login urinishlari</div>
            <div className="text-2xl font-bold mt-1">{EVENTS.filter(e => e.action === "login").length}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Eye className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Foydalanuvchi</div>
            <div className="text-2xl font-bold mt-1">{uniqueUsers}</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="all">Barcha amallar</option>
              {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="all">Barcha holat</option>
              <option value="success">✓ Muvaffaqiyatli</option>
              <option value="failed">✕ Xato</option>
            </select>
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="User yoki tavsif..." className="pl-9 w-64" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" /> Voqealar oqimi</h2>
          <div className="space-y-2">
            {filtered.map(e => {
              const Icon = ACTION_ICON[e.action]
              return (
                <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg border ${e.status === "failed" ? "bg-rose-50/50 border-rose-200" : "bg-white border-slate-200"}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ACTION_COLOR[e.action]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${ACTION_COLOR[e.action]}`}>{ACTION_LABEL[e.action]}</span>
                      <span className="text-sm font-semibold">{e.module}</span>
                      <span className="text-xs font-mono text-slate-500">{e.entityId}</span>
                      {e.status === "failed" && <span className="text-xs px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold">XATO</span>}
                    </div>
                    <div className="text-sm text-slate-700">{e.description}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span><span className="font-semibold">{e.user}</span></span>
                      <span className="font-mono">📍 {e.ip}</span>
                      <span className="font-mono">{e.timestamp}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {failedCount > 0 && (
          <Card className="p-5 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-800">Xavfsizlik ogohlantirishi</h3>
                <p className="text-sm text-slate-700 mt-1">
                  Oxirgi 24 soatda {failedCount} ta muvaffaqiyatsiz urinish qayd etildi (asosan login).
                  Agar bu sizdan emas — IP adresni bloklash va parolni o'zgartirish tavsiya etiladi.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
