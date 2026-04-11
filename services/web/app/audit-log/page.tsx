"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollText, Search, Filter, User, Edit, Trash2, Plus, LogIn } from "lucide-react"

const ACTIONS: Record<string, { label: string; color: string; icon: any }> = {
  create: { label: "Yaratish",   color: "bg-emerald-100 text-emerald-800", icon: Plus },
  update: { label: "Tahrirlash", color: "bg-blue-100 text-blue-800",       icon: Edit },
  delete: { label: "O'chirish",  color: "bg-red-100 text-red-800",         icon: Trash2 },
  login:  { label: "Login",      color: "bg-purple-100 text-purple-800",   icon: LogIn },
}

const DEMO_LOGS = [
  { id: 1, vaqt: "2026-04-11 02:30", user: "admin", action: "create", object: "Tovar", details: "Yangi tovar: 'Shampun X'", ip: "192.168.1.10" },
  { id: 2, vaqt: "2026-04-11 02:25", user: "operator1", action: "update", object: "Mijoz", details: "Mijoz #45 telefoni o'zgartirildi", ip: "192.168.1.20" },
  { id: 3, vaqt: "2026-04-11 02:20", user: "kassir1", action: "create", object: "Sotuv", details: "Sotuv #1234 yaratildi (250K so'm)", ip: "192.168.1.30" },
  { id: 4, vaqt: "2026-04-11 02:15", user: "admin", action: "delete", object: "Mijoz", details: "Mijoz #12 o'chirildi", ip: "192.168.1.10" },
  { id: 5, vaqt: "2026-04-11 02:00", user: "admin", action: "login", object: "Tizim", details: "Login muvaffaqiyatli", ip: "192.168.1.10" },
]

export default function AuditLogPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [logs] = useState(DEMO_LOGS)

  const filtered = logs.filter(l => {
    if (filter !== "all" && l.action !== filter) return false
    if (search && !l.details.toLowerCase().includes(search.toLowerCase()) && !l.user.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-emerald-600" />
            Audit log (Faoliyat tarixi)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tizimda bajarilgan barcha amallar tarixi</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(ACTIONS).map(([k, a]) => (
            <button key={k} onClick={() => setFilter(k)} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-md transition ${filter === k ? "border-emerald-500" : ""}`}>
              <div className="flex items-center gap-2 text-sm">
                <a.icon className="w-4 h-4" />
                {a.label}
              </div>
              <div className="text-2xl font-bold mt-1">{logs.filter(l => l.action === k).length}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" onClick={() => setFilter("all")}>Hammasi</Button>
          <Input type="date" className="w-40" />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaqt</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead className="text-center">Amal</TableHead>
                <TableHead>Obyekt</TableHead>
                <TableHead>Tafsilot</TableHead>
                <TableHead>IP manzil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Loglar topilmadi
                  </TableCell>
                </TableRow>
              ) : filtered.map(l => {
                const action = ACTIONS[l.action]
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm font-mono">{l.vaqt}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{l.user}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={action.color + " text-xs"}>
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.label}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{l.object}</Badge></TableCell>
                    <TableCell className="text-sm">{l.details}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{l.ip}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
