"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageLoading, PageError } from "@/components/ui/loading"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import { adaptClient } from "@/lib/adapters"
import { clients as mockClients, type Client } from "@/lib/mock-data"
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

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n} so'm`
}

export default function ClientsPage() {
  const { locale } = useLocale()
  const L = translations.clients
  const { data: apiData, loading, error, reload } = useApi(() => api.getKlientlar(), [])
  const [clients, setClients] = useState<Client[]>(mockClients)

  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      setClients(apiData.map((x: Record<string, unknown>) => adaptClient(x)))
    } else if (apiData && typeof apiData === "object" && "items" in apiData && Array.isArray((apiData as { items: unknown[] }).items)) {
      setClients((apiData as { items: Record<string, unknown>[] }).items.map(adaptClient))
    }
  }, [apiData])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function openAdd() {
    setEditingClient(null)
    setForm({ status: "active" })
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({ ...client })
    setErrors({})
    setModalOpen(true)
  }

  function validateForm() {
    const e: Record<string, string> = {}
    if (!form.name?.trim()) e.name = "Ism kiritish shart"
    if (!form.email?.trim()) e.email = "Email kiritish shart"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Noto'g'ri email"
    if (!form.company?.trim()) e.company = "Kompaniya kiritish shart"
    return e
  }

  function handleSave() {
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...form } as Client : c))
    } else {
      const newClient: Client = {
        id: `c${Date.now()}`,
        name: form.name!,
        email: form.email!,
        phone: form.phone || "",
        company: form.company!,
        status: (form.status as Client["status"]) || "active",
        totalPurchases: 0,
        totalDebt: 0,
        joinedAt: new Date().toISOString().split("T")[0],
      }
      setClients(prev => [newClient, ...prev])
    }
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const totalRevenue = clients.reduce((s, c) => s + c.totalPurchases, 0)
  const totalDebt = clients.reduce((s, c) => s + c.totalDebt, 0)

  if (loading) return <AdminLayout title={L.title[locale]}><PageLoading /></AdminLayout>
  if (error) return <AdminLayout title={L.title[locale]}><PageError message={error} onRetry={reload} /></AdminLayout>

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
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
                <TableHead>{translations.fields.company[locale]}</TableHead>
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
                            {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.company}</TableCell>
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(client)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(client.id)}>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? L.editClient[locale] : L.addNewClient[locale]}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {[
              { id: "name", label: "To'liq ism", type: "text", placeholder: "Jasur Toshmatov" },
              { id: "email", label: "Email", type: "email", placeholder: "jasur@kompaniya.com" },
              { id: "phone", label: "Telefon", type: "tel", placeholder: "+998 90 123-4567" },
              { id: "company", label: "Kompaniya", type: "text", placeholder: "Akme MChJ" },
            ].map(field => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form as any)[field.id] || ""}
                  onChange={e => setForm(p => ({ ...p, [field.id]: e.target.value }))}
                  className={errors[field.id] ? "border-destructive" : ""}
                />
                {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Holat</Label>
              <Select value={form.status || "active"} onValueChange={v => setForm(p => ({ ...p, status: v as Client["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                  <SelectItem value="prospect">Potentsial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleSave}>{editingClient ? L.saveChanges[locale] : L.addClient[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
