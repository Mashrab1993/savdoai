"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageLoading, PageError } from "@/components/ui/loading"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import { adaptApprentice } from "@/lib/adapters"
import {
  apprentices as mockApprentices,
  apprenticeExpenses,
  type Apprentice,
} from "@/lib/mock-data"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  GraduationCap, Search, Plus, ChevronRight, Pencil, Trash2,
  Wallet, AlertCircle, TrendingUp, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

function LimitBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const color = pct >= 90 ? "bg-destructive" : pct >= 65 ? "bg-yellow-500" : "bg-primary"
  return (
    <div className="space-y-1">
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground">{fmt(spent)} / {fmt(limit)}</p>
    </div>
  )
}

const emptyForm = { name: "", role: "", phone: "", status: "active" as Apprentice["status"], dailyLimit: 200000, monthlyLimit: 4000000 }

export default function ApprenticesPage() {
  const { locale } = useLocale()
  const L = translations.apprentices
  const { data: apiData, loading, error, reload } = useApi(() => api.getShogirdlar(), [])
  const [apprentices, setApprentices] = useState<Apprentice[]>(mockApprentices)

  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      setApprentices(apiData.map((x: Record<string, unknown>) => adaptApprentice(x) as Apprentice))
    } else if (apiData && typeof apiData === "object" && "items" in apiData && Array.isArray((apiData as { items: unknown[] }).items)) {
      setApprentices((apiData as { items: Record<string, unknown>[] }).items.map(x => adaptApprentice(x) as Apprentice))
    }
  }, [apiData])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<Apprentice | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Apprentice | null>(null)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({})

  const filtered = apprentices.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalMonthlyBudget = apprentices.reduce((s, a) => s + a.monthlyLimit, 0)
  const totalSpentToday = apprentices.reduce((s, a) => s + a.spentToday, 0)
  const activeCount = apprentices.filter(a => a.status === "active").length

  if (loading) return <AdminLayout title={L.title[locale]}><PageLoading /></AdminLayout>
  if (error) return <AdminLayout title={L.title[locale]}><PageError message={error} onRetry={reload} /></AdminLayout>

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(a: Apprentice) {
    setEditing(a)
    setForm({ name: a.name, role: a.role, phone: a.phone, status: a.status, dailyLimit: a.dailyLimit, monthlyLimit: a.monthlyLimit })
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const e: Partial<typeof emptyForm> = {}
    if (!form.name.trim()) e.name = "Ism kiritish shart"
    if (!form.role.trim()) e.role = "Lavozim kiritish shart"
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (editing) {
      setApprentices(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a))
    } else {
      const newA: Apprentice = {
        id: `ap${Date.now()}`, ...form,
        spentToday: 0, spentThisMonth: 0, joinedAt: new Date().toISOString().slice(0, 10),
      }
      setApprentices(prev => [...prev, newA])
    }
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    setApprentices(prev => prev.filter(a => a.id !== id))
  }

  const selectedExpenses = selected
    ? apprenticeExpenses.filter(e => e.apprenticeId === selected.id)
    : []

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: L.totalStaff[locale],   value: String(apprentices.length), icon: Users,       color: "text-primary",    bg: "bg-secondary" },
            { label: L.activeStaff[locale],  value: String(activeCount),         icon: GraduationCap, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
            { label: L.monthlyBudget[locale], value: fmt(totalMonthlyBudget),    icon: Wallet,      color: "text-purple-500", bg: "bg-secondary" },
            { label: L.todayExpenses[locale], value: fmt(totalSpentToday),       icon: TrendingUp,  color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={cn("p-2 rounded-lg shrink-0", s.bg, s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={L.searchPlaceholder[locale]}
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={L.allStatus[locale]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
                <SelectItem value="active">{translations.status.active[locale]}</SelectItem>
                <SelectItem value="inactive">{translations.status.inactive[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> {L.addApprentice[locale]}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.staffMember[locale]}</TableHead>
                <TableHead>{translations.fields.status[locale]}</TableHead>
                <TableHead>{L.dailyLimit[locale]}</TableHead>
                <TableHead>{L.monthlyLimit[locale]}</TableHead>
                <TableHead>{L.spent[locale]} (oy)</TableHead>
                <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {L.noStaff[locale]}
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => {
                const dayPct = a.dailyLimit > 0 ? (a.spentToday / a.dailyLimit) * 100 : 0
                const isOverLimit = dayPct >= 90
                return (
                  <TableRow
                    key={a.id}
                    className={cn(
                      "border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer",
                      isOverLimit && a.status === "active" && "bg-red-50/50 dark:bg-red-900/10"
                    )}
                    onClick={() => setSelected(a)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {a.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {isOverLimit && a.status === "active" && (
                            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          )}
                          <span className={cn("text-sm font-medium", isOverLimit && a.status === "active" ? "text-destructive" : "text-foreground")}>
                            {fmt(a.spentToday)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">/ {fmt(a.dailyLimit)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <LimitBar spent={a.spentThisMonth} limit={a.monthlyLimit} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{fmt(a.spentThisMonth)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={e => { e.stopPropagation(); openEdit(a) }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{L.details[locale]}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                {/* Profile card */}
                <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selected.name}</p>
                    <p className="text-sm text-muted-foreground">{selected.role}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{selected.phone}</p>
                  </div>
                  <div className="ml-auto"><StatusBadge status={selected.status} /></div>
                </div>

                {/* Limit overview */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Limit holati</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{L.dailyLimit[locale]}</span>
                        <span className="text-xs font-medium text-foreground">{fmt(selected.spentToday)} / {fmt(selected.dailyLimit)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        {(() => {
                          const pct = selected.dailyLimit > 0 ? Math.min((selected.spentToday / selected.dailyLimit) * 100, 100) : 0
                          return (
                            <div
                              className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-destructive" : pct >= 65 ? "bg-yellow-500" : "bg-primary")}
                              style={{ width: `${pct}%` }}
                            />
                          )
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{L.monthlyLimit[locale]}</span>
                        <span className="text-xs font-medium text-foreground">{fmt(selected.spentThisMonth)} / {fmt(selected.monthlyLimit)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        {(() => {
                          const pct = selected.monthlyLimit > 0 ? Math.min((selected.spentThisMonth / selected.monthlyLimit) * 100, 100) : 0
                          return (
                            <div
                              className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-destructive" : pct >= 65 ? "bg-yellow-500" : "bg-primary")}
                              style={{ width: `${pct}%` }}
                            />
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent expenses */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">{L.recentExpenses[locale]}</h4>
                  {selectedExpenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bugun xarajat yo'q.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedExpenses.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between py-2.5 px-3 bg-secondary rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-foreground">{exp.description}</p>
                            <p className="text-xs text-muted-foreground">{exp.date}</p>
                          </div>
                          <span className="text-sm font-semibold text-destructive">{fmt(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info rows */}
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  {[
                    { label: "Qo'shilgan sana", value: selected.joinedAt },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={() => { openEdit(selected); setSelected(null) }}>
                  <Pencil className="w-4 h-4" /> {translations.actions.edit[locale]}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Shogirdni tahrirlash" : "Yangi shogird qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>To'liq ism</Label>
              <Input
                placeholder="Akbar Raximov"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Lavozim</Label>
              <Input
                placeholder="Savdo bo'yicha yordamchi"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className={errors.role ? "border-destructive" : ""}
              />
              {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{translations.fields.phone[locale]}</Label>
              <Input
                placeholder="+998 90 000-0000"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{L.dailyLimit[locale]} (so'm)</Label>
              <Input
                type="number"
                value={form.dailyLimit}
                onChange={e => setForm(p => ({ ...p, dailyLimit: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{L.monthlyLimit[locale]} (so'm)</Label>
              <Input
                type="number"
                value={form.monthlyLimit}
                onChange={e => setForm(p => ({ ...p, monthlyLimit: Number(e.target.value) }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{translations.fields.status[locale]}</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as Apprentice["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{translations.status.active[locale]}</SelectItem>
                  <SelectItem value="inactive">{translations.status.inactive[locale]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleSave}>{editing ? translations.actions.save[locale] : L.addApprentice[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
