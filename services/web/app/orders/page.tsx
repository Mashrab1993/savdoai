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

type OrderStatus = "all" | "yangi" | "tasdiqlangan" | "yetkazildi" | "bekor"

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  yangi:         { label: "Yangi",        color: "bg-blue-100 text-blue-800",    icon: Clock },
  tasdiqlangan:  { label: "Tasdiqlangan", color: "bg-yellow-100 text-yellow-800", icon: CheckCircle2 },
  yetkazildi:    { label: "Yetkazildi",   color: "bg-emerald-100 text-emerald-800", icon: Truck },
  bekor:         { label: "Bekor qilindi", color: "bg-red-100 text-red-800",     icon: XCircle },
  yakunlandi:    { label: "Yakunlandi",   color: "bg-gray-100 text-gray-800",    icon: CheckCircle2 },
}

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: rawOrders, loading, error, refetch } = useApi(() => savdoService.list({}))

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

    return items.sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
  }, [rawOrders, search, statusFilter])

  const stats = useMemo(() => {
    const items: any[] = rawOrders
      ? (Array.isArray(rawOrders) ? rawOrders : (rawOrders as any).items || (rawOrders as any).sessiyalar || [])
      : []
    return {
      jami: items.length,
      yangi: items.filter((o: any) => (o.holat || o.status) === "yangi").length,
      tasdiqlangan: items.filter((o: any) => (o.holat || o.status) === "tasdiqlangan").length,
      yetkazildi: items.filter((o: any) => (o.holat || o.status) === "yetkazildi").length,
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-emerald-600" />
              Buyurtmalar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Barcha buyurtmalar va sotuvlar
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>Yangilash</Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer hover:shadow-md"
               onClick={() => setStatusFilter("all")}>
            <div className="text-sm text-muted-foreground">Jami</div>
            <div className="text-2xl font-bold mt-1">{stats.jami}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4 cursor-pointer hover:shadow-md"
               onClick={() => setStatusFilter("yangi")}>
            <div className="text-sm text-blue-600">Yangi</div>
            <div className="text-2xl font-bold mt-1 text-blue-700">{stats.yangi}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 p-4 cursor-pointer hover:shadow-md"
               onClick={() => setStatusFilter("tasdiqlangan")}>
            <div className="text-sm text-yellow-600">Tasdiqlangan</div>
            <div className="text-2xl font-bold mt-1 text-yellow-700">{stats.tasdiqlangan}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4 cursor-pointer hover:shadow-md"
               onClick={() => setStatusFilter("yetkazildi")}>
            <div className="text-sm text-emerald-600">Yetkazildi</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{stats.yetkazildi}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Jami summa</div>
            <div className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(stats.jami_summa)}</div>
          </div>
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead className="text-center">Tovarlar</TableHead>
                  <TableHead className="text-center">Summa</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                  <TableHead className="text-center">Sana</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Buyurtmalar topilmadi
                    </TableCell>
                  </TableRow>
                ) : orders.map((o: any, i: number) => {
                  const status = STATUS_MAP[o.holat || o.status || "yangi"] || STATUS_MAP.yangi
                  return (
                    <TableRow key={o.id || i} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => viewOrder(o)}>
                      <TableCell className="font-mono font-bold">#{o.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{o.klient_ism || o.client_name || "Noma'lum"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {o.tovarlar_soni || o.items_count || "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {formatCurrency(o.jami || o.total || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {o.yaratilgan || o.created_at || "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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
            {selectedOrder && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mijoz:</span>
                    <span className="font-medium">{selectedOrder.klient_ism || "Noma'lum"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Holat:</span>
                    <Badge className={`text-xs ${(STATUS_MAP[selectedOrder.holat || selectedOrder.status] || STATUS_MAP.yangi).color}`}>
                      {(STATUS_MAP[selectedOrder.holat || selectedOrder.status] || STATUS_MAP.yangi).label}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sana:</span>
                    <span>{selectedOrder.yaratilgan || selectedOrder.created_at || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Jami:</span>
                    <span className="text-emerald-600">{formatCurrency(selectedOrder.jami || selectedOrder.total || 0)}</span>
                  </div>
                </div>

                {/* Order items */}
                {selectedOrder.tovarlar && (
                  <div>
                    <h3 className="font-medium mb-2">Tovarlar:</h3>
                    <div className="space-y-2">
                      {(Array.isArray(selectedOrder.tovarlar) ? selectedOrder.tovarlar : []).map((t: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm border-b pb-2">
                          <div>
                            <div className="font-medium">{t.nomi || t.tovar_nomi || `Tovar #${t.tovar_id}`}</div>
                            <div className="text-xs text-muted-foreground">{t.miqdor || t.qty} dona x {formatCurrency(t.narx || t.price || 0)}</div>
                          </div>
                          <div className="font-mono font-bold">
                            {formatCurrency((t.miqdor || t.qty || 0) * (t.narx || t.price || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  )
}
