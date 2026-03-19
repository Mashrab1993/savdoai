"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { products as initialProducts, type Product } from "@/lib/mock-data"
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
import { Search, Plus, Pencil, Trash2, Package, AlertTriangle, XCircle } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"

const categories = ["Barchasi", "Kiyim", "Poyabzal", "Aksessuarlar", "Bolalar"]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n} so'm`
}

function getStockStatus(p: Product): Product["status"] {
  if (p.stock === 0) return "out-of-stock"
  if (p.stock <= p.lowStockThreshold) return "low-stock"
  return "in-stock"
}

export default function ProductsPage() {
  const { locale } = useLocale()
  const L = translations.products
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<Partial<Product>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "Barchasi" || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  function openAdd() {
    setEditingProduct(null)
    setForm({ category: "Dasturiy ta'minot", lowStockThreshold: 10 })
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditingProduct(p)
    setForm({ ...p })
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name?.trim()) e.name = "Nomi kiritish shart"
    if (!form.sku?.trim()) e.sku = "SKU kiritish shart"
    if (!form.price || form.price <= 0) e.price = "To'g'ri narx kiritish shart"
    if (form.stock === undefined || form.stock < 0) e.stock = "Ombor 0 yoki undan ko'p bo'lishi kerak"
    return e
  }

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const base = { ...form } as Product
    base.status = getStockStatus(base)
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...base } : p))
    } else {
      setProducts(prev => [{ ...base, id: `p${Date.now()}` }, ...prev])
    }
    setModalOpen(false)
  }

  const inStock = products.filter(p => p.status === "in-stock").length
  const lowStock = products.filter(p => p.status === "low-stock").length
  const outOfStock = products.filter(p => p.status === "out-of-stock").length

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
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
            <div className="flex gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> {L.addProduct[locale]}
          </Button>
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
                    Mahsulot topilmadi.
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
                    <TableCell><StatusBadge status={getStockStatus(product)} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(product)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))}>
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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 grid-cols-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Mahsulot nomi</Label>
              <Input placeholder="Analytics Pro Litsenziyasi" value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input placeholder="APL-001" value={form.sku || ""} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className={errors.sku ? "border-destructive" : ""} />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Kategoriya</Label>
              <Select value={form.category || "Dasturiy ta'minot"} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Dasturiy ta'minot", "Bulut", "Xizmatlar", "Marketing"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Narx ($)</Label>
              <Input type="number" placeholder="299" value={form.price || ""} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className={errors.price ? "border-destructive" : ""} />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Ombor</Label>
              <Input type="number" placeholder="100" value={form.stock ?? ""} onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} className={errors.stock ? "border-destructive" : ""} />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Kam ombor chegarasi</Label>
              <Input type="number" placeholder="10" value={form.lowStockThreshold ?? ""} onChange={e => setForm(p => ({ ...p, lowStockThreshold: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Tavsif</Label>
              <Input placeholder="Qisqacha tavsif..." value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{translations.actions.cancel[locale]}</Button>
            <Button onClick={handleSave}>{editingProduct ? "O'zgarishlarni saqlash" : "Mahsulot qo'shish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
