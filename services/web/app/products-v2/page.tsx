"use client"

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, Grid3X3, List, Filter, Package, AlertTriangle,
  TrendingDown, BarChart3, Download,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"

type ViewMode = "grid" | "list"
type StockStatus = "all" | "ok" | "low" | "out"

export default function ProductsV2Page() {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [stockFilter, setStockFilter] = useState<StockStatus>("all")
  const [selectedKat, setSelectedKat] = useState<string>("all")

  // API — tovarlar v2 endpoint
  const { data: rawProducts, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    const res = await fetch(`${base}/api/tovarlar/v2/filtr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sahifa: 1, sahifa_hajmi: 200, qidiruv: search }),
    })
    return res.ok ? res.json() : { tovarlar: [] }
  }, [search])

  const products = rawProducts?.tovarlar || []

  // Kategoriyalar
  const kategoriyalar = useMemo(() => {
    const set = new Set(products.map((p: any) => p.kategoriya).filter(Boolean))
    return ["all", ...Array.from(set)] as string[]
  }, [products])

  // Filtrlash
  const filtered = useMemo(() => {
    let list = products
    if (selectedKat !== "all") list = list.filter((p: any) => p.kategoriya === selectedKat)
    if (stockFilter === "low") list = list.filter((p: any) => p.qoldiq > 0 && p.qoldiq <= 5)
    if (stockFilter === "out") list = list.filter((p: any) => p.qoldiq <= 0)
    if (stockFilter === "ok") list = list.filter((p: any) => p.qoldiq > 5)
    return list
  }, [products, selectedKat, stockFilter])

  const stats = {
    jami: products.length,
    kamQoldiq: products.filter((p: any) => p.qoldiq > 0 && p.qoldiq <= 5).length,
    tugagan: products.filter((p: any) => p.qoldiq <= 0).length,
  }

  const stockColor = (q: number) =>
    q <= 0 ? "text-rose-600 dark:text-rose-400 bg-rose-500/10" : q <= 5 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"

  const stockBadge = (q: number) =>
    q <= 0 ? "🔴 Tugagan" : q <= 5 ? "🟡 Kam" : "🟢 Bor"

  return (
    <AdminLayout title="Tovarlar">
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-card dark:bg-card rounded-lg border text-sm whitespace-nowrap">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{stats.jami}</span>
            <span className="text-muted-foreground">jami</span>
          </div>
          {stats.kamQoldiq > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 text-sm whitespace-nowrap">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-amber-700">{stats.kamQoldiq}</span>
              <span className="text-amber-600">kam</span>
            </div>
          )}
          {stats.tugagan > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 dark:bg-rose-950/10 rounded-lg border border-rose-500/30 text-sm whitespace-nowrap">
              <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span className="font-medium text-rose-700 dark:text-rose-300">{stats.tugagan}</span>
              <span className="text-rose-600 dark:text-rose-400">tugagan</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tovar qidirish..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9" />
          </div>

          <div className="flex gap-1 bg-muted dark:bg-muted p-0.5 rounded-lg">
            {[
              { val: "all", label: "Barchasi" },
              { val: "ok", label: "🟢 Bor" },
              { val: "low", label: "🟡 Kam" },
              { val: "out", label: "🔴 Tugagan" },
            ].map(s => (
              <button key={s.val} onClick={() => setStockFilter(s.val as StockStatus)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  stockFilter === s.val ? "bg-card dark:bg-muted shadow-sm" : "text-muted-foreground"
                }`}>{s.label}</button>
            ))}
          </div>

          <div className="flex gap-1 bg-muted dark:bg-muted p-0.5 rounded-lg">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-card dark:bg-muted shadow-sm" : "text-muted-foreground"}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-card dark:bg-muted shadow-sm" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category filter */}
        {kategoriyalar.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {kategoriyalar.map(k => (
              <button key={k} onClick={() => setSelectedKat(k)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedKat === k ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-muted text-muted-foreground"
                }`}>{k === "all" ? "Barchasi" : k}</button>
            ))}
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p: any) => (
              <div key={p.id} className="bg-card dark:bg-card rounded-xl border border-border dark:border-border overflow-hidden hover:shadow-md transition-shadow">
                {/* Photo placeholder */}
                <div className="h-24 bg-gradient-to-br from-muted to-muted/50 dark:from-muted dark:to-card flex items-center justify-center">
                  {p.foto_url
                    ? <img src={p.foto_url} alt="" className="h-full w-full object-cover" />
                    : <Package className="w-8 h-8 text-muted-foreground/50" />
                  }
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium truncate">{p.nomi}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.kategoriya || "—"}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(p.sotuv_narx || 0)}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${stockColor(p.qoldiq)}`}>
                      {p.qoldiq} {p.birlik || ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-card dark:bg-card rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 dark:bg-muted text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Tovar</th>
                  <th className="px-4 py-3">Kategoriya</th>
                  <th className="px-4 py-3 text-right">Narx</th>
                  <th className="px-4 py-3 text-right">Qoldiq</th>
                  <th className="px-4 py-3">Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-border/60 dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50">
                    <td className="px-4 py-2.5 font-medium">{p.nomi}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.kategoriya || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-emerald-600">{formatCurrency(p.sotuv_narx || 0)}</td>
                    <td className="px-4 py-2.5 text-right">{p.qoldiq}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stockColor(p.qoldiq)}`}>
                        {stockBadge(p.qoldiq)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <div className="text-sm">Tovar topilmadi</div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
