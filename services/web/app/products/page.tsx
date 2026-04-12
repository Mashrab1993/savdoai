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
import ProductStockGrid, { type ProductCardData } from "@/components/dashboard/product-stock-grid"
import { PageHeader } from "@/components/ui/page-header"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

// Dinamik kategoriyalar — SalesDoc uslubida
const CATEGORIES: { uz: string; ru: string; key: string }[] = [
  { key: "all",                uz: "Barchasi",           ru: "Все" },
  { key: "Kosmetika",         uz: "Kosmetika",          ru: "Косметика" },
  { key: "Parfyumeriya",      uz: "Parfyumeriya",       ru: "Парфюмерия" },
  { key: "Maishiy kimyo",     uz: "Maishiy kimyo",      ru: "Бытовая химия" },
  { key: "Oziq-ovqat",        uz: "Oziq-ovqat",         ru: "Продукты питания" },
  { key: "Gigiyena",          uz: "Gigiyena",            ru: "Гигиена" },
  { key: "Shaxsiy parvarish", uz: "Shaxsiy parvarish",  ru: "Личная гигиена" },
  { key: "Shirinlik",         uz: "Shirinlik",           ru: "Сладости" },
  { key: "Boshqa",            uz: "Boshqa",              ru: "Другое" },
]

type ActiveFilter = "all" | "active" | "inactive"

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
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const emptyForm = {
    // Asosiy
    nomi: "", kategoriya: "Boshqa", birlik: "dona",
    olish_narxi: "", sotish_narxi: "", min_sotish_narxi: "",
    qoldiq: "", min_qoldiq: "",
    // Identifikatsiya
    brend: "", podkategoriya: "", guruh: "",
    ishlab_chiqaruvchi: "", segment: "", savdo_yonalishi: "",
    shtrix_kod: "", artikul: "", sap_kod: "", kod: "",
    ikpu_kod: "", gtin: "",
    // O'lchamlar
    hajm: "", ogirlik: "",
    blokda_soni: "", korobkada_soni: "",
    saralash: "", yaroqlilik_muddati: "",
    // Tavsif
    tavsif: "",
  }
  const [form, setForm] = useState(emptyForm)
  const [tarixOpen, setTarixOpen] = useState(false)
  const [tarixData, setTarixData] = useState<{
    tovar: { nomi?: string; kategoriya?: string; birlik?: string; qoldiq?: number; sotish_narxi?: number; olish_narxi?: number; [k: string]: unknown }
    sotuvlar: Array<{ klient_ismi?: string; sana?: string; miqdor?: number; jami?: number }>
    kirimlar: Array<Record<string, unknown>>
    statistika?: { sotuv_soni: number; jami_sotilgan: number; jami_tushum: number }
  } | null>(null)
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
      const num = (v: string) => (v.trim() === "" ? undefined : Number(v))
      const str = (v: string) => (v.trim() === "" ? undefined : v.trim())
      const payload: Record<string, unknown> = {
        nomi:             form.nomi.trim(),
        kategoriya:       form.kategoriya || "Boshqa",
        birlik:           form.birlik    || "dona",
        olish_narxi:      Number(form.olish_narxi) || 0,
        sotish_narxi:     Number(form.sotish_narxi) || 0,
        min_sotish_narxi: Number(form.min_sotish_narxi) || 0,
        qoldiq:           Number(form.qoldiq) || 0,
        min_qoldiq:       Number(form.min_qoldiq) || 0,
        brend:              str(form.brend),
        podkategoriya:      str(form.podkategoriya),
        guruh:              str(form.guruh),
        ishlab_chiqaruvchi: str(form.ishlab_chiqaruvchi),
        segment:            str(form.segment),
        savdo_yonalishi:    str(form.savdo_yonalishi),
        shtrix_kod:         str(form.shtrix_kod),
        artikul:            str(form.artikul),
        sap_kod:            str(form.sap_kod),
        kod:                str(form.kod),
        ikpu_kod:           str(form.ikpu_kod),
        gtin:               str(form.gtin),
        hajm:               num(form.hajm),
        ogirlik:            num(form.ogirlik),
        blokda_soni:        num(form.blokda_soni),
        korobkada_soni:     num(form.korobkada_soni),
        saralash:           num(form.saralash),
        yaroqlilik_muddati: num(form.yaroqlilik_muddati),
        tavsif:             str(form.tavsif),
      }
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
      await productService.create(payload as Parameters<typeof productService.create>[0])
      setAddModalOpen(false)
      setForm(emptyForm)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
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
      const fname = file.name.toLowerCase()

      // Excel (.xlsx) — upload as base64 to new backend endpoint
      if (fname.endsWith(".xlsx") || fname.endsWith(".xls")) {
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        // base64 encode
        let binary = ""
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)

        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
        const res = await fetch(`${baseUrl}/api/v1/tovar/import/excel?file_base64=${encodeURIComponent(base64)}`, {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const result = await res.json()
        alert(locale === "uz"
          ? `${result.jami} ta tovar: ${result.yaratildi} yaratildi, ${result.yangilandi} yangilandi${
              result.xatolar?.length ? `\nXatolar: ${result.xatolar.length}` : ""}`
          : `${result.jami} товаров: ${result.yaratildi} создано, ${result.yangilandi} обновлено`)
        refetch()
        return
      }

      // CSV fallback
      const text = await file.text()
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
        <PageHeader
          icon={Package}
          gradient="amber"
          title={L.title[locale]}
          subtitle={locale === "uz" ? `${products.length} ta tovar` : `${products.length} товаров`}
          action={
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> {locale === "uz" ? "Yangi tovar" : "Новый товар"}
            </Button>
          }
        />
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: L.inStock[locale], value: inStock, icon: Package, color: "text-emerald-500" },
            { label: L.lowStock[locale], value: lowStock, icon: AlertTriangle, color: "text-amber-500" },
            { label: L.outOfStock[locale], value: outOfStock, icon: XCircle, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
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
                input.accept = ".csv,.tsv,.txt,.xlsx,.xls"
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
                  const r = await productService.shablonExcel()
                  const bytes = Uint8Array.from(atob(r.content_base64), c => c.charCodeAt(0))
                  const blob  = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
                  const url   = URL.createObjectURL(blob)
                  const a     = document.createElement("a")
                  a.href      = url
                  a.download  = r.filename || "shablon.xlsx"
                  a.click()
                  URL.revokeObjectURL(url)
                } catch { /* silent */ }
              }}
              title={locale === "uz" ? "Import uchun shablon yuklab olish" : "Скачать шаблон для импорта"}
            >
              <Download className="w-4 h-4" />
              {locale === "uz" ? "Shablon" : "Шаблон"}
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

        {/* Premium product stock grid (v0.dev → GPT-5 pipeline) */}
        <ProductStockGrid
          products={filtered.map<ProductCardData>(p => ({
            id:           Number(p.id),
            nomi:         p.name,
            brend:        p.description || undefined,
            kategoriya:   p.category || undefined,
            birlik:       p.unit || "dona",
            sotish_narxi: p.price || 0,
            olish_narxi:  0,
            qoldiq:       p.stock || 0,
            min_qoldiq:   p.lowStockThreshold || 0,
            rasm_url:     undefined,
            faol:         p.status !== "out-of-stock",
            shtrix_kod:   p.sku || undefined,
          }))}
          onProductClick={id => openTarix(id)}
        />
        </>}
      </div>

      {/* Tovar qo'shish modal — SalesDoc style 4 tab */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{locale === "uz" ? "Yangi tovar qo'shish" : "Добавить товар"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="asosiy" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="asosiy">{locale === "uz" ? "Asosiy" : "Основное"}</TabsTrigger>
              <TabsTrigger value="ident">{locale === "uz" ? "Identifikatsiya" : "Идентификация"}</TabsTrigger>
              <TabsTrigger value="olchov">{locale === "uz" ? "O'lchamlar" : "Размеры"}</TabsTrigger>
              <TabsTrigger value="tavsif">{locale === "uz" ? "Tavsif" : "Описание"}</TabsTrigger>
            </TabsList>

            <TabsContent value="asosiy" className="space-y-3 pt-3">
              <div>
                <Label>{locale === "uz" ? "Tovar nomi *" : "Название *"}</Label>
                <Input value={form.nomi} onChange={e => setForm(f => ({ ...f, nomi: e.target.value }))}
                       placeholder="Ariel 3kg" />
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Olish narxi" : "Закупка"}</Label>
                  <Input type="number" value={form.olish_narxi} onChange={e => setForm(f => ({ ...f, olish_narxi: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Sotish narxi" : "Продажа"}</Label>
                  <Input type="number" value={form.sotish_narxi} onChange={e => setForm(f => ({ ...f, sotish_narxi: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Min sotish" : "Мин продажа"}</Label>
                  <Input type="number" value={form.min_sotish_narxi} onChange={e => setForm(f => ({ ...f, min_sotish_narxi: e.target.value }))} placeholder="0" />
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
            </TabsContent>

            <TabsContent value="ident" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Brend" : "Бренд"}</Label>
                  <Input value={form.brend} onChange={e => setForm(f => ({ ...f, brend: e.target.value }))} placeholder="Procter & Gamble" />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Ishlab chiqaruvchi" : "Производитель"}</Label>
                  <Input value={form.ishlab_chiqaruvchi} onChange={e => setForm(f => ({ ...f, ishlab_chiqaruvchi: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Podkategoriya" : "Подкатегория"}</Label>
                  <Input value={form.podkategoriya} onChange={e => setForm(f => ({ ...f, podkategoriya: e.target.value }))} />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Guruh" : "Группа"}</Label>
                  <Input value={form.guruh} onChange={e => setForm(f => ({ ...f, guruh: e.target.value }))} />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Segment" : "Сегмент"}</Label>
                  <Input value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} placeholder="Premium / Economy" />
                </div>
              </div>
              <div>
                <Label>{locale === "uz" ? "Savdo yo'nalishi" : "Направление продаж"}</Label>
                <Input value={form.savdo_yonalishi} onChange={e => setForm(f => ({ ...f, savdo_yonalishi: e.target.value }))} placeholder="B2B / B2C / HoReCa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Shtrix kod (EAN-13)" : "Штрих-код"}</Label>
                  <Input value={form.shtrix_kod} onChange={e => setForm(f => ({ ...f, shtrix_kod: e.target.value }))} placeholder="4810056670015" />
                </div>
                <div>
                  <Label>GTIN</Label>
                  <Input value={form.gtin} onChange={e => setForm(f => ({ ...f, gtin: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Artikul" : "Артикул"}</Label>
                  <Input value={form.artikul} onChange={e => setForm(f => ({ ...f, artikul: e.target.value }))} />
                </div>
                <div>
                  <Label>{locale === "uz" ? "SAP kod" : "SAP код"}</Label>
                  <Input value={form.sap_kod} onChange={e => setForm(f => ({ ...f, sap_kod: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Ichki kod" : "Внутр. код"}</Label>
                  <Input value={form.kod} onChange={e => setForm(f => ({ ...f, kod: e.target.value }))} />
                </div>
                <div>
                  <Label>IKPU kod</Label>
                  <Input value={form.ikpu_kod} onChange={e => setForm(f => ({ ...f, ikpu_kod: e.target.value }))} placeholder="05031000001" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="olchov" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Hajm (litr/m³)" : "Объём (л/м³)"}</Label>
                  <Input type="number" step="0.001" value={form.hajm} onChange={e => setForm(f => ({ ...f, hajm: e.target.value }))} />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Og'irlik (kg)" : "Вес (кг)"}</Label>
                  <Input type="number" step="0.001" value={form.ogirlik} onChange={e => setForm(f => ({ ...f, ogirlik: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Blokda soni" : "В блоке шт"}</Label>
                  <Input type="number" value={form.blokda_soni} onChange={e => setForm(f => ({ ...f, blokda_soni: e.target.value }))} placeholder="1" />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Korobkada soni" : "В коробке шт"}</Label>
                  <Input type="number" value={form.korobkada_soni} onChange={e => setForm(f => ({ ...f, korobkada_soni: e.target.value }))} placeholder="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{locale === "uz" ? "Saralash tartibi" : "Порядок сортировки"}</Label>
                  <Input type="number" value={form.saralash} onChange={e => setForm(f => ({ ...f, saralash: e.target.value }))} placeholder="500" />
                </div>
                <div>
                  <Label>{locale === "uz" ? "Yaroqlilik muddati (kun)" : "Срок годности (дней)"}</Label>
                  <Input type="number" value={form.yaroqlilik_muddati} onChange={e => setForm(f => ({ ...f, yaroqlilik_muddati: e.target.value }))} placeholder="0" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tavsif" className="space-y-3 pt-3">
              <div>
                <Label>{locale === "uz" ? "Tavsif / Izoh" : "Описание"}</Label>
                <Textarea rows={6} value={form.tavsif} onChange={e => setForm(f => ({ ...f, tavsif: e.target.value }))}
                          placeholder={locale === "uz" ? "Tovar haqida qo'shimcha ma'lumot..." : "Дополнительная информация..."} />
              </div>
            </TabsContent>
          </Tabs>
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
              <div className="bg-secondary rounded-2xl p-4 space-y-2 text-sm">
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
                  <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg p-2">
                    <p className="text-lg font-bold">{tarixData.statistika.sotuv_soni}</p>
                    <p className="text-[10px] text-muted-foreground">{locale === "uz" ? "Sotuv" : "Продаж"}</p>
                  </div>
                  <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg p-2">
                    <p className="text-lg font-bold">{Number(tarixData.statistika.jami_sotilgan).toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">{locale === "uz" ? "Sotilgan" : "Продано"}</p>
                  </div>
                  <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg p-2">
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
                    {tarixData.sotuvlar.map((s, i) => (
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
