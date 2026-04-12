"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import {
  Users, UserPlus, Search, Phone, MapPin, Shield, Truck, Eye,
  Pencil, Trash2, Signal, SignalZero, Smartphone,
} from "lucide-react"
import { useApi } from "@/hooks/use-api"

type StaffRole = "agent" | "expeditor" | "supervisor"

interface StaffMember {
  id: number
  ism: string
  telefon: string
  login: string
  rol: StaffRole
  kod: string
  faol: boolean
  oxirgi_sync?: string
  app_versiya?: string
  qurilma?: string
}

const ROLE_LABELS: Record<StaffRole, { label: string; color: string; icon: any }> = {
  agent:      { label: "Agent",      color: "bg-blue-100 text-blue-800",      icon: Users },
  expeditor:  { label: "Expeditor",  color: "bg-orange-100 text-orange-800",  icon: Truck },
  supervisor: { label: "Supervisor", color: "bg-purple-100 text-purple-800",  icon: Shield },
}

export default function StaffPage() {
  const [tab, setTab] = useState<StaffRole>("agent")
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ism: "", telefon: "", login: "", parol: "", kod: "", rol: "agent" as StaffRole })

  // Mock data - will connect to API
  const [staff] = useState<StaffMember[]>([])

  const filtered = staff.filter(s => {
    if (s.rol !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return s.ism.toLowerCase().includes(q) || s.login.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    agent: staff.filter(s => s.rol === "agent").length,
    expeditor: staff.filter(s => s.rol === "expeditor").length,
    supervisor: staff.filter(s => s.rol === "supervisor").length,
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-600" />
              Xodimlar boshqaruvi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agentlar, expeditorlar, supervisorlar
            </p>
          </div>
          <Button onClick={() => { setForm({ ...form, rol: tab }); setShowAdd(true) }} className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4 mr-1" /> Yangi {ROLE_LABELS[tab].label}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={v => setTab(v as StaffRole)}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="agent" className="gap-1">
              <Users className="w-4 h-4" /> Agentlar ({counts.agent})
            </TabsTrigger>
            <TabsTrigger value="expeditor" className="gap-1">
              <Truck className="w-4 h-4" /> Expeditorlar ({counts.expeditor})
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="gap-1">
              <Shield className="w-4 h-4" /> Supervisorlar ({counts.supervisor})
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Ism yoki login bo'yicha qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {/* Table for each tab */}
          {(["agent", "expeditor", "supervisor"] as StaffRole[]).map(role => (
            <TabsContent key={role} value={role}>
              <div className="bg-card rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>F.I.O.</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-center">Kod</TableHead>
                      {role !== "supervisor" && <TableHead className="text-center">Oxirgi sync</TableHead>}
                      {role !== "supervisor" && <TableHead className="text-center">Qurilma</TableHead>}
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={role !== "supervisor" ? 9 : 7} className="text-center py-10 text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          {ROLE_LABELS[role].label}lar topilmadi
                          <div className="text-xs mt-1">Telegram bot orqali agentlar avtomatik qo'shiladi</div>
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.ism}</TableCell>
                        <TableCell className="font-mono text-sm">{s.login}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" /> {s.telefon}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">{s.kod || "-"}</TableCell>
                        {role !== "supervisor" && (
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {s.oxirgi_sync || "Hali sync qilmagan"}
                          </TableCell>
                        )}
                        {role !== "supervisor" && (
                          <TableCell className="text-center">
                            {s.qurilma ? (
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <Smartphone className="w-3 h-3" /> {s.qurilma}
                              </div>
                            ) : "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <Badge className={s.faol ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
                            {s.faol ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi {ROLE_LABELS[form.rol].label} qo'shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">F.I.O. *</label>
                <Input value={form.ism} onChange={e => setForm({ ...form, ism: e.target.value })} placeholder="Ism Familiya" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="+998 90 123 45 67" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Login *</label>
                  <Input value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} placeholder="login" />
                </div>
                <div>
                  <label className="text-sm font-medium">Parol *</label>
                  <Input type="password" value={form.parol} onChange={e => setForm({ ...form, parol: e.target.value })} placeholder="********" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Kod</label>
                <Input value={form.kod} onChange={e => setForm({ ...form, kod: e.target.value })} placeholder="Agent kodi" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
