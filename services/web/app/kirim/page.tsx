"use client"
import { useState, useEffect, useCallback } from "react"
import { PageLoading } from "@/components/shared/page-states"
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
  PackagePlus, Plus, Search, Package, AlertCircle, Trash2,
  TrendingUp, Download, Upload,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"
import { kirimService, productService } from "@/lib/api/services"

type KirimRow = {
  id: number; tovar_id?: number; tovar_nomi: string; kategoriya?: string;
  miqdor: number; birlik?: string; narx: number; jami: number;
  manba?: string; izoh?: string; sana: string;
}

const todayISO    = () => new Date().toISOString().split("T")[0]
const monthAgoISO = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function KirimPage() {
  const [items, setItems] = useState<KirimRow[]>([])
  const [stats, setStats] = useState<{ soni?: number; jami_summa?: number; jami_miqdor?: number; turli_tovar?: number }>({})
  const [products, setProducts] = useState<Array<{ id: number; nomi: string; birlik?: string; olish_narxi?: number }>>([])
  const [sanaDan, setSanaDan] = useState(monthAgoISO())
  const [sanaGacha, setSanaGacha] = useState(todayISO())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    tovar_id: "", tovar_nomi: "", kategoriya: "Boshqa", birlik: "dona",
    miqdor: "1", narx: "", manba: "", izoh: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await kirimService.list({
        sana_dan: sanaDan, sana_gacha: sanaGacha,
        qidiruv: search || undefined,
        limit: 200,
      })
      setItems(data.items as unknown as KirimRow[])
      setStats(data.stats || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [sanaDan, sanaGacha, search])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  useEffect(() => {
    productService.list()
      .then(items => setProducts(items.map(p => ({
        id: p.id, nomi: p.nomi || "", birlik: p.birlik,
        olish_narxi: p.olish_narxi,
      }))))
      .catch(() => {})
  }, [])

  function openAdd(existingProduct?: typeof products[0]) {
    setForm({
      tovar_id:   existingProduct ? String(existingProduct.id) : "",
      tovar_nomi: existingProduct?.nomi || "",
      kategoriya: "Boshqa",
      birlik:     existingProduct?.birlik || "dona",
      miqdor:     "1",
      narx:       existingProduct?.olish_narxi ? String(existingProduct.olish_narxi) : "",
      manba:      "",
      izoh:       "",
    })
    setShowAdd(true)
  }

  function selectProduct(id: string) {
    const p = products.find(x => String(x.id) === id)
    if (p) {
      setForm(f => ({
        ...f,
        tovar_id:   String(p.id),
        tovar_nomi: p.nomi,
        birlik:     p.birlik || "dona",
        narx:       p.olish_narxi ? String(p.olish_narxi) : f.narx,
      }))
    } else {
      setForm(f => ({ ...f, tovar_id: id }))
    }
  }

  async function handleSave() {
    if (!form.tovar_nomi.trim() || !form.miqdor || Number(form.miqdor) <= 0) return
    setSaving(true)
    try {
      const miqdor = Number(form.miqdor)
      const narx   = Number(form.narx) || 0
      await kirimService.create({
        tovar_id:   form.tovar_id ? Number(form.tovar_id) : undefined,
        tovar_nomi: form.tovar_nomi.trim(),
        kategoriya: form.kategoriya,
        birlik:     form.birlik,
        miqdor,
        narx,
        jami:       miqdor * narx,
        manba:      form.manba || undefined,
        izoh:       form.izoh || undefined,
      })
      setShowAdd(false)
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Kirimni o'chirib, qoldiqni kamaytirishni tasdiqlaysizmi?")) return
    try {
      await kirimService.remove(id)
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleBulkImport(file: File) {
    try {
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64 = btoa(binary)

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(
        `${base}/api/v1/kirim/import/excel?file_base64=${encodeURIComponent(base64)}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      alert(
        `✓ ${result.saved} ta qator saqlandi` +
        (result.errors?.length ? `\nXatolar: ${result.errors.length}\n${result.errors.slice(0, 3).join("\n")}` : "")
      )
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  async function downloadShablon() {
    try {
      const r = await productService.shablonExcel()
      const bytes = Uint8Array.from(atob(r.content_base64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = r.filename; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={PackagePlus}
          gradient="emerald"
          title="Tovar kirim (Postuplenie)"
          subtitle="Omborga yangi tovar qabul qilish — avtomatik qoldiq yangilanadi"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div></div>
          <div className="flex gap-2 items-center flex-wrap">
            <Input type="date" value={sanaDan}   onChange={e => setSanaDan(e.target.value)}   className="w-40" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} className="w-40" />
            <Button variant="outline" size="sm" onClick={downloadShablon}>
              <Download className="w-4 h-4 mr-1" /> Shablon
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = ".xlsx,.xls"
              input.onchange = e => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f) handleBulkImport(f)
              }
              input.click()
            }}>
              <Upload className="w-4 h-4 mr-1" /> Bulk import
            </Button>
            <Button onClick={() => openAdd()}>
              <Plus className="w-4 h-4 mr-1" /> Yangi kirim
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Kirim soni</div>
            <div className="text-2xl font-bold mt-1">{stats.soni || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Turli tovar</div>
            <div className="text-2xl font-bold mt-1">{stats.turli_tovar || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Jami miqdor</div>
            <div className="text-2xl font-bold mt-1">{Number(stats.jami_miqdor || 0).toLocaleString()}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Jami summa</div>
            <div className="text-xl font-bold mt-1 text-emerald-600">
              {formatCurrency(Number(stats.jami_summa || 0))}
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tovar yoki manba bo'yicha..."
                 value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Tovar</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
                <TableHead className="text-right">Narx</TableHead>
                <TableHead className="text-right">Jami</TableHead>
                <TableHead>Manba</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Kirimlar topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map((r, i) => (
                <TableRow key={r.id} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(r.sana).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell className="font-medium">{r.tovar_nomi}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.kategoriya || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(r.miqdor).toFixed(0)} {r.birlik || ""}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(Number(r.narx))}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600">
                    {formatCurrency(Number(r.jami))}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.manba || "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 dark:text-rose-400"
                            onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Info box */}
        <div className="bg-blue-500/10 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300">
          <div className="font-bold mb-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Avtomatik qoldiq yangilanadi
          </div>
          <div>
            Har bir kirimni saqlaganingizda tizim tovar qoldig&apos;ini avtomatik oshiradi va
            olish narxini yangilaydi. Kirimni o&apos;chirsangiz, qoldiq kamayadi.
          </div>
        </div>

        {/* Add dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi kirim</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tovar (mavjud) yoki yangi</Label>
                <select
                  value={form.tovar_id}
                  onChange={e => selectProduct(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="">— Yangi tovar —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nomi}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tovar nomi *</Label>
                <Input value={form.tovar_nomi}
                       onChange={e => setForm({ ...form, tovar_nomi: e.target.value, tovar_id: "" })}
                       placeholder="Ariel 3kg" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Miqdor *</Label>
                  <Input type="number" value={form.miqdor}
                         onChange={e => setForm({ ...form, miqdor: e.target.value })} />
                </div>
                <div>
                  <Label>Birlik</Label>
                  <Input value={form.birlik}
                         onChange={e => setForm({ ...form, birlik: e.target.value })} />
                </div>
                <div>
                  <Label>Kategoriya</Label>
                  <Input value={form.kategoriya}
                         onChange={e => setForm({ ...form, kategoriya: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Olish narxi (dona uchun)</Label>
                <Input type="number" value={form.narx}
                       onChange={e => setForm({ ...form, narx: e.target.value })}
                       placeholder="0" />
                {Number(form.miqdor) > 0 && Number(form.narx) > 0 && (
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    Jami: <span className="font-bold text-emerald-600">
                      {formatCurrency(Number(form.miqdor) * Number(form.narx))}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Label>Manba (postavshik)</Label>
                <Input value={form.manba}
                       onChange={e => setForm({ ...form, manba: e.target.value })}
                       placeholder="Masalan: P&G Uzbekistan" />
              </div>
              <div>
                <Label>Izoh</Label>
                <Textarea rows={2} value={form.izoh}
                          onChange={e => setForm({ ...form, izoh: e.target.value })}
                          placeholder="Qo'shimcha ma'lumot..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button onClick={handleSave} disabled={saving || !form.tovar_nomi.trim()}>
                {saving ? "Saqlanmoqda..." : "Kirimni saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
