"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tag, Users, Percent, Plus, Pencil, Trash2, Check, Search,
  Package, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { priceService, productService, clientService } from "@/lib/api/services"
import {
  normalizePriceGroup, normalizeProduct, normalizeClient,
  type PriceGroupVM,
} from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

function discountedPrice(price: number, discount: number) {
  return price * (1 - discount / 100)
}

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  VIP:      { bg: "bg-amber-500/10 dark:bg-yellow-900/20",  text: "text-amber-700 dark:text-amber-300 dark:text-yellow-300",  border: "border-amber-500/30 dark:border-yellow-800" },
  Doimiy:   { bg: "bg-blue-50 dark:bg-blue-900/20",      text: "text-blue-700 dark:text-blue-300",      border: "border-blue-200 dark:border-blue-800" },
  Standart: { bg: "bg-secondary",                         text: "text-foreground",                       border: "border-border" },
}
function getGroupStyle(name: string) {
  return GROUP_COLORS[name] ?? GROUP_COLORS["Standart"]
}

const emptyForm = { name: "", discount: 0, description: "" }

export default function PricesPage() {
  const { locale } = useLocale()
  const L = translations.prices

  // ── API data ────────────────────────────────────────────────────────────────
  const { data: rawGroups, loading: groupsLoading, error: groupsError, refetch: refetchGroups } = useApi(priceService.groups)
  const { data: rawProducts, loading: productsLoading } = useApi(productService.list)
  const { data: rawClients, loading: clientsLoading } = useApi(clientService.list)

  const groups: PriceGroupVM[] = (rawGroups ?? []).map(normalizePriceGroup)
  const products = (rawProducts ?? []).map(normalizeProduct)
  const clients = (rawClients ?? []).map(normalizeClient)

  // ── Local state ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<PriceGroupVM | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignGroup, setAssignGroup] = useState<PriceGroupVM | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PriceGroupVM | null>(null)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({})
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(g: PriceGroupVM) {
    setEditing(g)
    setForm({ name: g.name, discount: g.discount, description: g.description })
    setErrors({})
    setModalOpen(true)
  }

  function openAssign(g: PriceGroupVM) {
    setAssignGroup(g)
    setAssignedIds([...g.clientIds])
    setClientSearch("")
    setAssignOpen(true)
  }

  function validate() {
    const e: Partial<typeof emptyForm> = {}
    if (!form.name.trim()) e.name = "Nomi kiritish shart"
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      if (editing) {
        // No update endpoint in contract — use create as upsert or keep optimistic
        // For now: update group name via API is not in contract, keep UI honest
      } else {
        await priceService.createGroup({
          nomi: form.name,
          chegirma: form.discount,
          tavsif: form.description,
        })
        refetchGroups()
      }
      setModalOpen(false)
    } catch {
      // keep modal open
    } finally {
      setSaving(false)
    }
  }

  function toggleClient(cId: string) {
    setAssignedIds(prev => prev.includes(cId) ? prev.filter(x => x !== cId) : [...prev, cId])
  }

  async function saveAssignments() {
    if (!assignGroup) return
    setAssigning(true)
    try {
      // Call assignClientGroup for each newly added client
      const toAdd = assignedIds.filter(id => !assignGroup.clientIds.includes(id))
      await Promise.all(toAdd.map(clientId =>
        priceService.assignClientGroup({ guruh_id: Number(assignGroup.id), klient_id: Number(clientId) })
      ))
      refetchGroups()
      setAssignOpen(false)
    } catch {
      // keep sheet open; user can retry
    } finally {
      setAssigning(false)
    }
  }

  const filteredAssignClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const loading = groupsLoading || productsLoading || clientsLoading
  const error = groupsError

  // Sync selected with refreshed groups list
  const syncedSelected = selected
    ? groups.find(g => g.id === selected.id) ?? selected
    : null

  const avgDiscount = groups.length > 0
    ? (groups.reduce((s, g) => s + g.discount, 0) / groups.length).toFixed(0)
    : "0"

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetchGroups} />}
        {!loading && !error && <>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: L.priceGroups[locale],                                                          value: String(groups.length),  icon: Tag,     color: "text-primary",    bg: "bg-secondary" },
            { label: locale === "uz" ? "Mijozlar"        : "Клиенты",                            value: String(clients.length), icon: Users,   color: "text-emerald-500",  bg: "bg-emerald-500/15 dark:bg-green-900/20" },
            { label: locale === "uz" ? "O'rtacha chegirma" : "Средняя скидка",                   value: `${avgDiscount}%`,     icon: Percent, color: "text-amber-500", bg: "bg-amber-500/15 dark:bg-yellow-900/20" },
          ].map(s => (
            <div key={s.label} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
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

        {/* Content: group cards left, detail right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Price group cards (left) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-foreground">{L.priceGroups[locale]}</h2>
              <Button onClick={openAdd} size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> {L.addGroup[locale]}
              </Button>
            </div>

            {groups.length === 0 ? (
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-8 text-center">
                <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{L.noGroups[locale]}</p>
              </div>
            ) : groups.map(g => {
              const style = getGroupStyle(g.name)
              const isActive = syncedSelected?.id === g.id
              return (
                <div
                  key={g.id}
                  onClick={() => setSelected(isActive ? null : g)}
                  className={cn(
                    "border rounded-xl p-4 cursor-pointer transition-all",
                    style.bg, style.border,
                    isActive && "ring-2 ring-primary ring-offset-1"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg bg-background shrink-0", style.text)}>
                        <Percent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-semibold text-sm", style.text)}>{g.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); openEdit(g) }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                        disabled title={locale === "uz" ? "Tez orada" : "Скоро"}
                        onClick={e => e.stopPropagation()}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      <span className={cn("font-bold text-base", style.text)}>{g.discount}%</span>
                      <span className="text-muted-foreground">{locale === "uz" ? "chegirma" : "скидка"}</span>
                    </div>
                  </div>

                  <Button
                    size="sm" variant="outline"
                    className={cn("w-full mt-3 gap-1.5 text-xs h-7", style.border)}
                    onClick={e => { e.stopPropagation(); openAssign(g) }}
                  >
                    <Users className="w-3 h-3" /> {L.assignClients[locale]}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Detail panel (right) */}
          <div className="lg:col-span-3 space-y-4">
            {syncedSelected ? (
              <>
                {/* Group info */}
                <div className={cn("border rounded-xl p-5", getGroupStyle(syncedSelected.name).bg, getGroupStyle(syncedSelected.name).border)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className={cn("font-bold text-base", getGroupStyle(syncedSelected.name).text)}>{syncedSelected.name}</h3>
                      <p className="text-xs text-muted-foreground">{syncedSelected.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-3xl font-bold", getGroupStyle(syncedSelected.name).text)}>{syncedSelected.discount}%</p>
                      <p className="text-xs text-muted-foreground">{locale === "uz" ? "chegirma" : "скидка"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(syncedSelected)}>
                      <Pencil className="w-3.5 h-3.5" /> {translations.actions.edit[locale]}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openAssign(syncedSelected)}>
                      <Users className="w-3.5 h-3.5" /> {L.assignClients[locale]}
                    </Button>
                  </div>
                </div>

                {/* Product price table with discount */}
                <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {locale === "uz"
                        ? `Narxlar (${syncedSelected.discount}% chegirma bilan)`
                        : `Цены (скидка ${syncedSelected.discount}%)`}
                    </h4>
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder={locale === "uz" ? "Mahsulot qidirish..." : "Поиск товара..."}
                        className="pl-8 h-7 text-xs"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      {locale === "uz" ? "Mahsulot topilmadi" : "Продукты не найдены"}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{locale === "uz" ? "Mahsulot"       : "Товар"}</TableHead>
                          <TableHead className="text-right">{locale === "uz" ? "Asosiy narx"     : "Базовая цена"}</TableHead>
                          <TableHead className="text-right text-emerald-600 dark:text-emerald-400 dark:text-green-400">{locale === "uz" ? "Chegirmali narx" : "Цена со скидкой"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map(p => (
                          <TableRow key={p.id} className="border-b border-border hover:bg-secondary/50">
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-foreground">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground line-through">
                              {fmt(p.price)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400 dark:text-green-400">
                              {fmt(discountedPrice(p.price, syncedSelected.discount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <Tag className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="font-medium text-foreground mb-1">
                  {locale === "uz" ? "Narx guruhini tanlang" : "Выберите ценовую группу"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "uz"
                    ? "Tafsilotlarni ko'rish uchun chap tomondagi guruhga bosing"
                    : "Нажмите на группу слева, чтобы просмотреть детали"}
                </p>
              </div>
            )}
          </div>
        </div>
        </>}
      </div>

      {/* Assign Clients Sheet */}
      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {assignGroup && (
            <>
              <SheetHeader>
                <SheetTitle>{L.assignClients[locale]} — {assignGroup.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={locale === "uz" ? "Mijoz qidirish..." : "Поиск клиента..."}
                    className="pl-9"
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  {filteredAssignClients.map(c => {
                    const isChecked = assignedIds.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleClient(c.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          isChecked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-secondary"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors",
                          isChecked ? "border-primary bg-primary" : "border-border"
                        )}>
                          {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                        </div>
                        {isChecked && (
                          <Badge className="text-[10px] shrink-0 bg-primary/15 text-primary border-0">
                            Tanlangan
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border sticky bottom-0 bg-background pb-2">
                  <Button variant="outline" className="flex-1" onClick={() => setAssignOpen(false)}>
                    {translations.actions.cancel[locale]}
                  </Button>
                  <Button className="flex-1" onClick={saveAssignments} disabled={assigning}>
                    {assigning && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    {translations.actions.save[locale]} ({assignedIds.length})
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Group Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? (locale === "uz" ? "Guruhni tahrirlash" : "Редактировать группу")
                : (locale === "uz" ? "Yangi narx guruhi"  : "Новая ценовая группа")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{L.groupName[locale]}</Label>
              <Input
                placeholder="VIP"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{L.discount[locale]} (%)</Label>
              <Input
                type="number" min={0} max={100}
                value={form.discount}
                onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{translations.fields.description[locale]}</Label>
              <Textarea
                placeholder={locale === "uz" ? "Guruh tavsifi..." : "Описание группы..."}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground italic">
                {locale === "uz" ? "Guruhni tahrirlash hali backend tomonidan qo'llab-quvvatlanmaydi." : "Редактирование группы пока не поддерживается бэкендом."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleSave} disabled={saving || !!editing}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {editing ? translations.actions.save[locale] : L.addGroup[locale]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
