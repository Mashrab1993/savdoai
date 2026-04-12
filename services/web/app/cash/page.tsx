"use client"

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { formatCurrency, formatCurrencyFull, formatDateShort } from "@/lib/format"
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
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Search, Landmark, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import CashboxBalance from "@/components/dashboard/cashbox-balance"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { cashService } from "@/lib/api/services"
import {
  normalizeCashStats, normalizeCashTransaction,
  type CashTransactionVM,
} from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"

const fmt = formatCurrency
const fmtFull = formatCurrencyFull

const ALL_CATEGORIES = ["Savdo", "Transport", "Oziq-ovqat", "Kommunal", "Ijara", "Marketing"]

const emptyForm = {
  type: "income" as "income" | "outcome",
  amount: 0,
  description: "",
  category: "Savdo",
}

export default function CashPage() {
  const { locale } = useLocale()
  const L = translations.cash

  // ── API data ────────────────────────────────────────────────────────────────
  const { data: rawStats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(cashService.stats)
  const { data: rawHistory, loading: histLoading, error: histError, refetch: refetchHistory } = useApi(cashService.history)

  const stats = rawStats ? normalizeCashStats(rawStats) : null
  const transactions: CashTransactionVM[] = (rawHistory ?? []).map(normalizeCashTransaction)

  // ── Local state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<typeof emptyForm>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = transactions.filter(t => {
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || t.type === typeFilter
    const matchCat = categoryFilter === "all" || t.category === categoryFilter
    return matchSearch && matchType && matchCat
  })

  // Build chart data from history (last 7 distinct dates)
  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; income: number; outcome: number }> = {}
    transactions.forEach(t => {
      if (!byDate[t.date]) byDate[t.date] = { date: t.date, income: 0, outcome: 0 }
      if (t.type === "income") byDate[t.date].income += t.amount
      else byDate[t.date].outcome += t.amount
    })
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
  }, [transactions])

  // KPI: from stats endpoint if available, otherwise derive from history
  const balance = stats?.balance ?? (transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0) - transactions.filter(t => t.type === "outcome").reduce((s, t) => s + t.amount, 0))
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayIncome = stats?.todayIncome ?? transactions.filter(t => t.date === todayStr && t.type === "income").reduce((s, t) => s + t.amount, 0)
  const todayOutcome = stats?.todayOutcome ?? transactions.filter(t => t.date === todayStr && t.type === "outcome").reduce((s, t) => s + t.amount, 0)
  const monthlyIncome = stats?.monthlyIncome ?? transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const monthlyOutcome = stats?.monthlyOutcome ?? transactions.filter(t => t.type === "outcome").reduce((s, t) => s + t.amount, 0)
  const balanceTrend = balance >= 0

  // Group by date
  const groupedByDate: Record<string, CashTransactionVM[]> = {}
  filtered.forEach(t => {
    if (!groupedByDate[t.date]) groupedByDate[t.date] = []
    groupedByDate[t.date].push(t)
  })
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  const dateLabels: Record<string, string> = {
    [todayStr]: L.today[locale],
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  function validate() {
    const e: Partial<typeof emptyForm> = {}
    if (!form.description.trim()) e.description = L.descRequired[locale]
    if (!form.amount || form.amount <= 0) e.amount = 0
    return e
  }

  async function handleAdd() {
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setSaving(true)
    try {
      await cashService.addTransaction({
        tur: form.type === "income" ? "kirim" : "chiqim",
        summa: form.amount,
        usul: "naqd",
        tavsif: form.description,
        kategoriya: form.category,
      })
      setModalOpen(false)
      setForm(emptyForm)
      setFormErrors({})
      refetchStats()
      refetchHistory()
    } catch {
      // keep modal open; user can retry
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await cashService.deleteTransaction(Number(id))
      refetchStats()
      refetchHistory()
    } catch {
      // silently fail — refetch for consistent state
      refetchHistory()
    } finally {
      setDeletingId(null)
    }
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  }

  const loading = statsLoading || histLoading
  const error = statsError ?? histError

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={() => { refetchStats(); refetchHistory() }} />}
        {!loading && !error && stats && <>
        <PageHeader
          icon={Landmark}
          gradient="cyan"
          title={L.title[locale]}
          subtitle={locale === "uz" ? "Kassa balansi va tranzaksiyalar" : "Баланс кассы и транзакции"}
        />
        {/* Premium CashboxBalance */}
        <CashboxBalance
          data={{
            naqd:         stats.balance,
            karta:        0,
            hisob:        0,
            jami:         stats.balance,
            bugun_kirim:  stats.todayIncome,
            bugun_chiqim: stats.todayOutcome,
            ops:          transactions.slice(0, 8).map(t => ({
              id:    Number(t.id),
              turi:  t.type === "income" ? "kirim" as const : "chiqim" as const,
              usul:  (t.method === "karta" ? "karta" : t.method === "hisob" ? "hisob" : "naqd") as "naqd" | "karta" | "hisob",
              summa: t.amount,
              izoh:  t.description || undefined,
              sana:  t.date,
            })),
          }}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance */}
          <div className={cn(
            "col-span-2 lg:col-span-1 rounded-xl p-5 border flex flex-col gap-1",
            balanceTrend
              ? "bg-emerald-500/10 dark:bg-green-900/20 border-emerald-500/30 dark:border-green-800"
              : "bg-rose-500/10 dark:bg-red-900/20 border-rose-500/30 dark:border-red-800"
          )}>
            <div className="flex items-center gap-2">
              <Landmark className={cn("w-4 h-4", balanceTrend ? "text-emerald-600 dark:text-emerald-400 dark:text-green-400" : "text-destructive")} />
              <p className="text-xs font-medium text-muted-foreground">{L.balance[locale]}</p>
            </div>
            <p className={cn("text-2xl font-bold mt-1", balanceTrend ? "text-emerald-700 dark:text-emerald-300 dark:text-green-300" : "text-destructive")}>
              {fmt(balance)}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {balanceTrend
                ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                : <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              }
              <span className="text-xs text-muted-foreground">{L.balanceStatus[locale]}</span>
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-emerald-500/15 dark:bg-green-900/30 shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.income[locale]}</p>
              <p className="text-lg font-bold text-foreground truncate">{fmt(todayIncome)}</p>
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-rose-500/15 dark:bg-red-900/30 shrink-0">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.outcome[locale]}</p>
              <p className="text-lg font-bold text-foreground truncate">{fmt(todayOutcome)}</p>
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary shrink-0">
              <Landmark className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.monthlyProfit[locale]}</p>
              <p className={cn("text-lg font-bold truncate", monthlyIncome - monthlyOutcome >= 0 ? "text-emerald-600 dark:text-emerald-400 dark:text-green-400" : "text-destructive")}>
                {fmt(monthlyIncome - monthlyOutcome)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart + Transaction list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Chart + list (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{L.chartTitle[locale]}</h3>
                  <p className="text-xs text-muted-foreground">{L.last7days[locale]}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/100" /> {L.incomeShort[locale]}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> {L.outcomeShort[locale]}
                  </span>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                  {locale === "uz" ? "Tranzaksiyalar mavjud emas" : "Нет данных о транзакциях"}
                </div>
              ) : (
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
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date: string) => formatDateShort(date, locale)}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [fmt(v), ""]}
                    />
                    <Area type="monotone" dataKey="income" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fill="url(#incomeGrad)" name={L.incomeShort[locale]} />
                    <Area type="monotone" dataKey="outcome" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#outcomeGrad)" name={L.outcomeShort[locale]} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
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
                    <SelectValue placeholder={L.categoryLabel[locale]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{L.allCategories[locale]}</SelectItem>
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
                <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-10 text-center text-sm text-muted-foreground">
                  {L.noTransactions[locale]}
                </div>
              ) : sortedDates.map(date => {
                const dayTxs = groupedByDate[date]
                const dayIncome = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
                const dayOutcome = dayTxs.filter(t => t.type === "outcome").reduce((s, t) => s + t.amount, 0)
                return (
                  <div key={date} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/50">
                      <p className="text-sm font-semibold text-foreground">
                        {dateLabels[date] ?? date}
                        <span className="text-xs font-normal text-muted-foreground ml-2">{date}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 dark:text-green-400 font-medium">+{fmt(dayIncome)}</span>
                        <span className="text-destructive font-medium">−{fmt(dayOutcome)}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {dayTxs.map(tx => (
                        <div key={tx.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/40 transition-colors">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            tx.type === "income"
                              ? "bg-emerald-500/15 dark:bg-green-900/30"
                              : "bg-rose-500/15 dark:bg-red-900/30"
                          )}>
                            {tx.type === "income"
                              ? <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 dark:text-green-400" />
                              : <ArrowUpCircle className="w-4 h-4 text-destructive" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{tx.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className={cn(
                              "text-sm font-bold",
                              tx.type === "income" ? "text-emerald-600 dark:text-emerald-400 dark:text-green-400" : "text-destructive"
                            )}>
                              {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
                            </p>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled={deletingId === tx.id}
                              onClick={() => handleDelete(tx.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick-add sidebar (1/3) */}
          <div className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">{L.quickOp[locale]}</h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setForm(p => ({ ...p, type: "income" }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                    form.type === "income"
                      ? "border-green-500 bg-emerald-500/10 dark:bg-green-900/20 text-emerald-700 dark:text-emerald-300 dark:text-green-300"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <ArrowDownCircle className="w-4 h-4" /> {L.incomeShort[locale]}
                </button>
                <button
                  onClick={() => setForm(p => ({ ...p, type: "outcome" }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                    form.type === "outcome"
                      ? "border-destructive bg-rose-500/10 dark:bg-red-900/20 text-destructive"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <ArrowUpCircle className="w-4 h-4" /> {L.outcomeShort[locale]}
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>{L.descLabel[locale]}</Label>
                <Input
                  placeholder={L.descPlaceholder[locale]}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className={formErrors.description ? "border-destructive" : ""}
                />
                {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>{L.amountLabel[locale]}</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={form.amount || ""}
                  onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                  className={formErrors.amount !== undefined && !form.amount ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{L.categoryLabel[locale]}</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full gap-2" onClick={handleAdd} disabled={saving}>
                <Plus className="w-4 h-4" />
                {form.type === "income" ? L.addIncome[locale] : L.addOutcome[locale]}
              </Button>
            </div>

            {/* Balance summary */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">{L.monthSummary[locale]}</h4>
              {[
                { label: L.totalIncome[locale],  value: fmtFull(monthlyIncome),                    color: "text-emerald-600 dark:text-emerald-400 dark:text-green-400" },
                { label: L.totalOutcome[locale], value: fmtFull(monthlyOutcome),                   color: "text-destructive" },
                { label: L.netProfit[locale],    value: fmtFull(monthlyIncome - monthlyOutcome),   color: monthlyIncome >= monthlyOutcome ? "text-emerald-600 dark:text-emerald-400 dark:text-green-400" : "text-destructive" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={cn("font-semibold", row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>}
      </div>

      {/* Add Operation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{L.newOperation[locale]}</DialogTitle>
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
                        ? "border-green-500 bg-emerald-500/10 dark:bg-green-900/20 text-emerald-700 dark:text-emerald-300 dark:text-green-300"
                        : "border-destructive bg-rose-500/10 dark:bg-red-900/20 text-destructive"
                      : "border-border hover:bg-secondary text-muted-foreground"
                  )}
                >
                  {t === "income" ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  {t === "income" ? L.incomeShort[locale] : L.outcomeShort[locale]}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>{L.descLabel[locale]}</Label>
              <Input
                placeholder={L.descPlaceholder[locale]}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={formErrors.description ? "border-destructive" : ""}
              />
              {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{L.amountLabel[locale]}</Label>
              <Input
                type="number"
                value={form.amount || ""}
                onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{L.categoryLabel[locale]}</Label>
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
            <Button onClick={handleAdd} disabled={saving}>{L.addOperation[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
