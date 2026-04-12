"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  ShoppingBag, Plus, Package, AlertCircle, Trash2, Eye,
  CheckCircle2, Clock, XCircle, Truck,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

type Supplier = { id: number; nomi: string; telefon?: string }

type PurchaseTovar = {
  nomi: string; miqdor: number; narx: number; birlik?: string;
  tovar_id?: number;
}

type Purchase = {
  id: number; supplier_id: number; supplier_nomi?: string;
  supplier_telefon?: string;
  holat: "tayyorlanmoqda" | "yuborildi" | "tasdiqlandi" | "yetkazildi" | "bekor";
  jami_summa: number; tovarlar: PurchaseTovar[]; tovar_soni?: number;
  izoh?: string; yaratilgan: string;
}

const HOLAT_META: Record<string, { label: string; bg: string; icon: typeof Clock }> = {
  tayyorlanmoqda: { label: "Tayyorlanmoqda", bg: "bg-blue-500/15 text-blue-800",        icon: Clock },
  yuborildi:      { label: "Yuborildi",      bg: "bg-amber-500/15 text-amber-800 dark:text-amber-300",    icon: Truck },
  tasdiqlandi:    { label: "Tasdiqlandi",    bg: "bg-sky-100 text-sky-800",          icon: CheckCircle2 },
  yetkazildi:     { label: "Yetkazildi",     bg: "bg-emerald-100 text-emerald-800",  icon: Package },
  bekor:          { label: "Bekor",          bg: "bg-rose-500/15 text-red-800",          icon: XCircle },
}

async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
  const base  = process.env.NEXT_PUBLIC_API_URL || ""
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

const today    = () => new Date().toISOString().split("T")[0]
const monthAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function PurchasePage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<{ soni?: number; jami?: number; pending?: number; yetkazilgan?: number }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sanaDan, setSanaDan] = useState(monthAgo())
  const [sanaGacha, setSanaGacha] = useState(today())
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Purchase | null>(null)

  const [form, setForm] = useState({
    supplier_id: 0,
    izoh: "",
    tovarlar: [] as PurchaseTovar[],
  })

  const fetchPurchases = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha })
      const data = await api<{ items: Purchase[]; stats: typeof stats }>(
        `/api/v1/purchase?${qs}`
      )
      setPurchases(data.items || [])
      setStats(data.stats || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [sanaDan, sanaGacha])

  useEffect(() => { fetchPurchases() }, [fetchPurchases])

  useEffect(() => {
    api<{ items: Supplier[] }>("/api/v1/suppliers?faol_only=true")
      .then(d => setSuppliers(d.items || []))
      .catch(() => {})
  }, [])

  function openAdd() {
    setForm({
      supplier_id: suppliers[0]?.id || 0,
      izoh: "",
      tovarlar: [{ nomi: "", miqdor: 1, narx: 0, birlik: "dona" }],
    })
    setShowAdd(true)
  }

  function addTovarRow() {
    setForm(f => ({ ...f, tovarlar: [...f.tovarlar, { nomi: "", miqdor: 1, narx: 0, birlik: "dona" }] }))
  }

  function updateTovar(i: number, patch: Partial<PurchaseTovar>) {
    setForm(f => ({
      ...f,
      tovarlar: f.tovarlar.map((t, idx) => idx === i ? { ...t, ...patch } : t),
    }))
  }

  function removeTovar(i: number) {
    setForm(f => ({ ...f, tovarlar: f.tovarlar.filter((_, idx) => idx !== i) }))
  }

  const jamiSumma = form.tovarlar.reduce(
    (s, t) => s + (Number(t.miqdor) || 0) * (Number(t.narx) || 0), 0
  )

  async function handleSave() {
    if (!form.supplier_id || form.tovarlar.length === 0) return
    if (form.tovarlar.some(t => !t.nomi.trim())) {
      alert("Barcha tovar qatorlariga nom kiriting")
      return
    }
    setSaving(true)
    try {
      await api("/api/v1/purchase", {
        method: "POST",
        body: JSON.stringify({
          supplier_id: form.supplier_id,
          tovarlar: form.tovarlar.map(t => ({
            nomi:   t.nomi.trim(),
            miqdor: Number(t.miqdor),
            narx:   Number(t.narx),
            birlik: t.birlik || "dona",
          })),
          izoh: form.izoh,
        }),
      })
      setShowAdd(false)
      fetchPurchases()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function openDetail(p: Purchase) {
    try {
      const full = await api<Purchase>(`/api/v1/purchase/${p.id}`)
      setDetail(full)
    } catch {
      setDetail(p)
    }
    setDetailOpen(true)
  }

  async function changeStatus(p: Purchase, newHolat: Purchase["holat"]) {
    try {
      await api(`/api/v1/purchase/${p.id}/holat`, {
        method: "PUT",
        body: JSON.stringify({ holat: newHolat }),
      })
      fetchPurchases()
      setDetailOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-emerald-600" />
              Xarid buyurtmalar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Yetkazib beruvchilardan tovar buyurtma qilish — SalesDoc-style
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Input type="date" value={sanaDan}  onChange={e => setSanaDan(e.target.value)}  className="w-40" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} className="w-40" />
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Yangi
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami buyurtma</div>
            <div className="text-2xl font-bold mt-1">{stats.soni || 0}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami summa</div>
            <div className="text-xl font-bold mt-1 text-emerald-600">
              {formatCurrency(Number(stats.jami || 0))}
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Kutilyapti</div>
            <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.pending || 0}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Yetkazilgan</div>
            <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.yetkazilgan || 0}</div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Yetkazib beruvchi</TableHead>
                <TableHead className="text-center">Tovar</TableHead>
                <TableHead className="text-right">Jami summa</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Xarid buyurtmalar topilmadi
                  </TableCell>
                </TableRow>
              ) : purchases.map(p => {
                const meta = HOLAT_META[p.holat] || HOLAT_META.tayyorlanmoqda
                const Icon = meta.icon
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/50"
                            onClick={() => openDetail(p)}>
                    <TableCell className="font-mono text-xs">#{p.id}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.yaratilgan).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.supplier_nomi || "—"}</div>
                      {p.supplier_telefon && (
                        <div className="text-xs text-muted-foreground">{p.supplier_telefon}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">{p.tovar_soni || 0}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(Number(p.jami_summa))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={meta.bg}>
                        <Icon className="w-3 h-3 mr-1 inline" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Yangi buyurtma dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yangi xarid buyurtma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Yetkazib beruvchi *</Label>
                <select
                  value={form.supplier_id}
                  onChange={e => setForm({ ...form, supplier_id: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="0">— Tanlang —</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.nomi}</option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Yetkazib beruvchi yo&apos;q. Avval{" "}
                    <a href="/suppliers" className="underline">suppliers</a> sahifasida qo&apos;shing.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tovarlar</Label>
                  <Button size="sm" variant="outline" onClick={addTovarRow}>
                    <Plus className="w-3 h-3 mr-1" /> Qator qo&apos;shish
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.tovarlar.map((t, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-5"
                        placeholder="Tovar nomi"
                        value={t.nomi}
                        onChange={e => updateTovar(i, { nomi: e.target.value })}
                      />
                      <Input
                        className="col-span-2"
                        type="number" placeholder="Miqdor"
                        value={t.miqdor}
                        onChange={e => updateTovar(i, { miqdor: Number(e.target.value) })}
                      />
                      <Input
                        className="col-span-2"
                        placeholder="Birlik"
                        value={t.birlik || "dona"}
                        onChange={e => updateTovar(i, { birlik: e.target.value })}
                      />
                      <Input
                        className="col-span-2"
                        type="number" placeholder="Narx"
                        value={t.narx}
                        onChange={e => updateTovar(i, { narx: Number(e.target.value) })}
                      />
                      <Button
                        variant="ghost" size="sm"
                        className="col-span-1 text-red-500"
                        onClick={() => removeTovar(i)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2 font-bold">
                  Jami: {formatCurrency(jamiSumma)}
                </div>
              </div>

              <div>
                <Label>Izoh</Label>
                <Textarea
                  rows={2}
                  value={form.izoh}
                  onChange={e => setForm({ ...form, izoh: e.target.value })}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Bekor
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.supplier_id || form.tovarlar.length === 0}
              >
                {saving ? "Saqlanmoqda..." : "Buyurtma yaratish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Xarid buyurtma #{detail?.id}
              </DialogTitle>
            </DialogHeader>
            {detail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Yetkazib beruvchi</div>
                    <div className="font-medium">{detail.supplier_nomi}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sana</div>
                    <div>{new Date(detail.yaratilgan).toLocaleString("uz-UZ")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Jami summa</div>
                    <div className="font-bold text-emerald-600">
                      {formatCurrency(Number(detail.jami_summa))}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Holat</div>
                    <Badge className={(HOLAT_META[detail.holat] || HOLAT_META.tayyorlanmoqda).bg}>
                      {(HOLAT_META[detail.holat] || HOLAT_META.tayyorlanmoqda).label}
                    </Badge>
                  </div>
                </div>

                {detail.izoh && (
                  <div className="bg-secondary rounded-lg p-3 text-sm">
                    <div className="text-xs text-muted-foreground mb-1">Izoh</div>
                    {detail.izoh}
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold mb-2">Tovarlar</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nomi</TableHead>
                        <TableHead className="text-right">Miqdor</TableHead>
                        <TableHead className="text-right">Narx</TableHead>
                        <TableHead className="text-right">Jami</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(detail.tovarlar) ? detail.tovarlar : []).map((t, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{t.nomi}</TableCell>
                          <TableCell className="text-right font-mono">
                            {t.miqdor} {t.birlik || ""}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(Number(t.narx))}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatCurrency(Number(t.miqdor) * Number(t.narx))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(["yuborildi", "tasdiqlandi", "yetkazildi", "bekor"] as const).map(h => (
                    <Button key={h} size="sm" variant="outline"
                            onClick={() => changeStatus(detail, h)}
                            disabled={detail.holat === h}>
                      → {HOLAT_META[h].label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
