"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Pencil, Trash2, Users, DollarSign, AlertCircle } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { useApi } from "@/hooks/use-api"
import { clientService } from "@/lib/api/services"
import { normalizeClient, type ClientVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { ApiResponseError } from "@/lib/api/client"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n} so'm`
}

type ClientFormShape = { name: string; phone: string; address: string; creditLimit: string }

export default function ClientsPage() {
  const { locale } = useLocale()
  const L = translations.clients

  const { data: rawClients, loading, error, refetch } = useApi(clientService.list)
  const [optimisticClients, setOptimisticClients] = useState<ClientVM[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<ClientFormShape>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Merge server data with any optimistic additions
  const serverClients: ClientVM[] = (rawClients ?? []).map(normalizeClient)
  const clients: ClientVM[] = [
    ...optimisticClients.filter(oc => !serverClients.find(s => s.id === oc.id)),
    ...serverClients,
  ]

  const filtered = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function openAdd() {
    setForm({})
    setFormErrors({})
    setSaveError(null)
    setModalOpen(true)
  }

  function validateForm() {
    const e: Record<string, string> = {}
    if (!form.name?.trim()) e.name = locale === "uz" ? "Ism kiritish shart" : "Имя обязательно"
    return e
  }

  async function handleSave() {
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setFormErrors({})
    setSaving(true)
    setSaveError(null)
    try {
      const created = await clientService.create({
        ism: form.name,
        telefon: form.phone || undefined,
        manzil: form.address || undefined,
        kredit_limit: form.creditLimit ? Number(form.creditLimit) : 0,
      })
      // Add to optimistic list immediately while server data refreshes
      setOptimisticClients(prev => [normalizeClient(created), ...prev])
      setModalOpen(false)
      refetch()
    } catch (err) {
      const msg = err instanceof ApiResponseError ? err.detail : (locale === "uz" ? "Saqlashda xato" : "Ошибка сохранения")
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const totalRevenue = clients.reduce((s, c) => s + c.totalPurchases, 0)
  const totalDebt = clients.reduce((s, c) => s + c.totalDebt, 0)

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && <>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary text-primary shrink-0"><Users className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.totalClients[locale]}</p>
              <p className="text-xl font-bold text-foreground truncate">{clients.length}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary text-green-500 shrink-0"><DollarSign className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.totalRevenue[locale]}</p>
              <p className="text-xl font-bold text-foreground truncate">{fmt(totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary text-destructive shrink-0"><AlertCircle className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.outstandingDebt[locale]}</p>
              <p className="text-xl font-bold text-foreground truncate">{fmt(totalDebt)}</p>
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
                <SelectItem value="active">{translations.status.active[locale]}</SelectItem>
                <SelectItem value="inactive">{translations.status.inactive[locale]}</SelectItem>
                <SelectItem value="prospect">{translations.status.prospect[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> {L.addClient[locale]}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead>{L.client[locale]}</TableHead>
                <TableHead>{locale === "uz" ? "Manzil" : "Адрес"}</TableHead>
                <TableHead>{translations.fields.phone[locale]}</TableHead>
                <TableHead>{translations.fields.status[locale]}</TableHead>
                <TableHead className="text-right">{L.purchases[locale]}</TableHead>
                <TableHead className="text-right">{L.debt[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {L.noClients[locale]}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(client => (
                  <TableRow key={client.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {(client.name || "?").split(" ").map(n => n?.[0] ?? "").join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{client.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.address || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.phone || "—"}</TableCell>
                    <TableCell><StatusBadge status={client.status} /></TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">{fmt(client.totalPurchases)}</TableCell>
                    <TableCell className="text-right text-sm">
                      <span className={client.totalDebt > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {fmt(client.totalDebt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit/delete not supported by backend yet */}
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled title={locale === "uz" ? "Tez orada" : "Скоро"}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled title={locale === "uz" ? "Tez orada" : "Скоро"}>
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
        </>}
      </div>

      {/* Add Client Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{L.addNewClient[locale]}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {[
              { id: "name",        label: locale === "uz" ? "Ism" : "Имя",              type: "text",  placeholder: locale === "uz" ? "Jasur Toshmatov" : "Иван Иванов" },
              { id: "phone",       label: translations.fields.phone[locale],             type: "tel",   placeholder: "+998 90 123-4567" },
              { id: "address",     label: locale === "uz" ? "Manzil" : "Адрес",          type: "text",  placeholder: locale === "uz" ? "Toshkent sh." : "г. Ташкент" },
              { id: "creditLimit", label: locale === "uz" ? "Kredit limiti" : "Кредитный лимит", type: "number", placeholder: "0" },
            ].map(field => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form as Record<string, string>)[field.id] || ""}
                  onChange={e => setForm(p => ({ ...p, [field.id]: e.target.value }))}
                  className={formErrors[field.id] ? "border-destructive" : ""}
                />
                {formErrors[field.id] && <p className="text-xs text-destructive">{formErrors[field.id]}</p>}
              </div>
            ))}
            {saveError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{saveError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (locale === "uz" ? "Saqlanmoqda..." : "Сохранение...") : L.addClient[locale]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
