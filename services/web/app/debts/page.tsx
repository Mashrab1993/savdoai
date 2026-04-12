"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { CreditCard, AlertTriangle, CheckCircle2, Clock, Search, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import DebtorsList from "@/components/dashboard/debtors-list"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { debtService } from "@/lib/api/services"
import { normalizeDebt, type DebtVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { ApiResponseError } from "@/lib/api/client"

// Local formatting alias
const fmt = formatCurrency

export default function DebtsPage() {
  const { locale } = useLocale()
  const L = translations.debts
  const { data: rawDebts, loading, error, refetch } = useApi(debtService.list)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedDebt, setSelectedDebt] = useState<DebtVM | null>(null)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState("")

  const debts: DebtVM[] = (rawDebts ?? []).map((d, i) => normalizeDebt(d, i))

  const filtered = debts.filter(d => {
    const matchSearch = d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.invoiceId.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalOwed = debts.filter(d => d.status !== "paid").reduce((s, d) => s + (d.amount - d.paid), 0)
  const overdueAmount = debts.filter(d => d.status === "overdue").reduce((s, d) => s + d.amount, 0)
  const overdueCount = debts.filter(d => d.status === "overdue").length

  async function handlePayment(debt: DebtVM) {
    setPaying(true)
    setPayError(null)
    const balance = debt.amount - debt.paid
    const summa = payAmount ? Math.min(Number(payAmount), balance) : balance
    if (summa <= 0) { setPaying(false); return }
    try {
      await debtService.pay(debt.clientName, summa)
      setSelectedDebt(null)
      setPayAmount("")
      refetch()
    } catch (err) {
      const msg = err instanceof ApiResponseError ? err.detail : "To'lovda xato"
      setPayError(msg)
    } finally {
      setPaying(false)
    }
  }

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-6">

        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && <>
        <PageHeader
          icon={CreditCard}
          gradient="rose"
          title={L.title[locale]}
          subtitle={locale === "uz" ? `${debts.length} ta qarz yozuvi` : `${debts.length} записей долга`}
        />
        {/* Alert Banner — Overdue Critical */}
        {overdueCount > 0 && (
          <div className="bg-rose-500/10 dark:bg-red-950/20 border-l-4 border-rose-500 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-200 dark:text-red-300">{overdueCount} {translations.status.overdue[locale]}</p>
              <p className="text-sm text-rose-800 dark:text-rose-300 dark:text-rose-400 mt-1">{fmt(overdueAmount)} {translations.fields.amount[locale].toLowerCase()}</p>
            </div>
          </div>
        )}

        {/* Summary Cards — Better visual hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary text-primary"><CreditCard className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{translations.fields.amount[locale]}</p>
              <p className="text-2xl font-bold text-foreground">{fmt(totalOwed)}</p>
            </div>
          </div>
          <div className={cn(
            "rounded-lg p-4 flex items-center gap-3 border transition-all",
            overdueCount > 0
              ? "bg-rose-500/10 dark:bg-red-950/20 border-rose-500/30 dark:border-red-900/40"
              : "bg-card border-border"
          )}>
            <div className={cn("p-2.5 rounded-lg", overdueCount > 0 ? "bg-rose-500/15 dark:bg-red-900/40 text-rose-600 dark:text-rose-400 dark:text-rose-400" : "bg-secondary text-muted-foreground")}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{translations.status.overdue[locale]}</p>
              <p className={cn("text-2xl font-bold", overdueCount > 0 ? "text-rose-600 dark:text-rose-400 dark:text-rose-400" : "text-foreground")}>{fmt(overdueAmount)}</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 dark:bg-green-950/20 border border-emerald-500/30 dark:border-green-900/40 rounded-lg p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 dark:bg-green-900/40 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{translations.status.paid[locale]}</p>
              <p className="text-2xl font-bold text-foreground">{fmt(debts.filter(d => d.status === "paid").reduce((s, d) => s + d.amount, 0))}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={L.searchPlaceholder[locale]} className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder={L.allStatus[locale]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
                <SelectItem value="overdue" className="text-rose-600 dark:text-rose-400">{translations.status.overdue[locale]}</SelectItem>
                <SelectItem value="pending">{translations.status.pending[locale]}</SelectItem>
                <SelectItem value="partial">{translations.status.partial[locale]}</SelectItem>
                <SelectItem value="paid">{translations.status.paid[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Premium aging overview (DebtorsList) */}
        {debts.length > 0 && (() => {
          // Group debts by client for DebtorsList
          const byClient = new Map<string, { jarz: number; soni: number; oldestDue: string; lastPay: string; limit: number }>()
          for (const d of debts) {
            const existing = byClient.get(d.clientName)
            if (existing) {
              existing.jarz += (d.amount - d.paid)
              existing.soni += d.count
              if (d.dueDate < existing.oldestDue) existing.oldestDue = d.dueDate
            } else {
              byClient.set(d.clientName, {
                jarz: d.amount - d.paid,
                soni: d.count,
                oldestDue: d.dueDate || new Date().toISOString(),
                lastPay: "",
                limit: 0,
              })
            }
          }
          const debtorRows = Array.from(byClient.entries())
            .filter(([, v]) => v.jarz > 0)
            .map(([name, v], i) => ({
              klient_id:       i + 1,
              klient_ismi:     name,
              joriy_qarz:      v.jarz,
              kredit_limit:    v.limit,
              qarz_soni:       v.soni,
              eng_eski_muddat: v.oldestDue,
            }))
          return debtorRows.length > 0 ? (
            <DebtorsList
              debtors={debtorRows}
              onRowClick={(id) => {
                const d = debts.find(x => x.clientName === debtorRows.find(r => r.klient_id === id)?.klient_ismi)
                if (d) setSelectedDebt(d)
              }}
            />
          ) : null
        })()}

        {/* Detailed table with payment actions */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.colClient[locale]}</TableHead>
                <TableHead>{L.colInvoice[locale]}</TableHead>
                <TableHead className="text-right">{L.colAmount[locale]}</TableHead>
                <TableHead className="text-right">{L.colPaid[locale]}</TableHead>
                <TableHead className="text-right">{L.colBalance[locale]}</TableHead>
                <TableHead>{L.colDue[locale]}</TableHead>
                <TableHead>{L.colStatus[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{L.noDebts[locale]}</TableCell>
                </TableRow>
              ) : (
                filtered.map(debt => {
                  const balance = debt.amount - debt.paid
                  const isOverdue = debt.status === "overdue"
                  return (
                    <TableRow
                      key={debt.id}
                      className={cn(
                        "border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer",
                        isOverdue && "bg-rose-500/10/50 dark:bg-rose-950/10"
                      )}
                      onClick={() => setSelectedDebt(debt)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                          <span className={cn("font-medium text-sm", isOverdue ? "text-destructive" : "text-foreground")}>
                            {debt.clientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{debt.invoiceId}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">{fmt(debt.amount)}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-500">{fmt(debt.paid)}</TableCell>
                      <TableCell className={cn("text-right text-sm font-semibold", balance > 0 ? (isOverdue ? "text-destructive" : "text-foreground") : "text-emerald-500")}>
                        {fmt(balance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {debt.dueDate}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={debt.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        </>}
      </div>

      {/* Payment History Drawer */}
      <Sheet open={!!selectedDebt} onOpenChange={() => setSelectedDebt(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedDebt && (
            <>
              <SheetHeader>
                <SheetTitle>{L.debtDetails[locale]} — {selectedDebt.invoiceId}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="bg-secondary rounded-xl p-4 space-y-3">
                  {[
                    { label: L.drawerClient[locale], value: selectedDebt.clientName },
                    { label: translations.fields.amount[locale], value: fmt(selectedDebt.amount) },
                    { label: translations.fields.paid[locale], value: fmt(selectedDebt.paid) },
                    { label: translations.fields.balance[locale], value: fmt(selectedDebt.amount - selectedDebt.paid) },
                    { label: L.drawerDue[locale], value: selectedDebt.dueDate },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
                    <span className="text-muted-foreground">{L.drawerStatus[locale]}</span>
                    <StatusBadge status={selectedDebt.status} />
                  </div>
                </div>



                {/* Payment history — not yet provided by backend */}
                <div className="rounded-lg bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground">
                  {locale === "uz"
                    ? "To'lov tarixi hozircha mavjud emas."
                    : "История платежей пока недоступна."}
                </div>

                {payError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{payError}</p>
                )}
                {selectedDebt.status !== "paid" && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        {locale === "uz" ? "To'lov summasi" : "Сумма оплаты"}
                      </label>
                      <Input
                        type="number"
                        placeholder={String(selectedDebt.amount - selectedDebt.paid)}
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button className="w-full" onClick={() => handlePayment(selectedDebt)} disabled={paying}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {paying
                        ? (locale === "uz" ? "To'lanmoqda..." : "Оплата...")
                        : payAmount && Number(payAmount) < (selectedDebt.amount - selectedDebt.paid)
                          ? (locale === "uz" ? `${Number(payAmount).toLocaleString()} so'm to'lash` : `Оплатить ${Number(payAmount).toLocaleString()}`)
                          : L.markAsPaid[locale]}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
