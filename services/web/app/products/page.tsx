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
import { Search, Plus, Pencil, Trash2, Package, AlertTriangle, XCircle, Download, Upload, Eye } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { formatCurrency } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { productService, tovarImportService, tovarTarixService } from "@/lib/api/services"
import { normalizeProduct, type ProductVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"

const CATEGORIES: { uz: string; ru: string; key: string }[] = [
  { key: "all",          uz: "Barchasi",     ru: "Все" },
  { key: "Kiyim",        uz: "Kiyim",        ru: "Одежда" },
  { key: "Poyabzal",     uz: "Poyabzal",     ru: "Обувь" },
  { key: "Aksessuarlar", uz: "Aksessuarlar", ru: "Аксессуары" },
  { key: "Bolalar",      uz: "Bolalar",      ru: "Детские" },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n} so'm`
}

export default function ProductsPage() {
  const { locale } = useLocale()
  const L = translations.products

  const { data: rawProducts, loading, error, refetch } = useApi(productService.list)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nomi: "", kategoriya: "Boshqa", birlik: "dona", olish_narxi: "", sotish_narxi: "", qoldiq: "", min_qoldiq: "" })
  const [tarixOpen, setTarixOpen] = useState(false)
  const [tarixData, setTarixData] = useState<any>(null)
  const [tarixLoading, setTarixLoading] = useState(false)

  const products: ProductVM[] = (rawProducts ?? []).map(normalizeProduct)

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const inStock = products.filter(p => p.status === "in-stock").length
  const lowStock = products.filter(p => p.status === "low-stock").length
  const outOfStock = products.filter(p => p.status === "out-of-stock").length

  async function handleAddProduct() {
    if (!form.nomi.trim()) return
    setSaving(true)
    try {
      await productService.create({
        nomi: form.nomi.trim(),
        kategoriya: form.kategoriya,
        birlik: form.birlik,
        olish_narxi: Number(form.olish_narxi) || 0,
        sotish_narxi: Number(form.sotish_narxi) || 0,
        qoldiq: Number(form.qoldiq) || 0,
        min_qoldiq: Number(form.min_qoldiq) || 0,
      })
      setAddModalOpen(false)
      setForm({ nomi: "", kategoriya: "Boshqa", birlik: "dona", olish_narxi: "", sotish_narxi: "", qoldiq: "", min_qoldiq: "" })
      refetch()
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  async function openTarix(productId: number) {
    setTarixOpen(true)
    setTarixLoading(true)
    try {
      const data = await tovarTarixService.get(productId, 20)
      setTarixData(data)
    } catch { setTarixData(null) }
    finally { setTarixLoading(false) }
  }

  async function handleImportExcel(file: File) {
    try {
      const text = await file.text()
      // CSV parse (oddiy Excel → CSV export qilingan fayl)
      const lines = text.split("\n").filter(l => l.trim())
      if (lines.length < 2) { alert(locale === "uz" ? "Fayl bo'sh" : "Файл пуст"); return }
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase())
      const nomiIdx = headers.findIndex(h => h.includes("nom") || h.includes("name") || h.includes("tovar"))
      if (nomiIdx < 0) { alert(locale === "uz" ? "'nomi' ustuni topilmadi" : "Столбец 'nomi' не найден"); return }

      const tovarlar = lines.slice(1).map(line => {
        const cols = line.split(/[,;\t]/).map(c => c.trim())
        return {
          nomi: cols[nomiIdx] || "",
          kategoriya: cols[headers.findIndex(h => h.includes("kategor"))] || "Boshqa",
          birlik: cols[headers.findIndex(h => h.includes("birlik") || h.includes("unit"))] || "dona",
          olish_narxi: Number(cols[headers.findIndex(h => h.includes("olish"))]) || 0,
          sotish_narxi: Number(cols[headers.findIndex(h => h.includes("sotish") || h.includes("narx") || h.includes("price"))]) || 0,
          qoldiq: Number(cols[headers.findIndex(h => h.includes("qoldiq") || h.includes("stock"))]) || 0,
        }
      }).filter(t => t.nomi)

      if (!tovarlar.length) { alert(locale === "uz" ? "Tovar topilmadi" : "Товары не найдены"); return }

      const result = await tovarImportService.importBatch(tovarlar)
      alert(locale === "uz"
        ? `${result.jami} ta tovar: ${result.yaratildi} yaratildi, ${result.yangilandi} yangilandi`
        : `${result.jami} товаров: ${result.yaratildi} создано, ${result.yangilandi} обновлено`)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && <>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: L.inStock[locale], value: inStock, icon: Package, color: "text-green-500" },
            { label: L.lowStock[locale], value: lowStock, icon: AlertTriangle, color: "text-yellow-500" },
            { label: L.outOfStock[locale], value: outOfStock, icon: XCircle, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={`p-2 rounded-lg bg-secondary ${s.color} shrink-0`}><s.icon className="w-4 h-4" /></div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-xl font-bold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={L.searchPlaceholder[locale]} className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === cat.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent/50"
                  }`}
                >
                  {cat[locale]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              {locale === "uz" ? "Qo'shish" : "Добавить"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = ".csv,.tsv,.txt"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleImportExcel(file)
                }
                input.click()
              }}
            >
              <Upload className="w-4 h-4" />
              {locale === "uz" ? "Import" : "Импорт"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  const result = await productService.exportExcel()
                  const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
                  const blob = new Blob([bytes], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = result.filename || "tovarlar.xlsx"
                  a.click()
                  URL.revokeObjectURL(url)
                } catch { /* silent */ }
              }}
            >
              <Download className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.product[locale]}</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>{translations.fields.category[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.price[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.stock[locale]}</TableHead>
                <TableHead>{translations.fields.status[locale]}</TableHead>
                <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {L.noProducts[locale]}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(product => (
                  <TableRow key={product.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{product.category}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">{fmt(product.price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${product.stock === 0 ? "text-destructive" : product.stock <= product.lowStockThreshold ? "text-yellow-500" : "text-foreground"}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={product.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          title={locale === "uz" ? "Tarix" : "История"}
                          onClick={() => openTarix(Number(product.id))}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={async () => {
                            const newPrice = prompt(locale === "uz" ? "Yangi sotish narxi:" : "Новая цена продажи:", String(product.price))
                            if (!newPrice) return
                            try {
                              await productService.update(Number(product.id), { sotish_narxi: Number(newPrice) })
                              refetch()
                            } catch { /* silent */ }
                          }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm(locale === "uz"
                              ? `"${product.name}" ni o'chirishni tasdiqlaysizmi?`
                              : `Удалить "${product.name}"?`)) return
                            try {
                              await productService.remove(Number(product.id))
                              refetch()
                            } catch (err) {
                              alert(err instanceof Error ? err.message : String(err))
                            }
                          }}>
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

      {/* Tovar qo'shish modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{locale === "uz" ? "Yangi tovar qo'shish" : "Добавить товар"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div>
              <Label>{locale === "uz" ? "Tovar nomi *" : "Название *"}</Label>
              <Input value={form.nomi} onChange={e => setForm(f => ({ ...f, nomi: e.target.value }))}
                     placeholder={locale === "uz" ? "Ariel 3kg" : "Ariel 3kg"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{locale === "uz" ? "Kategoriya" : "Категория"}</Label>
                <Input value={form.kategoriya} onChange={e => setForm(f => ({ ...f, kategoriya: e.target.value }))} />
              </div>
              <div>
                <Label>{locale === "uz" ? "Birlik" : "Единица"}</Label>
                <Input value={form.birlik} onChange={e => setForm(f => ({ ...f, birlik: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{locale === "uz" ? "Olish narxi" : "Цена закупки"}</Label>
                <Input type="number" value={form.olish_narxi} onChange={e => setForm(f => ({ ...f, olish_narxi: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>{locale === "uz" ? "Sotish narxi" : "Цена продажи"}</Label>
                <Input type="number" value={form.sotish_narxi} onChange={e => setForm(f => ({ ...f, sotish_narxi: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{locale === "uz" ? "Qoldiq" : "Остаток"}</Label>
                <Input type="number" value={form.qoldiq} onChange={e => setForm(f => ({ ...f, qoldiq: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>{locale === "uz" ? "Min qoldiq" : "Мин остаток"}</Label>
                <Input type="number" value={form.min_qoldiq} onChange={e => setForm(f => ({ ...f, min_qoldiq: e.target.value }))} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              {locale === "uz" ? "Bekor" : "Отмена"}
            </Button>
            <Button onClick={handleAddProduct} disabled={saving || !form.nomi.trim()}>
              {saving ? (locale === "uz" ? "Saqlanmoqda..." : "Сохранение...") : (locale === "uz" ? "Saqlash" : "Сохранить")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tovar tarix drawer */}
      <Sheet open={tarixOpen} onOpenChange={setTarixOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {locale === "uz" ? "Tovar tarixi" : "История товара"}
              {tarixData?.tovar?.nomi && ` — ${tarixData.tovar.nomi}`}
            </SheetTitle>
          </SheetHeader>
          {tarixLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}
            </div>
          ) : tarixData ? (
            <div className="mt-4 space-y-5">
              <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
                {[
                  { l: locale === "uz" ? "Kategoriya" : "Категория", v: tarixData.tovar?.kategoriya },
                  { l: locale === "uz" ? "Olish narxi" : "Закупочная", v: `${Number(tarixData.tovar?.olish_narxi ?? 0).toLocaleString()} so'm` },
                  { l: locale === "uz" ? "Sotish narxi" : "Продажная", v: `${Number(tarixData.tovar?.sotish_narxi ?? 0).toLocaleString()} so'm` },
                  { l: locale === "uz" ? "Qoldiq" : "Остаток", v: tarixData.tovar?.qoldiq },
                ].map(r => (
                  <div key={r.l} className="flex justify-between">
                    <span className="text-muted-foreground">{r.l}</span>
                    <span className="font-medium">{r.v}</span>
                  </div>
                ))}
              </div>
              {tarixData.statistika && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-card border rounded-lg p-2">
                    <p className="text-lg font-bold">{tarixData.statistika.sotuv_soni}</p>
                    <p className="text-[10px] text-muted-foreground">{locale === "uz" ? "Sotuv" : "Продаж"}</p>
                  </div>
                  <div className="bg-card border rounded-lg p-2">
                    <p className="text-lg font-bold">{Number(tarixData.statistika.jami_sotilgan).toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">{locale === "uz" ? "Sotilgan" : "Продано"}</p>
                  </div>
                  <div className="bg-card border rounded-lg p-2">
                    <p className="text-lg font-bold">{fmt(tarixData.statistika.jami_tushum)}</p>
                    <p className="text-[10px] text-muted-foreground">{locale === "uz" ? "Tushum" : "Выручка"}</p>
                  </div>
                </div>
              )}
              {tarixData.sotuvlar?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {locale === "uz" ? "Oxirgi sotuvlar" : "Последние продажи"}
                  </p>
                  <div className="space-y-1.5">
                    {tarixData.sotuvlar.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-card border rounded-lg px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{s.klient_ismi || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.sana ? new Date(s.sana).toLocaleDateString("uz-UZ") : "—"} · {s.miqdor} {tarixData.tovar?.birlik}
                          </p>
                        </div>
                        <span className="font-semibold">{fmt(s.jami ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
