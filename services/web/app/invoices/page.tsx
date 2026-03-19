"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageLoading, PageError } from "@/components/ui/loading"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import { adaptInvoice } from "@/lib/adapters"
import { invoices as mockInvoices, clients, type Invoice, type InvoiceItem } from "@/lib/mock-data"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, Plus, Eye, Trash2, DollarSign, FileText, Clock, CheckCircle2, X } from "lucide-react"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

export default function InvoicesPage() {
  const { locale } = useLocale()
  const L = translations.invoices
  const { data: apiData, loading, error, reload } = useApi(() => api.getKunlik(), [])
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)

  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      setInvoices(apiData.map((x: Record<string, unknown>) => adaptInvoice(x) as Invoice))
    } else if (apiData && typeof apiData === "object" && "items" in apiData && Array.isArray((apiData as { items: unknown[] }).items)) {
      setInvoices((apiData as { items: Record<string, unknown>[] }).items.map(x => adaptInvoice(x) as Invoice))
    } else if (apiData && typeof apiData === "object" && "sotuvlar" in apiData && Array.isArray((apiData as { sotuvlar: unknown[] }).sotuvlar)) {
      setInvoices((apiData as { sotuvlar: Record<string, unknown>[] }).sotuvlar.map(x => adaptInvoice(x) as Invoice))
    }
  }, [apiData])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  const [clientId, setClientId] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", qty: 1, unitPrice: 0 }])

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalAll    = invoices.reduce((s, i) => s + i.total, 0)
  const totalPaid   = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0)
  const totalPending = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0)
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0)

  function addItem() {
    setItems(prev => [...prev, { description: "", qty: 1, unitPrice: 0 }])
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function handleCreate() {
    if (!clientId || items.some(i => !i.description || i.unitPrice <= 0)) return
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    const subtotal = items.reduce((s, i) => s + (i.qty * i.unitPrice), 0)
    const tax = subtotal * 0.12
    const inv: Invoice = {
      id: `i${Date.now()}`,
      invoiceNumber: `INV-${1060 + invoices.length}`,
      clientId,
      clientName: client.name,
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    }
    setInvoices(prev => [inv, ...prev])
    setCreateOpen(false)
    setClientId("")
    setItems([{ description: "", qty: 1, unitPrice: 0 }])
  }

  const summaryCards = [
    { label: L.totalRevenue[locale], value: fmt(totalAll),    icon: DollarSign,  color: "text-primary" },
    { label: L.paid[locale],         value: fmt(totalPaid),   icon: CheckCircle2, color: "text-green-500" },
    { label: L.pending[locale],      value: fmt(totalPending), icon: Clock,        color: "text-yellow-500" },
    { label: L.overdue[locale],      value: fmt(totalOverdue), icon: FileText,     color: "text-destructive" },
  ]

  if (loading) return <AdminLayout title={L.title[locale]}><PageLoading /></AdminLayout>
  if (error) return <AdminLayout title={L.title[locale]}><PageError message={error} onRetry={reload} /></AdminLayout>

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={`p-2 rounded-lg bg-secondary ${s.color} shrink-0`}><s.icon className="w-4 h-4" /></div>
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
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
                <SelectItem value="draft">{translations.status.draft[locale]}</SelectItem>
                <SelectItem value="sent">{translations.status.sent[locale]}</SelectItem>
                <SelectItem value="paid">{translations.status.paid[locale]}</SelectItem>
                <SelectItem value="overdue">{translations.status.overdue[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {L.createInvoice[locale]}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.invoiceNo[locale]}</TableHead>
                <TableHead>{translations.fields.name[locale]}</TableHead>
                <TableHead>{L.issueDate[locale]}</TableHead>
                <TableHead>{translations.fields.dueDate[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.subtotal[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.tax[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.total[locale]}</TableHead>
                <TableHead>{translations.fields.status[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    {L.noInvoices[locale]}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(inv => (
                  <TableRow key={inv.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-mono text-sm font-medium text-primary">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{inv.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.issueDate}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.dueDate}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmt(inv.subtotal)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmt(inv.tax)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-foreground">{fmt(inv.total)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInvoice(inv)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{L.newInvoice[locale]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{translations.fields.name[locale]}</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={L.selectClient[locale]} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{L.lineItems[locale]}</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> {L.addItem[locale]}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                  <span className="col-span-6">{translations.fields.description[locale]}</span>
                  <span className="col-span-2 text-center">{L.qty[locale]}</span>
                  <span className="col-span-2 text-right">{L.unitPrice[locale]}</span>
                  <span className="col-span-2 text-right">{translations.fields.total[locale]}</span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-6 h-8 text-sm"
                      placeholder={L.descPlaceholder[locale]}
                      value={item.description}
                      onChange={e => updateItem(i, "description", e.target.value)}
                    />
                    <Input
                      className="col-span-2 h-8 text-sm text-center" type="number" min={1}
                      value={item.qty}
                      onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                    />
                    <Input
                      className="col-span-2 h-8 text-sm text-right" type="number" min={0}
                      value={item.unitPrice}
                      onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                    <div className="col-span-1 text-right text-xs font-medium text-foreground">
                      {fmt(item.qty * item.unitPrice)}
                    </div>
                    <Button variant="ghost" size="icon" className="col-span-1 h-7 w-7" onClick={() => removeItem(i)} disabled={items.length === 1}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t border-border mt-4 pt-3 space-y-1 text-sm">
                {(() => {
                  const sub = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
                  const tax = sub * 0.12
                  return (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{translations.fields.subtotal[locale]}</span><span>{fmt(sub)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{translations.fields.tax[locale]} (12%)</span><span>{fmt(tax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-foreground text-base">
                        <span>{translations.fields.total[locale]}</span><span>{fmt(sub + tax)}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleCreate} disabled={!clientId}>{L.createInvoice[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{viewInvoice.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {L.issueDate[locale]}: {viewInvoice.issueDate} · {translations.fields.dueDate[locale]}: {viewInvoice.dueDate}
                  </p>
                </div>
                <StatusBadge status={viewInvoice.status} />
              </div>
              <div className="bg-secondary rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">{translations.fields.description[locale]}</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">{L.qty[locale]}</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">{L.unitPrice[locale]}</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">{translations.fields.total[locale]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.items.map((item, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="p-3 text-foreground">{item.description}</td>
                        <td className="p-3 text-center text-muted-foreground">{item.qty}</td>
                        <td className="p-3 text-right text-muted-foreground">{fmt(item.unitPrice)}</td>
                        <td className="p-3 text-right font-medium text-foreground">{fmt(item.qty * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{translations.fields.subtotal[locale]}</span><span>{fmt(viewInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{translations.fields.tax[locale]}</span><span>{fmt(viewInvoice.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
                  <span>{translations.fields.total[locale]}</span><span>{fmt(viewInvoice.total)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewInvoice(null)}>{translations.actions.close[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
