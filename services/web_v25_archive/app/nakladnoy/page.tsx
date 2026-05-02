"use client"
import { useState, useMemo } from "react"
import { PageLoading } from "@/components/shared/page-states"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Search, Calendar, Truck, User, Eye, Printer, Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

interface Order {
  id: number
  klient_ismi: string
  manzil?: string
  telefon?: string
  jami: number
  status: string
  yaratilgan: string
  items_count?: number
}

export default function NakladnoyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (selected.length === 0) return
    setExporting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/nakladnoy/excel`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ sessiya_ids: selected }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement("a")
      a.href      = url
      a.download  = result.filename || "nakladnoy.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setExporting(false)
    }
  }

  async function handleSingleExport(id: number) {
    setSelected([id])
    // Wait for state to apply
    await new Promise(r => setTimeout(r, 10))
    // Use the selected-id directly instead of state
    setExporting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/nakladnoy/excel`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ sessiya_ids: [id] }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement("a")
      a.href      = url
      a.download  = result.filename || `nakladnoy_${id}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setExporting(false)
    }
  }

  const { data: rawOrders, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/savdolar`, { headers: { Authorization: `Bearer ${token}` } })
      return res.ok ? res.json() : { items: [] }
    } catch { return { items: [] } }
  })

  const orders = useMemo(() => {
    let list: Order[] = (rawOrders as any)?.items || (rawOrders as any)?.sessiyalar || []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(o => (o.klient_ismi || "").toLowerCase().includes(q))
    }
    return list
  }, [rawOrders, search])

  const totalSum = orders.reduce((s, o) => s + (o.jami || 0), 0)
  const totalItems = orders.reduce((s, o) => s + (o.items_count || 0), 0)

  const toggleSelect = (id: number) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const selectAll = () => {
    setSelected(selected.length === orders.length ? [] : orders.map(o => o.id))
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={FileText}
          gradient="blue"
          title="Nakladnoylar (Накладные 3.1)"
          subtitle="Buyurtmalardan avtomatik nakladnoy generatsiya"
        />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div></div>
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={selected.length === 0 || exporting}
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-1" />
              {exporting ? "..." : `${selected.length || "0"} ta nakladnoy`}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Truck className="w-3 h-3" /> Bugungi nakladnoy
            </div>
            <div className="text-2xl font-bold mt-1">{orders.length}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600">Tanlangan</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{selected.length}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-600 flex items-center gap-1">
              <Package className="w-3 h-3" /> Jami tovar
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-700">{totalItems}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 p-4">
            <div className="text-sm text-purple-600">Jami summa</div>
            <div className="text-xl font-bold mt-1 text-violet-700 dark:text-violet-300">{formatCurrency(totalSum)}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Mijoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Table */}
        {loading ? (
          <PageLoading />
        ) : (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={selected.length === orders.length && orders.length > 0} onChange={selectAll} />
                  </TableHead>
                  <TableHead className="w-16">№</TableHead>
                  <TableHead>Mijoz (Кому)</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Manzil</TableHead>
                  <TableHead className="text-center">Tovarlar</TableHead>
                  <TableHead className="text-center">Summa</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Buyurtmalar topilmadi
                    </TableCell>
                  </TableRow>
                ) : orders.map((o, i) => (
                  <TableRow key={o.id} className={selected.includes(o.id) ? "bg-emerald-50 dark:bg-emerald-900/10" : ""}>
                    <TableCell>
                      <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} />
                    </TableCell>
                    <TableCell className="font-mono">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{o.klient_ismi || "Mijoz"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{o.telefon || "-"}</TableCell>
                    <TableCell className="text-sm">{o.manzil || "-"}</TableCell>
                    <TableCell className="text-center font-mono">{o.items_count || 0}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-emerald-700">{formatCurrency(o.jami || 0)}</TableCell>
                    <TableCell className="text-center"><Badge>{o.status || "Yangi"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Excel"
                                onClick={() => handleSingleExport(o.id)}
                                disabled={exporting}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Chop etish"
                                onClick={() => window.print()}>
                          <Printer className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-sm text-blue-700">
            <div className="font-bold mb-1">Nakladnoy formati: Накладные 3.1</div>
            <div>Har bir mijoz uchun alohida nakladnoy: sarlavha, mijoz ma'lumoti, ZAKAZ raqami, tovarlar jadvali, jami summa, "Отпустил/Принял" imzo joyi.</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
