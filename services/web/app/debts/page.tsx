"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { debts as initialDebts, mockPaymentHistory, type Debt } from "@/lib/mock-data"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n} so'm`
}
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
import { cn } from "@/lib/utils"

export default function DebtsPage() {
  const { locale } = useLocale()
  const L = translations.debts
  const [debts, setDebts] = useState<Debt[]>(initialDebts)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  const filtered = debts.filter(d => {
    const matchSearch = d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.invoiceRef.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalOwed = debts.filter(d => d.status !== "paid").reduce((s, d) => s + (d.amount - d.paid), 0)
  const overdueAmount = debts.filter(d => d.status === "overdue").reduce((s, d) => s + d.amount, 0)
  const overdueCount = debts.filter(d => d.status === "overdue").length

  function markAsPaid(id: string) {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, status: "paid" as const, paid: d.amount } : d))
    setSelectedDebt(null)
  }

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-primary"><CreditCard className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{L.totalOutstanding[locale]}</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalOwed)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{L.overdue[locale]} ({overdueCount})</p>
              <p className="text-xl font-bold text-destructive">{fmt(overdueAmount)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{L.paidThisMonth[locale]}</p>
              <p className="text-xl font-bold text-foreground">
                {fmt(debts.filter(d => d.status === "paid").reduce((s, d) => s + d.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={L.searchPlaceholder[locale]} className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={L.allStatus[locale]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
                <SelectItem value="pending">{translations.status.pending[locale]}</SelectItem>
                <SelectItem value="overdue">{translations.status.overdue[locale]}</SelectItem>
                <SelectItem value="partial">{translations.status.partial[locale]}</SelectItem>
                <SelectItem value="paid">{translations.status.paid[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "uz" ? "Mijoz" : "Клиент"}</TableHead>
                <TableHead>{locale === "uz" ? "Hisob-faktura" : "Счет"}</TableHead>
                <TableHead className="text-right">{locale === "uz" ? "Summa" : "Сумма"}</TableHead>
                <TableHead className="text-right">{locale === "uz" ? "To'langan" : "Оплачено"}</TableHead>
                <TableHead className="text-right">{locale === "uz" ? "Qoldiq" : "Остаток"}</TableHead>
                <TableHead>{locale === "uz" ? "Muddat" : "Сроки"}</TableHead>
                <TableHead>{locale === "uz" ? "Holat" : "Статус"}</TableHead>
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
                        isOverdue && "bg-red-50/50 dark:bg-red-900/10"
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
                      <TableCell className="text-sm font-mono text-muted-foreground">{debt.invoiceRef}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">{fmt(debt.amount)}</TableCell>
                      <TableCell className="text-right text-sm text-green-500">{fmt(debt.paid)}</TableCell>
                      <TableCell className={cn("text-right text-sm font-semibold", balance > 0 ? (isOverdue ? "text-destructive" : "text-foreground") : "text-green-500")}>
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
      </div>

      {/* Payment History Drawer */}
      <Sheet open={!!selectedDebt} onOpenChange={() => setSelectedDebt(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedDebt && (
            <>
              <SheetHeader>
                <SheetTitle>{L.debtDetails[locale]} — {selectedDebt.invoiceRef}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="bg-secondary rounded-xl p-4 space-y-3">
                  {[
                    { label: locale === "uz" ? "Mijoz" : "Клиент", value: selectedDebt.clientName },
                    { label: translations.fields.amount[locale], value: fmt(selectedDebt.amount) },
                    { label: translations.fields.paid[locale], value: fmt(selectedDebt.paid) },
                    { label: translations.fields.balance[locale], value: fmt(selectedDebt.amount - selectedDebt.paid) },
                    { label: locale === "uz" ? "Muddat" : "Сроки", value: selectedDebt.dueDate },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
                    <span className="text-muted-foreground">{locale === "uz" ? "Holat" : "Статус"}</span>
                    <StatusBadge status={selectedDebt.status} />
                  </div>
                </div>

                {selectedDebt.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">{L.noteLabel[locale]}</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">{selectedDebt.notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">{L.paymentHistory[locale]}</h4>
                  {(mockPaymentHistory[selectedDebt.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{L.noPayments[locale]}</p>
                  ) : (
                    <div className="space-y-2">
                      {(mockPaymentHistory[selectedDebt.id] || []).map((ph, i) => (
                        <div key={i} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{fmt(ph.amount)}</p>
                            <p className="text-xs text-muted-foreground">{ph.method}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{ph.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedDebt.status !== "paid" && (
                  <Button className="w-full" onClick={() => markAsPaid(selectedDebt.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {locale === "uz" ? "To'langan deb belgilash" : "Отметить как оплачено"}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
