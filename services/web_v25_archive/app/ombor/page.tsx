"use client"

import { useState, useMemo } from "react"
import { PageLoading } from "@/components/shared/page-states"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Package, Search, AlertTriangle, TrendingDown, TrendingUp,
  Download, BarChart3, Warehouse, ArrowUpDown,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"
import { omborService } from "@/lib/api/services"

type SortField = "nomi" | "zaxira" | "sotilgan" | "kunlik_sotuv" | "kunlarga_yetadi"
type SortDir = "asc" | "desc"

export default function OmborPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out" | "ok">("all")
  const [kategoriya, setKategoriya] = useState("all")
  const [sortField, setSortField] = useState<SortField>("nomi")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [kunlar, setKunlar] = useState(30)
  const [exporting, setExporting] = useState(false)

  const { data: rawData, loading, error, refetch } = useApi(() => omborService.prognoz(kunlar), [kunlar])

  async function handleExcelExport() {
    setExporting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/ombor/prognoz/excel?kunlar=${kunlar}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Export xatoligi")
      const result = await res.json()
      const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = result.filename || "ombor.xlsx"; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  const allItems: any[] = useMemo(() => {
    if (!rawData) return []
    return Array.isArray(rawData) ? rawData : (rawData as any).tovarlar || []
  }, [rawData])

  const kategoriyalar = useMemo(() => {
    const s = new Set<string>()
    allItems.forEach(t => t.kategoriya && s.add(t.kategoriya))
    return Array.from(s).sort()
  }, [allItems])

  const data = useMemo(() => {
    let items = [...allItems]

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(t => (t.nomi || "").toLowerCase().includes(q))
    }
    if (kategoriya !== "all") items = items.filter(t => t.kategoriya === kategoriya)
    if (filter === "low") items = items.filter(t => t.zaxira > 0 && t.zaxira <= (t.min_zaxira || 5))
    if (filter === "out") items = items.filter(t => !t.zaxira || t.zaxira <= 0)
    if (filter === "ok") items = items.filter(t => t.zaxira > (t.min_zaxira || 5))

    items.sort((a, b) => {
      const av = a[sortField] ?? 0
      const bv = b[sortField] ?? 0
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === "asc" ? av - bv : bv - av
    })

    return items
  }, [allItems, search, filter, kategoriya, sortField, sortDir])

  const stats = useMemo(() => ({
    jami:    allItems.length,
    kam:     allItems.filter(t => t.zaxira > 0 && t.zaxira <= (t.min_zaxira || 5)).length,
    tugagan: allItems.filter(t => !t.zaxira || t.zaxira <= 0).length,
    normal:  allItems.filter(t => t.zaxira > (t.min_zaxira || 5)).length,
  }), [allItems])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("asc") }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`inline w-3 h-3 ml-1 ${sortField === field ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
  )

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={Warehouse}
          gradient="violet"
          title="Ombor nazorati"
          subtitle="Zaxira holati, prognoz va tavsiyalar"
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Yangilash
            </Button>
            <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-1" /> {exporting ? "..." : "Excel"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 cursor-pointer hover:shadow-md transition"
               onClick={() => setFilter("all")}>
            <div className="text-sm text-muted-foreground">Jami tovarlar</div>
            <div className="text-2xl font-bold mt-1">{stats.jami}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/30 p-4 cursor-pointer hover:shadow-md transition"
               onClick={() => setFilter("ok")}>
            <div className="text-sm text-emerald-600 dark:text-emerald-400">Normal zaxira</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">{stats.normal}</div>
          </div>
          <div className="bg-amber-500/10 dark:bg-amber-500/10 rounded-xl border border-amber-500/30 dark:border-amber-500/30 p-4 cursor-pointer hover:shadow-md transition"
               onClick={() => setFilter("low")}>
            <div className="text-sm text-amber-600 dark:text-amber-400">Kam qolgan</div>
            <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">{stats.kam}</div>
          </div>
          <div className="bg-rose-500/10 dark:bg-rose-950/20 rounded-xl border border-rose-500/30 dark:border-rose-800 p-4 cursor-pointer hover:shadow-md transition"
               onClick={() => setFilter("out")}>
            <div className="text-sm text-rose-600 dark:text-rose-400">Tugagan</div>
            <div className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">{stats.tugagan}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tovar qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={kategoriya}
              onChange={e => setKategoriya(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-card"
            >
              <option value="all">Barcha kategoriyalar</option>
              {kategoriyalar.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select
              value={kunlar}
              onChange={e => setKunlar(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm bg-card"
            >
              <option value={7}>7 kunlik prognoz</option>
              <option value={14}>14 kunlik prognoz</option>
              <option value={30}>30 kunlik prognoz</option>
              <option value={60}>60 kunlik prognoz</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <PageLoading />
        ) : error ? (
          <div className="text-center p-10 text-rose-500 dark:text-rose-400">Xatolik: {String(error)}</div>
        ) : (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("nomi")}>
                    Tovar <SortIcon field="nomi" />
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => toggleSort("zaxira")}>
                    Zaxira <SortIcon field="zaxira" />
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => toggleSort("sotilgan")}>
                    Sotilgan <SortIcon field="sotilgan" />
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => toggleSort("kunlik_sotuv")}>
                    Kunlik sotuv <SortIcon field="kunlik_sotuv" />
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => toggleSort("kunlarga_yetadi")}>
                    Qancha kunga yetadi <SortIcon field="kunlarga_yetadi" />
                  </TableHead>
                  <TableHead className="text-center">Tavsiya ({kunlar} kunga)</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                ) : data.map((t: any, i: number) => {
                  const zaxira = t.zaxira ?? 0
                  const minZaxira = t.min_zaxira ?? 5
                  const kunlikSotuv = t.kunlik_sotuv ?? 0
                  const kunlarYetadi = kunlikSotuv > 0 ? Math.floor(zaxira / kunlikSotuv) : 999
                  const tavsiya = kunlikSotuv > 0 ? Math.max(0, Math.ceil(kunlikSotuv * kunlar - zaxira)) : 0
                  const status = zaxira <= 0 ? "out" : zaxira <= minZaxira ? "low" : "ok"

                  return (
                    <TableRow key={t.id || i} className={status === "out" ? "bg-rose-500/10 dark:bg-rose-950/10" : status === "low" ? "bg-amber-500/10 dark:bg-amber-900/10" : ""}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.nomi || "Nomsiz"}</div>
                        {t.kategoriya && <div className="text-xs text-muted-foreground">{t.kategoriya}</div>}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {zaxira}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {t.sotilgan ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {kunlikSotuv.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-mono font-bold ${kunlarYetadi <= 3 ? "text-rose-600 dark:text-rose-400" : kunlarYetadi <= 7 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {kunlarYetadi >= 999 ? "-" : `${kunlarYetadi} kun`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {tavsiya > 0 ? (
                          <span className="font-mono text-blue-600 font-bold">+{tavsiya}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {status === "out" ? (
                          <Badge variant="destructive" className="text-xs">Tugagan</Badge>
                        ) : status === "low" ? (
                          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs">Kam</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
