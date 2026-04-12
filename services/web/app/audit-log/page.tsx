"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ScrollText, Search, Edit, Trash2, Plus, LogIn, RefreshCw, AlertCircle,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

type AuditRow = {
  id: number; user_id: number; amal: string; jadval?: string;
  yozuv_id?: number; eski?: unknown; yangi?: unknown;
  ip?: string; manba: string; sana: string;
}

const ACTIONS: Record<string, { label: string; color: string; icon: typeof Plus }> = {
  create:       { label: "Yaratish",    color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300", icon: Plus },
  update:       { label: "Tahrirlash",  color: "bg-blue-500/15 text-blue-800 dark:text-blue-300",       icon: Edit },
  delete:       { label: "O'chirish",   color: "bg-rose-500/15 text-rose-800 dark:text-rose-300",         icon: Trash2 },
  bekor_qilish: { label: "Bekor qilish", color: "bg-orange-500/15 text-orange-800 dark:text-orange-300",  icon: Trash2 },
  login:        { label: "Login",       color: "bg-violet-500/15 text-purple-800",   icon: LogIn },
}

async function api<T = unknown>(path: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
  const base  = process.env.NEXT_PUBLIC_API_URL || ""
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditRow[]>([])
  const [stats, setStats] = useState<{ jami?: number; turli_jadval?: number; turli_amal?: number }>({})
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = filter !== "all" ? `?amal=${filter}` : ""
      const data = await api<{ items: AuditRow[]; stats: typeof stats }>(`/api/v1/audit-log${qs}`)
      setItems(data.items || [])
      setStats(data.stats || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = items.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (l.amal || "").toLowerCase().includes(q) ||
      (l.jadval || "").toLowerCase().includes(q) ||
      String(l.yozuv_id || "").includes(q)
    )
  })

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={ScrollText}
          gradient="blue"
          title="Audit log"
          subtitle="Tizimda bajarilgan barcha amallar tarixi"
          action={
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami amallar</div>
            <div className="text-2xl font-bold mt-1">{stats.jami || 0}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Turli jadvallar</div>
            <div className="text-2xl font-bold mt-1">{stats.turli_jadval || 0}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Amal turlari</div>
            <div className="text-2xl font-bold mt-1">{stats.turli_amal || 0}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}>
            Hammasi
          </Button>
          {Object.entries(ACTIONS).map(([k, meta]) => (
            <Button key={k} size="sm"
                    variant={filter === k ? "default" : "outline"}
                    onClick={() => setFilter(k)}>
              <meta.icon className="w-3 h-3 mr-1" />
              {meta.label}
            </Button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Jadval yoki yozuv ID bo'yicha..."
                 value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">#</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Amal</TableHead>
                <TableHead>Jadval</TableHead>
                <TableHead>Yozuv ID</TableHead>
                <TableHead>Tafsilot</TableHead>
                <TableHead>Manba</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Audit log yozuvlari yo&apos;q
                  </TableCell>
                </TableRow>
              ) : filtered.map(l => {
                const meta = ACTIONS[l.amal] || { label: l.amal, color: "bg-muted text-foreground", icon: ScrollText }
                const Icon = meta.icon
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">#{l.id}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(l.sana).toLocaleString("uz-UZ")}
                    </TableCell>
                    <TableCell>
                      <Badge className={meta.color}>
                        <Icon className="w-3 h-3 mr-1 inline" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.jadval || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{l.yozuv_id || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {l.yangi ? JSON.stringify(l.yangi) : l.eski ? JSON.stringify(l.eski) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{l.manba}</Badge>
                    </TableCell>
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
