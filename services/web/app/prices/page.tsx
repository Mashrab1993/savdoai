"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageLoading, PageError } from "@/components/ui/loading"
import { api } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import { adaptPriceGroup } from "@/lib/adapters"
import {
  priceGroups as mockGroups,
  clients,
  products,
  type PriceGroup,
  type Client,
} from "@/lib/mock-data"
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
  ChevronRight, Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

function discountedPrice(price: number, discount: number) {
  return price * (1 - discount / 100)
}

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  VIP:       { bg: "bg-yellow-50 dark:bg-yellow-900/20",  text: "text-yellow-700 dark:text-yellow-300",  border: "border-yellow-200 dark:border-yellow-800" },
  Doimiy:    { bg: "bg-blue-50 dark:bg-blue-900/20",      text: "text-blue-700 dark:text-blue-300",      border: "border-blue-200 dark:border-blue-800" },
  Standart:  { bg: "bg-secondary",                         text: "text-foreground",                       border: "border-border" },
}
function getGroupStyle(name: string) {
  return GROUP_COLORS[name] ?? GROUP_COLORS["Standart"]
}

const emptyForm = { name: "", discount: 0, description: "" }

export default function PricesPage() {
  const { locale } = useLocale()
  const L = translations.prices
  const { data: apiData, loading, error, reload } = useApi(() => api.getNarxGuruhlar(), [])
  const [groups, setGroups] = useState<PriceGroup[]>(mockGroups)

  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      setGroups(apiData.map((x: Record<string, unknown>) => adaptPriceGroup(x) as PriceGroup))
    } else if (apiData && typeof apiData === "object" && "items" in apiData && Array.isArray((apiData as { items: unknown[] }).items)) {
      setGroups((apiData as { items: Record<string, unknown>[] }).items.map(x => adaptPriceGroup(x) as PriceGroup))
    }
  }, [apiData])
  const [selected, setSelected] = useState<PriceGroup | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignGroup, setAssignGroup] = useState<PriceGroup | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PriceGroup | null>(null)
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({})

  // Clients not in any group
  const ungroupedClients = clients.filter(c => !groups.some(g => g.clientIds.includes(c.id)))

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(g: PriceGroup) {
    setEditing(g)
    setForm({ name: g.name, discount: g.discount, description: g.description })
    setErrors({})
    setModalOpen(true)
  }

  function openAssign(g: PriceGroup) {
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

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (editing) {
      setGroups(prev => prev.map(g => g.id === editing.id ? { ...g, ...form } : g))
      if (selected?.id === editing.id) setSelected(s => s ? { ...s, ...form } : s)
    } else {
      const ng: PriceGroup = { id: `pg${Date.now()}`, ...form, clientIds: [] }
      setGroups(prev => [...prev, ng])
    }
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    setGroups(prev => prev.filter(g => g.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  function toggleClient(cId: string) {
    setAssignedIds(prev => prev.includes(cId) ? prev.filter(x => x !== cId) : [...prev, cId])
  }

  function saveAssignments() {
    if (!assignGroup) return
    setGroups(prev => prev.map(g => {
      if (g.id === assignGroup.id) return { ...g, clientIds: assignedIds }
      // remove from other groups if now assigned here
      return { ...g, clientIds: g.clientIds.filter(id => !assignedIds.includes(id)) }
    }))
    if (selected?.id === assignGroup.id) setSelected(s => s ? { ...s, clientIds: assignedIds } : s)
    setAssignOpen(false)
  }

  const filteredAssignClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.company.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  if (loading) return <AdminLayout title={L.title[locale]}><PageLoading /></AdminLayout>
  if (error) return <AdminLayout title={L.title[locale]}><PageError message={error} onRetry={reload} /></AdminLayout>

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: L.priceGroups[locale],      value: String(groups.length),                                           icon: Tag,     color: "text-primary",    bg: "bg-secondary" },
            { label: "Biriktirilgan mijozlar",    value: String(clients.length - ungroupedClients.length),               icon: Users,   color: "text-green-500",  bg: "bg-green-100 dark:bg-green-900/20" },
            { label: "O'rtacha chegirma",         value: `${(groups.reduce((s,g)=>s+g.discount,0)/groups.length||0).toFixed(0)}%`, icon: Percent, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
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
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{L.noGroups[locale]}</p>
              </div>
            ) : groups.map(g => {
              const style = getGroupStyle(g.name)
              const isActive = selected?.id === g.id
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
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); handleDelete(g.id) }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      <span className={cn("font-bold text-base", style.text)}>{g.discount}%</span>
                      <span className="text-muted-foreground">chegirma</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {g.clientIds.length} ta mijoz
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1 flex-wrap">
                    {g.clientIds.slice(0, 3).map(cId => {
                      const c = clients.find(x => x.id === cId)
                      return c ? (
                        <Badge key={cId} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {c.name.split(" ")[0]}
                        </Badge>
                      ) : null
                    })}
                    {g.clientIds.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        +{g.clientIds.length - 3}
                      </Badge>
                    )}
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

            {/* Ungrouped clients note */}
            {ungroupedClients.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Guruhga kiritilmagan mijozlar</p>
                <div className="flex gap-1 flex-wrap">
                  {ungroupedClients.map(c => (
                    <Badge key={c.id} variant="outline" className="text-[10px]">{c.name.split(" ")[0]}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detail panel (right) */}
          <div className="lg:col-span-3 space-y-4">
            {selected ? (
              <>
                {/* Group info */}
                <div className={cn("border rounded-xl p-5", getGroupStyle(selected.name).bg, getGroupStyle(selected.name).border)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className={cn("font-bold text-base", getGroupStyle(selected.name).text)}>{selected.name}</h3>
                      <p className="text-xs text-muted-foreground">{selected.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-3xl font-bold", getGroupStyle(selected.name).text)}>{selected.discount}%</p>
                      <p className="text-xs text-muted-foreground">chegirma</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(selected)}>
                      <Pencil className="w-3.5 h-3.5" /> {translations.actions.edit[locale]}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openAssign(selected)}>
                      <Users className="w-3.5 h-3.5" /> {L.assignClients[locale]}
                    </Button>
                  </div>
                </div>

                {/* Client-group relation: clients in this group */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Mijozlar ({selected.clientIds.length})
                    </h4>
                  </div>
                  {selected.clientIds.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">Hali mijoz biriktirilmagan</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mijoz</TableHead>
                          <TableHead>Kompaniya</TableHead>
                          <TableHead className="text-right">Jami xarid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.clientIds.map(cId => {
                          const c = clients.find(x => x.id === cId)
                          if (!c) return null
                          return (
                            <TableRow key={cId} className="border-b border-border hover:bg-secondary/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                    {c.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{c.company}</TableCell>
                              <TableCell className="text-right text-sm font-medium text-foreground">
                                {fmt(c.totalPurchases)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Product price table with discount */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Narxlar ({selected.discount}% chegirma bilan)
                    </h4>
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Mahsulot qidirish..."
                        className="pl-8 h-7 text-xs"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mahsulot</TableHead>
                        <TableHead className="text-right">Asosiy narx</TableHead>
                        <TableHead className="text-right text-green-600 dark:text-green-400">Chegirmali narx</TableHead>
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
                          <TableCell className="text-right text-sm font-semibold text-green-600 dark:text-green-400">
                            {fmt(discountedPrice(p.price, selected.discount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <Tag className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="font-medium text-foreground mb-1">Narx guruhini tanlang</p>
                <p className="text-sm text-muted-foreground">Tafsilotlarni ko'rish uchun chap tomondagi guruhga bosing</p>
              </div>
            )}
          </div>
        </div>
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
                    placeholder="Mijoz qidirish..."
                    className="pl-9"
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  {filteredAssignClients.map(c => {
                    const isChecked = assignedIds.includes(c.id)
                    const currentGroup = groups.find(g => g.clientIds.includes(c.id) && g.id !== assignGroup.id)
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
                          <p className="text-xs text-muted-foreground truncate">{c.company}</p>
                        </div>
                        {currentGroup && !isChecked && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">{currentGroup.name}</Badge>
                        )}
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
                  <Button className="flex-1" onClick={saveAssignments}>
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
            <DialogTitle>{editing ? "Guruhni tahrirlash" : "Yangi narx guruhi"}</DialogTitle>
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
                placeholder="Guruh tavsifi..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleSave}>{editing ? translations.actions.save[locale] : L.addGroup[locale]}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
