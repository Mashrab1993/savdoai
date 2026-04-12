"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  Search, Plus, Check, X, Clock,
  AlertCircle, Wallet, TrendingDown, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { expenseService } from "@/lib/api/services"
import { normalizeExpense, type ExpenseVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

const CATEGORY_COLORS: Record<string, string> = {
  "Ijara":       "hsl(var(--chart-1))",
  "Transport":   "hsl(var(--chart-2))",
  "Oziq-ovqat":  "hsl(var(--chart-3))",
  "Kommunal":    "hsl(var(--chart-4))",
  "Marketing":   "hsl(var(--chart-5))",
  "Jihozlar":    "hsl(var(--primary))",
}

function getColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "hsl(var(--muted-foreground))"
}

const ALL_CATEGORIES = ["Ijara", "Transport", "Oziq-ovqat", "Kommunal", "Marketing", "Jihozlar"]
const emptyForm = { title: "", category: "Transport", amount: 0, requestedBy: "", notes: "" }

export default function ExpensesPage() {
  const { locale } = useLocale()
  const L = translations.expenses

  const { data: rawExpenses, loading, error, refetch } = useApi(expenseService.monthly)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<typeof emptyForm>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const expenses: ExpenseVM[] = (rawExpenses ?? []).map(normalizeExpense)

  const filtered = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.author.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === "all" || e.category === categoryFilter
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayExpenses = expenses.filter(e => e.date === todayStr && e.status !== "rejected")
    .reduce((s, e) => s + e.amount, 0)
  const monthlyExpenses = expenses.filter(e => e.status !== "rejected")
    .reduce((s, e) => s + e.amount, 0)
  const pendingCount = expenses.filter(e => e.status === "pending").length

  const categoryData = ALL_CATEGORIES.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat && e.status !== "rejected")
      .reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.value > 0)

  async function approve(id: string) {
    setActionLoading(id)
    try {
      await expenseService.approve(Number(id))
      refetch()
    } catch {
      // silently refetch to show current state
      refetch()
    } finally {
      setActionLoading(null)
    }
  }

  async function reject(id: string) {
    setActionLoading(id)
    try {
      await expenseService.reject(Number(id))
      refetch()
    } catch {
      refetch()
    } finally {
      setActionLoading(null)
    }
  }

  function validate() {
    const e: Partial<typeof emptyForm> = {}
    if (!form.title.trim()) e.title = "Nomi kiritish shart"
    if (!form.amount || form.amount <= 0) e.amount = 0
    return e
  }

  // Add expense via API
  async function handleCreate() {
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    try {
      await expenseService.create({
        kategoriya_nomi: form.category,
        summa: form.amount,
        izoh: form.title + (form.notes ? ` — ${form.notes}` : ""),
      })
      setModalOpen(false)
      setForm(emptyForm)
      setFormErrors({})
      refetch()
    } catch {
      refetch()
    }
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  }

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && <>
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: L.todayExpenses[locale],   value: fmt(todayExpenses),  icon: TrendingDown, color: "text-yellow-500", bg: "bg-amber-500/15 dark:bg-yellow-900/20" },
            { label: L.monthlyExpenses[locale],  value: fmt(monthlyExpenses), icon: Wallet,       color: "text-destructive", bg: "bg-rose-500/15 dark:bg-red-900/20" },
            { label: L.pendingApprovals[locale], value: String(pendingCount), icon: Clock,        color: "text-primary",    bg: "bg-secondary" },
            { label: L.totalCategories[locale],  value: String(categoryData.length), icon: Tag,  color: "text-purple-500", bg: "bg-secondary" },
          ].map(s => (
            <div key={s.label} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
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

        {/* Main content: table + chart side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
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
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={L.allCategories[locale]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{L.allCategories[locale]}</SelectItem>
                    {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={L.allStatus[locale]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
                    <SelectItem value="pending">{translations.status.pending[locale]}</SelectItem>
                    <SelectItem value="approved">{translations.status.approved[locale]}</SelectItem>
                    <SelectItem value="rejected">{translations.status.rejected[locale]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> {L.addExpense[locale]}
              </Button>
            </div>

            {/* Pending approvals banner */}
            {pendingCount > 0 && statusFilter !== "approved" && statusFilter !== "rejected" && (
              <div className="flex items-center gap-3 bg-amber-500/10 dark:bg-yellow-900/20 border border-amber-500/30 dark:border-yellow-800 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 dark:text-yellow-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300 dark:text-yellow-300 font-medium">
                  {locale === "uz"
                    ? `${pendingCount} ta xarajat tasdiqlashni kutmoqda`
                    : `${pendingCount} расходов ожидают подтверждения`
                  }
                </p>
              </div>
            )}

            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{L.expenseTitle[locale]}</TableHead>
                    <TableHead>{translations.fields.category[locale]}</TableHead>
                    <TableHead className="text-right">{translations.fields.amount[locale]}</TableHead>
                    <TableHead>{L.requestedBy[locale]}</TableHead>
                    <TableHead>{translations.fields.date[locale]}</TableHead>
                    <TableHead>{translations.fields.status[locale]}</TableHead>
                    <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {L.noExpenses[locale]}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(exp => (
                    <TableRow
                      key={exp.id}
                      className={cn(
                        "border-b border-border hover:bg-secondary/50 transition-colors",
                        exp.status === "rejected" && "opacity-50"
                      )}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-foreground">{exp.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getColor(exp.category) }}
                          />
                          <span className="text-sm text-muted-foreground">{exp.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm text-foreground">
                        {fmt(exp.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.author}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.date}</TableCell>
                      <TableCell><StatusBadge status={exp.status} /></TableCell>
                      <TableCell className="text-right">
                        {exp.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 dark:hover:bg-green-900/30"
                              onClick={() => approve(exp.id)}
                              disabled={actionLoading === exp.id}
                              title={L.approveAction[locale]}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-rose-500/15 dark:hover:bg-red-900/30"
                              onClick={() => reject(exp.id)}
                              disabled={actionLoading === exp.id}
                              title={L.rejectAction[locale]}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pie chart sidebar (1/3 width) */}
          <div className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-sm text-foreground mb-1">
                {locale === "uz" ? "Kategoriya bo'yicha" : "По категориям"}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {locale === "uz" ? "Xarajatlar taqsimoti" : "Распределение расходов"}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map(entry => (
                      <Cell key={entry.name} fill={getColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [fmt(v), ""]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categoryData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getColor(d.name) }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending list */}
            {pendingCount > 0 && (
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  {locale === "uz" ? "Kutilayotgan tasdiqlar" : "Ожидают подтверждения"}
                  <span className="ml-auto bg-amber-500/15 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    {pendingCount}
                  </span>
                </h3>
                <div className="space-y-2">
                  {expenses.filter(e => e.status === "pending").map(exp => (
                    <div key={exp.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">{exp.author ? exp.author.split(" ")[0] : "—"} · {fmt(exp.amount)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 dark:hover:bg-green-900/30" disabled={actionLoading === exp.id} onClick={() => approve(exp.id)}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-rose-500/15 dark:hover:bg-red-900/30" disabled={actionLoading === exp.id} onClick={() => reject(exp.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </>}
      </div>

      {/* Add Expense Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
            {locale === "uz" ? "Yangi xarajat qo'shish" : "Добавить расход"}
          </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>{locale === "uz" ? "Xarajat nomi" : "Название расхода"}</Label>
              <Input
                placeholder={locale === "uz" ? "Ofis ijarasi" : "Аренда офиса"}
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={formErrors.title ? "border-destructive" : ""}
              />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{translations.fields.category[locale]}</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{translations.fields.amount[locale]} (so'm)</Label>
              <Input
                type="number"
                placeholder="500000"
                value={form.amount || ""}
                onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                className={formErrors.amount !== undefined && !form.amount ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{L.requestedBy[locale]}</Label>
              <Input
                value={form.requestedBy}
                onChange={e => setForm(p => ({ ...p, requestedBy: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{translations.fields.notes[locale]}</Label>
              <Input
                placeholder={locale === "uz" ? "Ixtiyoriy izoh" : "Необязательный комментарий"}
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleCreate}>{L.addExpense[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
