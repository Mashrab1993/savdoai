"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { cashTransactions as initialTx, type CashTransaction } from "@/lib/mock-data"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  ArrowDownCircle, ArrowUpCircle, Landmark, TrendingUp,
  TrendingDown, Search, Plus, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

function fmtFull(n: number) {
  return `${n.toLocaleString()} so'm`
}

const todayStr = "2025-03-19"

// Build a rolling 7-day summary for the chart
const DAYS = ["13-Mar", "14-Mar", "15-Mar", "16-Mar", "17-Mar", "18-Mar", "19-Mar"]
const chartData = [
  { day: "13-Mar", income: 1800000, outcome: 400000 },
  { day: "14-Mar", income: 3200000, outcome: 900000 },
  { day: "15-Mar", income: 2500000, outcome: 1200000 },
  { day: "16-Mar", income: 2684000, outcome: 600000 },
  { day: "17-Mar", income: 600000,  outcome: 420000 },
  { day: "18-Mar", income: 1210000, outcome: 5475000 },
  { day: "19-Mar", income: 4895000, outcome: 465000 },
]

const ALL_CATEGORIES = ["Savdo", "Transport", "Oziq-ovqat", "Kommunal", "Ijara", "Marketing"]
const emptyForm = {
  type: "income" as CashTransaction["type"],
  amount: 0,
  description: "",
  category: "Savdo",
  performedBy: "Mohira Usmonova",
}

export default function CashPage() {
  const { locale } = useLocale()
  const L = translations.cash
  const [transactions, setTransactions] = useState<CashTransaction[]>(initialTx)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({})

  const filtered = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.performedBy.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || t.type === typeFilter
    const matchCat = categoryFilter === "all" || t.category === categoryFilter
    return matchSearch && matchType && matchCat
  })

  // KPI derivations
  const todayIncome = transactions.filter(t => t.date === todayStr && t.type === "income")
    .reduce((s, t) => s + t.amount, 0)
  const todayOutcome = transactions.filter(t => t.date === todayStr && t.type === "outcome")
    .reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalOutcome = transactions.filter(t => t.type === "outcome").reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalOutcome

  // Group transactions by date for display
  const groupedByDate: Record<string, CashTransaction[]> = {}
  filtered.forEach(t => {
    if (!groupedByDate[t.date]) groupedByDate[t.date] = []
    groupedByDate[t.date].push(t)
  })
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  function validate() {
    const e: Partial<typeof emptyForm> = {}
    if (!form.description.trim()) e.description = locale === "uz" ? "Tavsif kiritish shart" : "Описание обязательно"
    if (!form.amount || form.amount <= 0) e.amount = 0
    return e
  }

  function handleAdd() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const newTx: CashTransaction = {
      id: `ct${Date.now()}`,
      type: form.type,
      amount: form.amount,
      description: form.description,
      category: form.category,
      date: todayStr,
      time: new Date().toTimeString().slice(0, 5),
      performedBy: form.performedBy,
    }
    setTransactions(prev => [newTx, ...prev])
    setModalOpen(false)
    setForm(emptyForm)
    setErrors({})
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  }

  const balanceTrend = balance >= 0
  const dateLabels: Record<string, string> = {
    [todayStr]: locale === "uz" ? "Bugun" : "Сегодня",
    "2025-03-18": locale === "uz" ? "Kecha" : "Вчера",
  }

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance */}
          <div className={cn(
            "col-span-2 lg:col-span-1 rounded-xl p-5 border flex flex-col gap-1",
            balanceTrend
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          )}>
            <div className="flex items-center gap-2">
              <Landmark className={cn("w-4 h-4", balanceTrend ? "text-green-600 dark:text-green-400" : "text-destructive")} />
              <p className="text-xs font-medium text-muted-foreground">{L.balance[locale]}</p>
            </div>
            <p className={cn("text-2xl font-bold mt-1", balanceTrend ? "text-green-700 dark:text-green-300" : "text-destructive")}>
              {fmt(balance)}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {balanceTrend
                ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                : <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              }
              <span className="text-xs text-muted-foreground">{locale === "uz" ? "Jami kassa holati" : "Общий остаток в кассе"}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.income[locale]}</p>
              <p className="text-lg font-bold text-foreground truncate">{fmt(todayIncome)}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.outcome[locale]}</p>
              <p className="text-lg font-bold text-foreground truncate">{fmt(todayOutcome)}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary shrink-0">
              <Landmark className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Oylik foyda</p>
              <p className={cn("text-lg font-bold truncate", totalIncome - totalOutcome >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                {fmt(totalIncome - totalOutcome)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart + Transaction list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Chart (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{locale === "uz" ? "Kirim / Chiqim" : "Приход / Расход"}</h3>
                  <p className="text-xs text-muted-foreground">{locale === "uz" ? "So'nggi 7 kun" : "Последние 7 дней"}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> {locale === "uz" ? "Kirim" : "Приход"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> {locale === "uz" ? "Chiqim" : "Расход"}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outcomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${(v/1_000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [fmt(v), ""]}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fill="url(#incomeGrad)" name={locale === "uz" ? "Kirim" : "Приход"} />
                  <Area type="monotone" dataKey="outcome" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#outcomeGrad)" name={locale === "uz" ? "Chiqim" : "Расход"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={L.searchPlaceholder[locale]}
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={L.allTypes[locale]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{L.allTypes[locale]}</SelectItem>
                    <SelectItem value="income">{L.income_type[locale]}</SelectItem>
                    <SelectItem value="outcome">{L.outcome_type[locale]}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={locale === "uz" ? "Kategoriya" : "Категория"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{locale === "uz" ? "Barchasi" : "Все"}</SelectItem>
                    {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> {L.addOperation[locale]}
              </Button>
            </div>

            {/* Transaction list grouped by date */}
            <div className="space-y-4">
              {sortedDates.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
                  {L.noTransactions[locale]}
                </div>
              ) : sortedDates.map(date => {
                const dayTxs = groupedByDate[date]
                const dayIncome = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
                const dayOutcome = dayTxs.filter(t => t.type === "outcome").reduce((s, t) => s + t.amount, 0)
                return (
                  <div key={date} className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Date header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/50">
                      <p className="text-sm font-semibold text-foreground">
                        {dateLabels[date] ?? date}
                        <span className="text-xs font-normal text-muted-foreground ml-2">{date}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600 dark:text-green-400 font-medium">+{fmt(dayIncome)}</span>
                        <span className="text-destructive font-medium">−{fmt(dayOutcome)}</span>
                      </div>
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-border">
                      {dayTxs.map(tx => (
                        <div key={tx.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/40 transition-colors">
                          {/* Icon */}
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            tx.type === "income"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
                          )}>
                            {tx.type === "income"
                              ? <ArrowDownCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              : <ArrowUpCircle className="w-4 h-4 text-destructive" />
                            }
                          </div>
                          {/* Description */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{tx.category}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{tx.performedBy.split(" ")[0]}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{tx.time}</span>
                            </div>
                          </div>
                          {/* Amount */}
                          <div className="text-right shrink-0">
                            <p className={cn(
                              "text-sm font-bold",
                              tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-destructive"
                            )}>
                              {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Operation form sidebar (1/3) */}
          <div className="space-y-4">
            {/* Quick add operation form */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">{locale === "uz" ? "Tezkor operatsiya" : "Быстрая операция"}</h3>

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setForm(p => ({ ...p, type: "income" }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                    form.type === "income"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <ArrowDownCircle className="w-4 h-4" /> {locale === "uz" ? "Kirim" : "Приход"}
                </button>
                <button
                  onClick={() => setForm(p => ({ ...p, type: "outcome" }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                    form.type === "outcome"
                      ? "border-destructive bg-red-50 dark:bg-red-900/20 text-destructive"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <ArrowUpCircle className="w-4 h-4" /> {locale === "uz" ? "Chiqim" : "Расход"}
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>{locale === "uz" ? "Tavsif" : "Описание"}</Label>
                <Input
                  placeholder={locale === "uz" ? "Operatsiya tavsifi..." : "Описание операции..."}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>{locale === "uz" ? "Summa (so'm)" : "Сумма (сум)"}</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={form.amount || ""}
                  onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                  className={errors.amount !== undefined && !form.amount ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{locale === "uz" ? "Kategoriya" : "Категория"}</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{locale === "uz" ? "Bajaruvchi" : "Исполнитель"}</Label>
                <Input
                  value={form.performedBy}
                  onChange={e => setForm(p => ({ ...p, performedBy: e.target.value }))}
                />
              </div>

              <Button className="w-full gap-2" onClick={handleAdd}>
                <Plus className="w-4 h-4" />
                {form.type === "income" ? (locale === "uz" ? "Kirim qo'shish" : "Добавить приход") : (locale === "uz" ? "Chiqim qo'shish" : "Добавить расход")}
              </Button>
            </div>

            {/* Balance summary */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">{locale === "uz" ? "Oy yakunlari" : "Итоги месяца"}</h4>
              {[
                { label: locale === "uz" ? "Jami kirim" : "Общий приход",   value: fmtFull(totalIncome),           color: "text-green-600 dark:text-green-400" },
                { label: locale === "uz" ? "Jami chiqim" : "Общий расход",  value: fmtFull(totalOutcome),          color: "text-destructive" },
                { label: locale === "uz" ? "Sof foyda" : "Чистая прибыль",    value: fmtFull(totalIncome - totalOutcome), color: totalIncome >= totalOutcome ? "text-green-600 dark:text-green-400" : "text-destructive" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={cn("font-semibold", row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Operation Modal (for mobile / alternative) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{locale === "uz" ? "Yangi operatsiya" : "Новая операция"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              {(["income", "outcome"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors",
                    form.type === t
                      ? t === "income"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "border-destructive bg-red-50 dark:bg-red-900/20 text-destructive"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  )}
                >
                  {t === "income" ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  {t === "income" ? "Kirim" : "Chiqim"}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Input
                placeholder="Operatsiya tavsifi"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Summa (so'm)</Label>
              <Input
                type="number"
                value={form.amount || ""}
                onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kategoriya</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleAdd}>{L.addOperation[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
