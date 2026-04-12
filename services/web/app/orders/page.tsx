"use client"

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  ShoppingCart, Search, Filter, Eye, CheckCircle2, Clock,
  XCircle, Truck, Download, Calendar, User, Package,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { savdoService } from "@/lib/api/services"
import { PageHeader } from "@/components/ui/page-header"
import { useLocale } from "@/lib/locale-context"
import OrderStatusBoard, { type Order as BoardOrder, type OrderStatus as BoardStatus } from "@/components/dashboard/order-status-board"

type OrderStatus = "all" | "yangi" | "tasdiqlangan" | "otgruzka" | "yetkazildi" | "bekor"

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  yangi:         { label: "Yangi",        color: "bg-blue-100 text-blue-800",        icon: Clock },
  tasdiqlangan:  { label: "Tasdiqlangan", color: "bg-yellow-100 text-yellow-800",    icon: CheckCircle2 },
  otgruzka:      { label: "Otgruzka",     color: "bg-purple-100 text-purple-800",    icon: Truck },
  yetkazildi:    { label: "Yetkazildi",   color: "bg-emerald-100 text-emerald-800",  icon: CheckCircle2 },
  bekor:         { label: "Bekor",        color: "bg-red-100 text-red-800",          icon: XCircle },
}

// Valid next statuses from current state
const NEXT_STATUSES: Record<string, string[]> = {
  yangi:         ["tasdiqlangan", "bekor"],
  tasdiqlangan:  ["otgruzka", "bekor"],
  otgruzka:      ["yetkazildi", "bekor"],
  yetkazildi:    [],
  bekor:         [],
}

export default function OrdersPage() {
  const { locale } = useLocale()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const today = new Date().toISOString().split("T")[0]
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
  const [sanaDan, setSanaDan] = useState(monthAgo)
  const [sanaGacha, setSanaGacha] = useState(today)
  const [onlyDebt, setOnlyDebt] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data: rawOrders, loading, error, refetch } = useApi(
    () => savdoService.list({ sana_dan: sanaDan, sana_gacha: sanaGacha, limit: 500 }),
    [sanaDan, sanaGacha]
  )

  async function changeStatus(sessId: number, newHolat: string, sabab?: string) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/savdo/${sessId}/holat`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ holat: newHolat, sabab }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      refetch()
      setSheetOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleExcelExport() {
    setExporting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const qs    = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha })
      const res   = await fetch(`${base}/api/v1/savdolar/excel?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Export xatoligi")
      const result = await res.json()
      const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement("a")
      a.href      = url
      a.download  = result.filename || "reestr.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  const orders = useMemo(() => {
    let items: any[] = []
    if (rawOrders) {
      items = Array.isArray(rawOrders) ? rawOrders : (rawOrders as any).items || (rawOrders as any).sessiyalar || []
    }

    if (search) {
      const q = search.toLowerCase()
      items = items.filter((o: any) =>
        (o.klient_ism || "").toLowerCase().includes(q) ||
        String(o.id || "").includes(q)
      )
    }

    if (statusFilter !== "all") {
      items = items.filter((o: any) => (o.holat || o.status || "") === statusFilter)
    }

    if (onlyDebt) {
      items = items.filter((o: any) => (o.qarz || 0) > 0)
    }

    return items.sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
  }, [rawOrders, search, statusFilter, onlyDebt])

  const stats = useMemo(() => {
    const items: any[] = rawOrders
      ? (Array.isArray(rawOrders) ? rawOrders : (rawOrders as any).items || (rawOrders as any).sessiyalar || [])
      : []
    const byStatus = (s: string) => items.filter((o: any) => (o.holat || "yangi") === s).length
    return {
      jami: items.length,
      yangi:        byStatus("yangi"),
      tasdiqlangan: byStatus("tasdiqlangan"),
      otgruzka:     byStatus("otgruzka"),
      yetkazildi:   byStatus("yetkazildi"),
      bekor:        byStatus("bekor"),
      jami_summa: items.reduce((s: number, o: any) => s + (o.jami || o.total || 0), 0),
    }
  }, [rawOrders])

  const viewOrder = async (order: any) => {
    try {
      const detail = await savdoService.detail(order.id)
      setSelectedOrder(detail)
    } catch {
      setSelectedOrder(order)
    }
    setSheetOpen(true)
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={ShoppingCart}
          gradient="blue"
          title={locale === "uz" ? "Buyurtmalar" : "Заказы"}
          subtitle={locale === "uz" ? "Barcha buyurtmalar va sotuvlar" : "Все заказы и продажи"}
        />
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div></div>
          <div className="flex flex-wrap gap-2 items-center">
            <Input type="date" value={sanaDan} onChange={e => setSanaDan(e.target.value)}
                   className="w-40" title="Sana dan" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)}
                   className="w-40" title="Sana gacha" />
            <Button variant={onlyDebt ? "default" : "outline"} size="sm"
                    onClick={() => setOnlyDebt(d => !d)}>
              Faqat qarzdor
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Yangilash</Button>
            <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-1" /> {exporting ? "..." : "Excel"}
            </Button>
          </div>
        </div>

        {/* Stats — 6 status buckets */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <button className={`bg-card rounded-xl border p-3 text-left transition ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setStatusFilter("all")}>
            <div className="text-xs text-muted-foreground">Jami</div>
            <div className="text-2xl font-bold">{stats.jami}</div>
          </button>
          <button className={`bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-3 text-left ${statusFilter === "yangi" ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setStatusFilter("yangi")}>
            <div className="text-xs text-blue-600">Yangi</div>
            <div className="text-2xl font-bold text-blue-700">{stats.yangi}</div>
          </button>
          <button className={`bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 p-3 text-left ${statusFilter === "tasdiqlangan" ? "ring-2 ring-yellow-500" : ""}`}
                  onClick={() => setStatusFilter("tasdiqlangan")}>
            <div className="text-xs text-yellow-600">Tasdiq.</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.tasdiqlangan}</div>
          </button>
          <button className={`bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 p-3 text-left ${statusFilter === "otgruzka" ? "ring-2 ring-purple-500" : ""}`}
                  onClick={() => setStatusFilter("otgruzka")}>
            <div className="text-xs text-purple-600">Otgruzka</div>
            <div className="text-2xl font-bold text-purple-700">{stats.otgruzka}</div>
          </button>
          <button className={`bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-3 text-left ${statusFilter === "yetkazildi" ? "ring-2 ring-emerald-500" : ""}`}
                  onClick={() => setStatusFilter("yetkazildi")}>
            <div className="text-xs text-emerald-600">Yetkazildi</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.yetkazildi}</div>
          </button>
          <button className={`bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 p-3 text-left ${statusFilter === "bekor" ? "ring-2 ring-red-500" : ""}`}
                  onClick={() => setStatusFilter("bekor")}>
            <div className="text-xs text-red-600">Bekor</div>
            <div className="text-2xl font-bold text-red-700">{stats.bekor}</div>
          </button>
        </div>
        <div className="bg-card border rounded-xl p-3 text-right">
          <span className="text-sm text-muted-foreground">Jami summa: </span>
          <span className="text-lg font-bold text-emerald-600">{formatCurrency(stats.jami_summa)}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buyurtma raqami yoki mijoz nomi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center p-10 text-red-500">Xatolik: {String(error)}</div>
        ) : (
          <OrderStatusBoard
            orders={orders.map<BoardOrder>((o: any) => ({
              id:          Number(o.id),
              klient_ismi: o.klient_ismi || o.klient_nomi || "—",
              jami:        Number(o.jami || o.total || 0),
              tolangan:    Number(o.tolangan || 0),
              qarz:        Number(o.qarz || 0),
              holat:       (o.holat || "yangi") as BoardStatus,
              sana:        o.sana || new Date().toISOString(),
              bekor_sabab: o.bekor_sabab || undefined,
            }))}
            onStatusChange={(id, newStatus) => {
              // For 'bekor' prompt for reason; others go straight
              if (newStatus === "bekor") {
                const sabab = prompt("Bekor qilish sababi:")
                if (sabab) changeStatus(id, newStatus, sabab)
              } else {
                changeStatus(id, newStatus)
              }
            }}
          />
        )}

        {/* Order Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Buyurtma #{selectedOrder?.id}
              </SheetTitle>
            </SheetHeader>
            {selectedOrder && (() => {
              const curHolat = selectedOrder.holat || "yangi"
              const curMeta = STATUS_MAP[curHolat] || STATUS_MAP.yangi
              const nextOptions = NEXT_STATUSES[curHolat] || []
              return (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mijoz:</span>
                      <span className="font-medium">{selectedOrder.klient_ismi || selectedOrder.klient_nomi || "Mijoz"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span>{selectedOrder.klient_telefon || selectedOrder.telefon || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Holat:</span>
                      <Badge className={`text-xs ${curMeta.color}`}>
                        {curMeta.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sana:</span>
                      <span>{selectedOrder.sana ? new Date(selectedOrder.sana).toLocaleString("uz-UZ") : "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-2">
                      <span>Jami:</span>
                      <span className="text-emerald-600">{formatCurrency(Number(selectedOrder.jami || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">To&apos;langan:</span>
                      <span className="text-emerald-600">{formatCurrency(Number(selectedOrder.tolangan || 0))}</span>
                    </div>
                    {Number(selectedOrder.qarz || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Qarz:</span>
                        <span className="text-red-600 font-semibold">{formatCurrency(Number(selectedOrder.qarz || 0))}</span>
                      </div>
                    )}
                  </div>

                  {/* Status action buttons */}
                  {nextOptions.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-sm">Holatni o&apos;zgartirish:</h3>
                      <div className="flex flex-wrap gap-2">
                        {nextOptions.map(ns => {
                          const meta = STATUS_MAP[ns]
                          const Icon = meta.icon
                          return (
                            <Button key={ns} size="sm"
                                    variant={ns === "bekor" ? "destructive" : "default"}
                                    onClick={() => {
                                      if (ns === "bekor") {
                                        const sabab = prompt("Bekor qilish sababini kiriting (ixtiyoriy):") || undefined
                                        changeStatus(selectedOrder.id, ns, sabab)
                                      } else {
                                        changeStatus(selectedOrder.id, ns)
                                      }
                                    }}>
                              <Icon className="w-3 h-3 mr-1" />
                              → {meta.label}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order items */}
                  {selectedOrder.tovarlar && (
                    <div>
                      <h3 className="font-medium mb-2 text-sm">Tovarlar:</h3>
                      <div className="space-y-2">
                        {(Array.isArray(selectedOrder.tovarlar) ? selectedOrder.tovarlar : []).map((t: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm border-b pb-2">
                            <div>
                              <div className="font-medium">{t.tovar_nomi || t.nomi || "Tovar"}</div>
                              <div className="text-xs text-muted-foreground">
                                {Number(t.miqdor || 0).toFixed(0)} {t.birlik || "dona"} × {formatCurrency(Number(t.sotish_narxi || t.narx || 0))}
                              </div>
                            </div>
                            <div className="font-mono font-bold">
                              {formatCurrency(Number(t.jami || 0))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOrder.izoh && (
                    <div className="bg-secondary rounded-lg p-3 text-sm">
                      <div className="text-xs text-muted-foreground mb-1">Izoh</div>
                      {selectedOrder.izoh}
                    </div>
                  )}
                </div>
              )
            })()}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  )
}
