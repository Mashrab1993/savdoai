"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { UserCog, Plus, Pencil, Trash2, Search, Shield, Eye, EyeOff } from "lucide-react"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const ROLES = [
  { key: "admin", label: "Administrator", color: "bg-rose-500/15 text-rose-800 dark:text-rose-300" },
  { key: "manager", label: "Menejer", color: "bg-violet-500/15 text-purple-800" },
  { key: "operator", label: "Operator", color: "bg-blue-500/15 text-blue-800 dark:text-blue-300" },
  { key: "kassir", label: "Kassir", color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  { key: "agent", label: "Agent", color: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  { key: "expeditor", label: "Expeditor", color: "bg-orange-500/15 text-orange-800 dark:text-orange-300" },
  { key: "supervisor", label: "Supervisor", color: "bg-indigo-100 text-indigo-800" },
  { key: "merchant", label: "Mer chendayzer", color: "bg-pink-100 text-pink-800" },
  { key: "warehouse", label: "Sklad ishchisi", color: "bg-teal-100 text-teal-800" },
]

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ ism: "", login: "", parol: "", email: "", telefon: "", rol: "operator" })
  const [users] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Users}
          gradient="violet"
          title="Foydalanuvchilar"
          subtitle="Tizim foydalanuvchilari va huquqlar"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi foydalanuvchi
          </Button>
        </div>

        {/* Roles overview */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {ROLES.slice(0, 5).map(r => (
            <div key={r.key} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-3 text-center">
              <Shield className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
              <div className="text-xs font-medium">{r.label}</div>
              <div className="text-lg font-bold">0</div>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>F.I.O.</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-center">Rol</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Foydalanuvchilar topilmadi
                  </TableCell>
                </TableRow>
              ) : users.map((u: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.ism}</TableCell>
                  <TableCell className="font-mono">{u.login}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.telefon}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={ROLES.find(r => r.key === u.rol)?.color || "bg-muted text-muted-foreground"}>
                      {ROLES.find(r => r.key === u.rol)?.label || u.rol}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center"><Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Faol</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi foydalanuvchi</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">F.I.O. *</label>
                <Input value={form.ism} onChange={e => setForm({...form, ism: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Login *</label>
                  <Input value={form.login} onChange={e => setForm({...form, login: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Parol *</label>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} value={form.parol} onChange={e => setForm({...form, parol: e.target.value})} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})} placeholder="+998 90 123 45 67" />
              </div>
              <div>
                <label className="text-sm font-medium">Rol *</label>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button className="bg-emerald-600">Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
