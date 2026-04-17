"use client"

/**
 * Narx turlari — SalesDoc /settings/priceType analog.
 *
 * Ustunlar: ID | Kod | Nomi | Turi (Prodaja/Zakup/Prayslist) | Tavsif | To'lov usuli
 * Aktiv/Nofaol tablari + qidiruv + Naenka (markup).
 *
 * SalesDocdan farqi:
 * - Turi bo'yicha gradient rang (Prodaja=emerald, Zakup=amber, Prayslist=indigo)
 * - Tovar soni badge (bu narx turi qancha tovarda ishlatilgan)
 * - Oxirgi narx o'rnatilgan sana
 * - Tugmali "Naenka qo'llash" — bir zarb bilan hamma tovarga markup
 */

import { useState, useMemo, useCallback, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { narxV2Service, type NarxTuri, type NarxTuriItem, type NarxTuriPayload } from "@/lib/api/services"
import {
  Tag, Plus, Edit, Trash2, Check, X, Search, TrendingUp,
  ShoppingCart, FileText, Calendar, Package,
} from "lucide-react"

const TURI_META: Record<NarxTuri, { label: string; desc: string; color: string; accent: string; icon: React.ComponentType<{ className?: string }> }> = {
  prodaja: {
    label: "Prodaja (Sotish)",
    desc: "Tovarni klientga sotish narxi",
    color: "from-emerald-500 to-teal-600",
    accent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    icon: TrendingUp,
  },
  zakup: {
    label: "Zakup (Olish)",
    desc: "Yetkazib beruvchidan olish narxi",
    color: "from-amber-500 to-orange-600",
    accent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    icon: ShoppingCart,
  },
  prayslist: {
    label: "Prayslist",
    desc: "Muddati belgilangan narx ro'yxati",
    color: "from-indigo-500 to-purple-600",
    accent: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    icon: FileText,
  },
}


// ═══ FORM DIALOG ═══
function NarxTuriDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: NarxTuriItem | null
  onSaved: () => void
}) {
  const [form, setForm] = useState<NarxTuriPayload>({
    nomi: "",
    kod: "",
    turi: "prodaja",
    tavsif: "",
    tolov_usuli: "",
    foiz_chegirma: 0,
    tartib: 0,
    faol: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setForm({
        nomi: initial?.nomi || "",
        kod: initial?.kod || "",
        turi: initial?.turi || "prodaja",
        tavsif: initial?.tavsif || "",
        tolov_usuli: initial?.tolov_usuli || "",
        foiz_chegirma: initial?.foiz_chegirma || 0,
        tartib: initial?.tartib || 0,
        faol: initial?.faol ?? true,
      })
      setError("")
    }
  }, [open, initial])

  const save = async () => {
    if (!form.nomi.trim()) { setError("Nomi bo'sh bo'lishi mumkin emas"); return }
    setSaving(true); setError("")
    try {
      if (initial?.id) {
        await narxV2Service.update(initial.id, form)
      } else {
        await narxV2Service.create(form)
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xato")
    } finally {
      setSaving(false)
    }
  }

  const meta = TURI_META[form.turi]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
              <meta.icon className="w-4 h-4 text-white" />
            </div>
            {initial?.id ? "Narx turini tahrirlash" : "Yangi narx turi"}
          </DialogTitle>
          <DialogDescription>{meta.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Nomi *</Label>
            <Input
              autoFocus
              placeholder="Masalan: Chakana, VIP, Optom, Aprel aksiya"
              value={form.nomi}
              onChange={(e) => setForm(f => ({ ...f, nomi: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kod</Label>
              <Input
                placeholder="CH1, OPT..."
                value={form.kod || ""}
                onChange={(e) => setForm(f => ({ ...f, kod: e.target.value }))}
              />
            </div>
            <div>
              <Label>Turi *</Label>
              <select
                value={form.turi}
                onChange={(e) => setForm(f => ({ ...f, turi: e.target.value as NarxTuri }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="prodaja">Prodaja (sotish)</option>
                <option value="zakup">Zakup (olish)</option>
                <option value="prayslist">Prayslist</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Tavsif</Label>
            <Textarea
              rows={2}
              placeholder="Qachon qo'llaniladi, qanday tariff..."
              value={form.tavsif || ""}
              onChange={(e) => setForm(f => ({ ...f, tavsif: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>To&apos;lov usuli</Label>
              <Input
                placeholder="Naqd Sum, Karta..."
                value={form.tolov_usuli || ""}
                onChange={(e) => setForm(f => ({ ...f, tolov_usuli: e.target.value }))}
              />
            </div>
            <div>
              <Label>Foiz chegirma</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.foiz_chegirma || 0}
                onChange={(e) => setForm(f => ({ ...f, foiz_chegirma: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="flex items-center gap-2 cursor-pointer">
              <span>Faol</span>
            </Label>
            <Switch checked={form.faol ?? true} onCheckedChange={(v) => setForm(f => ({ ...f, faol: v }))} />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" /> Bekor
          </Button>
          <Button
            className={`bg-gradient-to-r ${meta.color} text-white hover:opacity-90`}
            onClick={save}
            disabled={saving}
          >
            <Check className="w-4 h-4 mr-2" />
            {saving ? "Saqlanyapti..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ═══ MAIN PAGE ═══
export default function PriceTypesPage() {
  const [activeTab, setActiveTab] = useState<"active" | "inactive" | "all">("active")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<NarxTuriItem | null>(null)
  const [markupOpen, setMarkupOpen] = useState(false)
  const [markupFor, setMarkupFor] = useState<NarxTuriItem | null>(null)
  const [markupFoiz, setMarkupFoiz] = useState(20)
  const [markupSaving, setMarkupSaving] = useState(false)

  const { data, loading, error, refetch } = useApi(() => narxV2Service.list(), [])

  const filtered = useMemo(() => {
    let list = data?.items || []
    if (activeTab === "active") list = list.filter(i => i.faol)
    else if (activeTab === "inactive") list = list.filter(i => !i.faol)
    if (search) {
      const n = search.toLowerCase()
      list = list.filter(i =>
        i.nomi.toLowerCase().includes(n) ||
        (i.kod || "").toLowerCase().includes(n) ||
        (i.tavsif || "").toLowerCase().includes(n)
      )
    }
    return list
  }, [data, activeTab, search])

  const countsByTuri = useMemo(() => {
    const c: Record<NarxTuri, number> = { prodaja: 0, zakup: 0, prayslist: 0 }
    for (const i of data?.items || []) c[i.turi] = (c[i.turi] || 0) + 1
    return c
  }, [data])

  const handleEdit = useCallback((it: NarxTuriItem) => {
    setEditItem(it)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (it: NarxTuriItem) => {
    if (!confirm(`"${it.nomi}"ni o'chiramizmi? ${it.tovar_soni > 0 ? `(${it.tovar_soni} ta tovarga bog'langan)` : ""}`)) return
    try {
      await narxV2Service.remove(it.id)
      refetch()
    } catch (e) {
      alert("Xato: " + (e instanceof Error ? e.message : String(e)))
    }
  }, [refetch])

  const openMarkup = useCallback((it: NarxTuriItem) => {
    setMarkupFor(it)
    setMarkupFoiz(20)
    setMarkupOpen(true)
  }, [])

  const applyMarkup = async () => {
    if (!markupFor) return
    setMarkupSaving(true)
    try {
      const res = await narxV2Service.applyMarkup(markupFor.id, markupFoiz, true)
      alert(`✅ Narxlar o'rnatildi\n\n${res.tovarlar_soni} ta tovarga ${markupFoiz}% naenka qo'llandi.`)
      setMarkupOpen(false)
      refetch()
    } catch (e) {
      alert("Xato: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setMarkupSaving(false)
    }
  }

  return (
    <AdminLayout title="Narx turlari">
      <div className="space-y-6">
        {/* TOP BANNER */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Tag className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Narx turlari</h2>
            <p className="text-sm opacity-80 mb-4">
              SalesDoc /settings/priceType analog — har tur chakana/optom/VIP,
              har turi prodaja/zakup/prayslist bo&apos;lishi mumkin.
            </p>
            <div className="flex flex-wrap gap-4">
              {(Object.keys(TURI_META) as NarxTuri[]).map((t) => {
                const m = TURI_META[t]
                const Icon = m.icon
                return (
                  <div key={t} className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="text-xs opacity-80">{m.label}</div>
                      <div className="text-xl font-bold">{countsByTuri[t] || 0}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nomi, kod yoki tavsifdan qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => { setEditItem(null); setDialogOpen(true) }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yangi narx turi
              </Button>
            </div>

            {/* Aktiv/Nofaol tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "inactive" | "all")}>
              <TabsList>
                <TabsTrigger value="active">Faollar</TabsTrigger>
                <TabsTrigger value="inactive">Nofaol</TabsTrigger>
                <TabsTrigger value="all">Hammasi</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="pt-4">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead className="w-24">Kod</TableHead>
                        <TableHead>Nomi</TableHead>
                        <TableHead>Turi</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead>To&apos;lov</TableHead>
                        <TableHead className="text-center">Tovar</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            <Tag className="w-12 h-12 mx-auto opacity-30 mb-2" />
                            Hech qanday narx turi yo&apos;q
                          </TableCell>
                        </TableRow>
                      ) : filtered.map((it) => {
                        const m = TURI_META[it.turi]
                        return (
                          <TableRow key={it.id} className={!it.faol ? "opacity-60" : ""}>
                            <TableCell className="font-mono text-xs">#{it.id}</TableCell>
                            <TableCell className="font-mono text-xs">{it.kod || "—"}</TableCell>
                            <TableCell>
                              <div className="font-semibold">{it.nomi}</div>
                              {it.oxirgi_narx_sanasi && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(it.oxirgi_narx_sanasi).toLocaleDateString("uz-UZ")}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={m.accent}>
                                <m.icon className="w-3 h-3 mr-1 inline" />
                                {m.label.split(" ")[0]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {it.tavsif || "—"}
                            </TableCell>
                            <TableCell className="text-sm">{it.tolov_usuli || "—"}</TableCell>
                            <TableCell className="text-center">
                              {it.tovar_soni > 0 ? (
                                <Badge className={m.accent}>
                                  <Package className="w-3 h-3 mr-1 inline" />
                                  {it.tovar_soni}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="outline" onClick={() => openMarkup(it)} title="Naenka (markup) qo'llash">
                                  +% Naenka
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(it)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost"
                                  onClick={() => handleDelete(it)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {dialogOpen && (
          <NarxTuriDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            initial={editItem}
            onSaved={refetch}
          />
        )}

        {/* MARKUP DIALOG */}
        <Dialog open={markupOpen} onOpenChange={setMarkupOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Naenka (markup) qo&apos;llash
              </DialogTitle>
              <DialogDescription>
                {markupFor?.nomi}: olish narxidan +{markupFoiz}% qo&apos;shib narx o&apos;rnatiladi
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Markup foizi</Label>
                <Input
                  type="number"
                  value={markupFoiz}
                  onChange={(e) => setMarkupFoiz(Number(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Misol: olish 1000, +20% = 1200 so&apos;m
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-sm">
                ⚠️ Faqat bu narx turida hali narxi o&apos;rnatilmagan tovarlarga qo&apos;llanadi.
                Mavjud narxlar saqlanib qoladi.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMarkupOpen(false)}>Bekor</Button>
              <Button onClick={applyMarkup} disabled={markupSaving}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {markupSaving ? "Qo'llanmoqda..." : "Qo'llash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
