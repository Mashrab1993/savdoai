"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Users, DollarSign, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import ClientDirectoryTable, { type ClientRowData } from "@/components/dashboard/client-directory-table"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { useApi } from "@/hooks/use-api"
import { clientService, klientTarixService } from "@/lib/api/services"
import { normalizeClient, type ClientVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { ApiResponseError } from "@/lib/api/client"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"

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
  const [editingClientId, setEditingClientId] = useState<number | null>(null)
  const [tarixOpen, setTarixOpen] = useState(false)
  const [tarixData, setTarixData] = useState<{
    klient: { ism?: string; telefon?: string; kredit_limit?: number; jami_sotib?: number; [k: string]: unknown }
    sotuvlar: Array<{ id?: number; jami?: number; qarz?: number; sana?: string; tovar_soni?: number }>
    qarzlar: Array<{ id?: number; qolgan?: number; yaratilgan?: string; muddat?: string; yopildi?: boolean }>
  } | null>(null)
  const [tarixLoading, setTarixLoading] = useState(false)
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
    setEditingClientId(null)
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
      if (editingClientId) {
        // Update existing client
        await clientService.update(editingClientId, {
          ism: form.name,
          telefon: form.phone || undefined,
          manzil: form.address || undefined,
          kredit_limit: form.creditLimit ? Number(form.creditLimit) : 0,
        })
      } else {
        // Create new client
        const created = await clientService.create({
          ism: form.name,
          telefon: form.phone || undefined,
          manzil: form.address || undefined,
          kredit_limit: form.creditLimit ? Number(form.creditLimit) : 0,
        })
        setOptimisticClients(prev => [normalizeClient(created), ...prev])
      }
      setModalOpen(false)
      setEditingClientId(null)
      setForm({})
      refetch()
    } catch (err) {
      const msg = err instanceof ApiResponseError ? err.detail : (locale === "uz" ? "Saqlashda xato" : "Ошибка сохранения")
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function openTarix(clientId: number) {
    setTarixOpen(true)
    setTarixLoading(true)
    try {
      const data = await klientTarixService.get(clientId, 20)
      setTarixData(data)
    } catch { setTarixData(null) }
    finally { setTarixLoading(false) }
  }

  const totalRevenue = clients.reduce((s, c) => s + c.totalPurchases, 0)
  const totalDebt = clients.reduce((s, c) => s + c.totalDebt, 0)

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && <>
        <PageHeader
          icon={Users}
          gradient="violet"
          title={L.title[locale]}
          subtitle={locale === "uz" ? "Barcha mijozlar va qarz holati" : "Все клиенты и долги"}
          action={
            <Button onClick={() => { setEditingClientId(null); setForm({}); setModalOpen(true) }}>
              <Plus className="w-4 h-4 mr-1" /> {L.addClient[locale]}
            </Button>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary text-primary shrink-0"><Users className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.totalClients[locale]}</p>
              <p className="text-xl font-bold text-foreground truncate">{clients.length}</p>
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
            <div className="p-2 rounded-lg bg-secondary text-green-500 shrink-0"><DollarSign className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{L.totalRevenue[locale]}</p>
              <p className="text-xl font-bold text-foreground truncate">{fmt(totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
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

        {/* Premium client directory (v0.dev → GPT-5 pipeline) */}
        <ClientDirectoryTable
          clients={filtered.map<ClientRowData>(c => ({
            id:            Number(c.id),
            ism:           c.name,
            telefon:       c.phone || undefined,
            manzil:        c.address || undefined,
            kategoriya:    undefined,
            kredit_limit:  c.creditLimit || 0,
            joriy_qarz:    c.totalDebt || 0,
            oxirgi_sotuv:  undefined,
            jami_xaridlar: c.totalPurchases || 0,
            xarid_soni:    0,
            faol:          c.status === "active",
          }))}
          onClientClick={id => openTarix(id)}
        />
        </>}
      </div>

      {/* Add Client Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClientId
              ? (locale === "uz" ? "Klientni tahrirlash" : "Редактировать клиента")
              : L.addNewClient[locale]}</DialogTitle>
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
              {saving
                ? (locale === "uz" ? "Saqlanmoqda..." : "Сохранение...")
                : editingClientId
                  ? (locale === "uz" ? "Saqlash" : "Сохранить")
                  : L.addClient[locale]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Klient tarix drawer */}
      <Sheet open={tarixOpen} onOpenChange={setTarixOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {locale === "uz" ? "Klient tarixi" : "История клиента"}
              {tarixData?.klient?.ism && ` — ${tarixData.klient.ism}`}
            </SheetTitle>
          </SheetHeader>
          {tarixLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}
            </div>
          ) : tarixData ? (
            <div className="mt-4 space-y-5">
              {/* Klient ma'lumot */}
              <div className="bg-secondary rounded-xl p-4 space-y-2">
                {[
                  { l: locale === "uz" ? "Telefon" : "Телефон", v: tarixData.klient?.telefon || "—" },
                  { l: locale === "uz" ? "Kredit limit" : "Кредитный лимит", v: fmt(tarixData.klient?.kredit_limit ?? 0) },
                  { l: locale === "uz" ? "Jami sotib olgan" : "Всего покупок", v: fmt(tarixData.klient?.jami_sotib ?? 0) },
                ].map(r => (
                  <div key={r.l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.l}</span>
                    <span className="font-medium">{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Sotuvlar */}
              {tarixData.sotuvlar?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {locale === "uz" ? "Oxirgi sotuvlar" : "Последние продажи"} ({tarixData.sotuvlar.length})
                  </p>
                  <div className="space-y-1.5">
                    {tarixData.sotuvlar.map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{fmt(s.jami ?? 0)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.sana ? new Date(s.sana).toLocaleDateString("uz-UZ") : "—"} · {s.tovar_soni ?? 0} ta tovar
                          </p>
                        </div>
                        {(s.qarz ?? 0) > 0 && (
                          <span className="text-xs text-destructive font-medium">{fmt(s.qarz ?? 0)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Qarzlar */}
              {tarixData.qarzlar?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {locale === "uz" ? "Qarzlar" : "Долги"} ({tarixData.qarzlar.length})
                  </p>
                  <div className="space-y-1.5">
                    {tarixData.qarzlar.map((q) => (
                      <div key={q.id} className="flex justify-between items-center bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{fmt(q.qolgan ?? 0)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {q.yaratilgan ? new Date(q.yaratilgan).toLocaleDateString("uz-UZ") : "—"}
                            {q.muddat && ` · muddat: ${new Date(q.muddat).toLocaleDateString("uz-UZ")}`}
                          </p>
                        </div>
                        <span className={`text-xs font-medium ${q.yopildi ? "text-green-600" : "text-destructive"}`}>
                          {q.yopildi ? "✅" : `${fmt(q.qolgan ?? 0)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {locale === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены"}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
