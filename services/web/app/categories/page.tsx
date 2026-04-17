"use client"

/**
 * Tovar klassifikatorlari — SalesDoc /settings/view/productCategory analogi.
 *
 * 7 tab: kategoriya, subkategoriya, gruppa, brend, ishlab chiqaruvchi,
 * segment, gruppa kategoriya. Har birida CRUD + qidirish + aktivlik filter.
 *
 * SalesDocdan farqi:
 * - Bitta yagona jadval (tezroq), 7 ta alohida emas
 * - Har bir elementda foydalanuvchi tovar soni ko'rsatiladi ("14 ta tovar")
 * - Gradient ranglarli tab chiplar + keyboard shortcuts (1-7)
 * - Tezkor qidirish — barcha tablarda bir joyda
 */

import { useState, useMemo, useCallback, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import {
  classifierService,
  type KlassifikatorTuri,
  type KlassifikatorItem,
  type KlassifikatorPayload,
} from "@/lib/api/services"
import {
  Folder, Grid3x3, Package, Award, Factory, Tag, Layers,
  Plus, Search, Edit, Trash2, Check, X, Hash, Flag, Globe2,
} from "lucide-react"

// Tab meta — icon + colors + label
type TabMeta = {
  key: KlassifikatorTuri
  label: string
  shortLabel: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string   // for active tab pill
  accent: string     // for badges
  addLabel: string
  hasParent?: boolean
  hasUnit?: boolean
  hasCountry?: boolean
}

const TABS: TabMeta[] = [
  { key: "kategoriya", label: "Kategoriya", shortLabel: "Kat", desc: "Asosiy tovar kategoriyasi",
    icon: Folder, gradient: "from-blue-500 to-indigo-600", accent: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    addLabel: "Yangi kategoriya", hasUnit: true },
  { key: "subkategoriya", label: "Subkategoriya", shortLabel: "Sub", desc: "Kategoriya ichidagi guruh",
    icon: Grid3x3, gradient: "from-cyan-500 to-blue-600", accent: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    addLabel: "Yangi subkategoriya", hasParent: true },
  { key: "gruppa", label: "Gruppa", shortLabel: "Gr", desc: "Tavsifli guruhlash",
    icon: Package, gradient: "from-teal-500 to-emerald-600", accent: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    addLabel: "Yangi gruppa" },
  { key: "brend", label: "Brend", shortLabel: "Brend", desc: "Ariel, Samsung, Coca-Cola...",
    icon: Award, gradient: "from-fuchsia-500 to-pink-600", accent: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    addLabel: "Yangi brend" },
  { key: "ishlab_chiqaruvchi", label: "Ishlab chiqaruvchi", shortLabel: "Manu", desc: "Zavod, fabrika, davlat",
    icon: Factory, gradient: "from-amber-500 to-orange-600", accent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    addLabel: "Yangi ishlab chiqaruvchi", hasCountry: true },
  { key: "segment", label: "Segment", shortLabel: "Seg", desc: "Premium, chakana, VIP",
    icon: Tag, gradient: "from-violet-500 to-purple-600", accent: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    addLabel: "Yangi segment" },
  { key: "gruppa_kategoriya", label: "Gruppa kategoriya", shortLabel: "GrKat", desc: "Kategoriyalarni umumlashtiradi",
    icon: Layers, gradient: "from-rose-500 to-red-600", accent: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    addLabel: "Yangi gruppa kategoriya" },
]

// ═════════════════════════════════════════════════════════════════
// FORM DIALOG
// ═════════════════════════════════════════════════════════════════
function ItemDialog({
  meta, parents, open, onOpenChange, initial, onSaved,
}: {
  meta: TabMeta
  parents: KlassifikatorItem[]
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: KlassifikatorItem | null
  onSaved: () => void
}) {
  const [nomi, setNomi] = useState(initial?.nomi || "")
  const [kod, setKod] = useState(initial?.kod || "")
  const [davlat, setDavlat] = useState(initial?.davlat || "")
  const [parentId, setParentId] = useState<number | null>(initial?.parent_id || null)
  const [tartib, setTartib] = useState(initial?.tartib || 0)
  const [faol, setFaol] = useState(initial?.faol ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setNomi(initial?.nomi || "")
      setKod(initial?.kod || "")
      setDavlat(initial?.davlat || "")
      setParentId(initial?.parent_id || null)
      setTartib(initial?.tartib || 0)
      setFaol(initial?.faol ?? true)
      setError("")
    }
  }, [open, initial])

  const save = async () => {
    if (!nomi.trim()) { setError("Nomi bo'sh bo'lishi mumkin emas"); return }
    setSaving(true); setError("")
    const payload: KlassifikatorPayload = {
      turi: meta.key,
      nomi: nomi.trim(),
      kod: kod.trim() || null,
      davlat: meta.hasCountry ? (davlat.trim() || null) : null,
      parent_id: meta.hasParent ? parentId : null,
      tartib,
      faol,
    }
    try {
      if (initial?.id) {
        await classifierService.update(initial.id, payload)
      } else {
        await classifierService.create(payload)
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
              <meta.icon className="w-4 h-4 text-white" />
            </div>
            {initial?.id ? "Tahrirlash" : meta.addLabel}
          </DialogTitle>
          <DialogDescription>{meta.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="nomi">Nomi *</Label>
            <Input
              id="nomi"
              autoFocus
              placeholder={`Masalan: ${meta.key === "brend" ? "Ariel" : meta.key === "ishlab_chiqaruvchi" ? "Procter & Gamble" : "Yangi " + meta.shortLabel}`}
              value={nomi}
              onChange={(e) => setNomi(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="kod" className="flex items-center gap-1">
              <Hash className="w-3 h-3" /> Kod (ichki)
            </Label>
            <Input
              id="kod"
              placeholder="Ixtiyoriy (ichki referens)"
              value={kod}
              onChange={(e) => setKod(e.target.value)}
            />
          </div>

          {meta.hasCountry && (
            <div>
              <Label htmlFor="davlat" className="flex items-center gap-1">
                <Globe2 className="w-3 h-3" /> Davlat
              </Label>
              <Input
                id="davlat"
                placeholder="Masalan: Turkiya, O'zbekiston"
                value={davlat}
                onChange={(e) => setDavlat(e.target.value)}
              />
            </div>
          )}

          {meta.hasParent && parents.length > 0 && (
            <div>
              <Label htmlFor="parent">Ota kategoriya</Label>
              <select
                id="parent"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={parentId || ""}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Tanlanmagan —</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.nomi}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="tartib">Tartib (kichik son = yuqorida)</Label>
            <Input
              id="tartib"
              type="number"
              value={tartib}
              onChange={(e) => setTartib(Number(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor="faol" className="flex items-center gap-2 cursor-pointer">
              <span>Faol</span>
              <span className="text-xs text-muted-foreground">(nofaol bo'lsa tovar formalarida ko'rinmaydi)</span>
            </Label>
            <Switch id="faol" checked={faol} onCheckedChange={setFaol} />
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
            className={`bg-gradient-to-r ${meta.gradient} text-white hover:opacity-90`}
            onClick={save}
            disabled={saving}
          >
            <Check className="w-4 h-4 mr-2" />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════
export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<KlassifikatorTuri>("kategoriya")
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [editItem, setEditItem] = useState<KlassifikatorItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, loading, error, refetch } = useApi(
    () => classifierService.list(),
    [],
  )

  // Keyboard shortcuts — 1-7 tanlash
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < TABS.length) setActiveTab(TABS[idx].key)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const meta = useMemo(() => TABS.find(t => t.key === activeTab)!, [activeTab])
  const parents = data?.items?.kategoriya || []

  const currentItems = useMemo(() => {
    const all = data?.items?.[activeTab] || []
    return all.filter(it => {
      if (!showInactive && !it.faol) return false
      if (search && !it.nomi.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [data, activeTab, search, showInactive])

  const handleAdd = useCallback(() => {
    setEditItem(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((it: KlassifikatorItem) => {
    setEditItem(it)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (it: KlassifikatorItem) => {
    if (it.tovar_soni > 0) {
      if (!confirm(`⚠️ "${it.nomi}"ga bog'langan ${it.tovar_soni} ta tovar bor.\nO'chirsangiz, ular "tegilmagan"ga aylanadi. Davom etamizmi?`)) return
    } else {
      if (!confirm(`"${it.nomi}"ni o'chiramizmi?`)) return
    }
    try {
      await classifierService.remove(it.id)
      refetch()
    } catch (e) {
      alert("Xatolik: " + (e instanceof Error ? e.message : String(e)))
    }
  }, [refetch])

  return (
    <AdminLayout title="Tovar klassifikatorlari">
      <div className="space-y-6">
        {/* TOP BANNER */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Layers className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Tovar klassifikatorlari</h2>
            <p className="text-sm opacity-80 mb-4">
              7 ta turdagi tovar tasnifi: kategoriya, subkategoriya, gruppa, brend,
              ishlab chiqaruvchi, segment va gruppa kategoriya.
              <span className="ml-2 opacity-60">(1–7 tugmalarini bosing)</span>
            </p>
            {data && (
              <div className="flex flex-wrap gap-4">
                {TABS.map((t, i) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`text-center px-3 py-2 rounded-lg transition-all ${
                      activeTab === t.key ? "bg-white/20 scale-110" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl font-bold">{data.totals[t.key] || 0}</div>
                    <div className="text-xs opacity-80 flex items-center gap-1">
                      <span className="inline-flex w-4 h-4 rounded-full bg-white/10 text-[9px] items-center justify-center font-bold">{i + 1}</span>
                      {t.shortLabel}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}

        {!loading && !error && data && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as KlassifikatorTuri)}>
            <TabsList className="flex flex-wrap h-auto p-1 gap-1 bg-muted/50">
              {TABS.map((t, i) => {
                const count = data.totals[t.key] || 0
                const isActive = activeTab === t.key
                return (
                  <TabsTrigger
                    key={t.key}
                    value={t.key}
                    className={`data-[state=active]:bg-gradient-to-r ${t.gradient} data-[state=active]:text-white data-[state=active]:shadow-lg gap-1.5 transition-all`}
                  >
                    <t.icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    <Badge variant={isActive ? "secondary" : "outline"} className={`ml-1 ${isActive ? "bg-white/20 text-white border-white/30" : ""}`}>
                      {count}
                    </Badge>
                    <span className="hidden md:inline opacity-50 text-[9px] ml-0.5">[{i + 1}]</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {TABS.map((t) => (
              <TabsContent key={t.key} value={t.key} className="space-y-4 pt-4">
                {/* TOOLBAR */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={`${t.label} ichidan qidirish...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Switch checked={showInactive} onCheckedChange={setShowInactive} />
                      <span>Nofaollar</span>
                    </label>
                    <Button
                      onClick={handleAdd}
                      className={`bg-gradient-to-r ${t.gradient} text-white hover:opacity-90`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addLabel}
                    </Button>
                  </div>
                </div>

                {/* GRID */}
                {currentItems.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <t.icon className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-3" />
                    <h3 className="font-semibold mb-1">
                      {search ? "Qidiruvga mos hech narsa topilmadi" : `Hech qanday ${t.label.toLowerCase()} yo'q`}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{t.desc}</p>
                    {!search && (
                      <Button onClick={handleAdd} className={`bg-gradient-to-r ${t.gradient} text-white hover:opacity-90`}>
                        <Plus className="w-4 h-4 mr-2" /> {t.addLabel}
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {currentItems.map((it) => (
                      <Card
                        key={it.id}
                        className={`p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden group ${
                          !it.faol ? "opacity-60" : ""
                        }`}
                        onClick={() => handleEdit(it)}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.gradient}`} />

                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex-shrink-0 flex items-center justify-center`}>
                              <t.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{it.nomi}</h4>
                              {it.kod && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Hash className="w-3 h-3" /> {it.kod}
                                </div>
                              )}
                            </div>
                          </div>
                          {!it.faol && <Badge variant="outline" className="flex-shrink-0 text-xs">Nofaol</Badge>}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 text-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {it.parent_nomi && (
                              <Badge variant="outline" className="text-xs">
                                ↳ {it.parent_nomi}
                              </Badge>
                            )}
                            {it.davlat && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Flag className="w-2.5 h-2.5" /> {it.davlat}
                              </Badge>
                            )}
                            {it.tovar_soni > 0 && (
                              <Badge className={t.accent}>
                                {it.tovar_soni} ta tovar
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleEdit(it) }}
                            className="h-7 px-2"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleDelete(it) }}
                            className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {dialogOpen && (
          <ItemDialog
            meta={meta}
            parents={parents}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            initial={editItem}
            onSaved={refetch}
          />
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          💡 Ovoz orqali qo&apos;shish: botda &quot;yangi brend Ariel&quot; yoki &quot;kategoriya kosmetika qo&apos;shish&quot; deb ayting.
        </p>
      </div>
    </AdminLayout>
  )
}
