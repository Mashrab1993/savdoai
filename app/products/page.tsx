"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, Package, AlertTriangle, XCircle } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { formatCurrency } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { productService } from "@/lib/api/services"
import { normalizeProduct, type ProductVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"

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
          <Button disabled className="gap-2 shrink-0" title={locale === "uz" ? "Tez orada" : "Скоро"}>
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled title={locale === "uz" ? "Tez orada" : "Скоро"}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled title={locale === "uz" ? "Tez orada" : "Скоро"}>
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
    </AdminLayout>
  )
}
