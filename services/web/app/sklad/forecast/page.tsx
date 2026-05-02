"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, AlertTriangle, TrendingUp, Package, ShoppingCart } from "lucide-react"
import Link from "next/link"

type ForecastRow = {
  id: number; sku: string; product: string;
  currentStock: number; avgDailyUsage: number;
  daysOfStock: number; stockoutDate: string;
  recommendedOrder: number; reorderPoint: number;
  status: "critical" | "warning" | "ok" | "overstock";
}

const FORECASTS: ForecastRow[] = [
  { id: 1, sku: "CB-075-CHO", product: "Choco-Boom 75g", currentStock: 184, avgDailyUsage: 24, daysOfStock: 7.7, stockoutDate: "2026-05-10", recommendedOrder: 480, reorderPoint: 168, status: "warning" },
  { id: 2, sku: "CC-1500-CL", product: "Coca-Cola 1.5L", currentStock: 96, avgDailyUsage: 32, daysOfStock: 3.0, stockoutDate: "2026-05-05", recommendedOrder: 640, reorderPoint: 224, status: "critical" },
  { id: 3, sku: "BJ-050-MOL", product: "Bonjur Молочный 50g", currentStock: 240, avgDailyUsage: 18, daysOfStock: 13.3, stockoutDate: "2026-05-15", recommendedOrder: 360, reorderPoint: 126, status: "ok" },
  { id: 4, sku: "SK-1000-OR", product: "Sok Apelsin 1L", currentStock: 72, avgDailyUsage: 14, daysOfStock: 5.1, stockoutDate: "2026-05-07", recommendedOrder: 280, reorderPoint: 98, status: "warning" },
  { id: 5, sku: "PEC-300-YU", product: "Pechenye Yubileynoye", currentStock: 48, avgDailyUsage: 8, daysOfStock: 6.0, stockoutDate: "2026-05-08", recommendedOrder: 160, reorderPoint: 56, status: "warning" },
  { id: 6, sku: "BIS-150-TR", product: "Biskvit Triton 150g", currentStock: 520, avgDailyUsage: 6, daysOfStock: 86.7, stockoutDate: "2026-07-28", recommendedOrder: 0, reorderPoint: 42, status: "overstock" },
  { id: 7, sku: "CHA-008-DI", product: "Chay Dilmah 8 paket", currentStock: 124, avgDailyUsage: 12, daysOfStock: 10.3, stockoutDate: "2026-05-12", recommendedOrder: 240, reorderPoint: 84, status: "ok" },
  { id: 8, sku: "VOD-1L-PR", product: "Voda Premium 1L", currentStock: 12, avgDailyUsage: 28, daysOfStock: 0.4, stockoutDate: "2026-05-03", recommendedOrder: 560, reorderPoint: 196, status: "critical" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const STATUS_LABEL: Record<string, string> = {
  critical: "🔴 Kritik (1 hafta)",
  warning: "🟡 Ogohlantirish (2 hafta)",
  ok: "🟢 OK (kerak emas)",
  overstock: "🔵 Ortiqcha zaxira",
}
const STATUS_COLOR: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700 border-rose-300",
  warning: "bg-amber-100 text-amber-700 border-amber-300",
  ok: "bg-emerald-100 text-emerald-700 border-emerald-300",
  overstock: "bg-blue-100 text-blue-700 border-blue-300",
}

export default function StockForecastPage() {
  const sorted = [...FORECASTS].sort((a, b) => a.daysOfStock - b.daysOfStock)
  const criticalCount = FORECASTS.filter(f => f.status === "critical").length
  const totalRecOrder = FORECASTS.reduce((s, f) => s + f.recommendedOrder, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Sklad bashorati (forecast)</h1>
            <p className="text-sm text-slate-500">Sotuv velosipedi asosida zaxira tahlili va buyurtma tavsiyalari</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 7-kunlik avg</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Kritik (zaxira ≤ 7 kun)</div>
            <div className="text-2xl font-bold mt-1">{criticalCount}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Ogohlantirish (≤ 14 kun)</div>
            <div className="text-2xl font-bold mt-1">{FORECASTS.filter(f => f.status === "warning").length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Package className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Ortiqcha zaxira</div>
            <div className="text-2xl font-bold mt-1">{FORECASTS.filter(f => f.status === "overstock").length}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <ShoppingCart className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Tavsiya buyurtma</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalRecOrder)}</div>
          </Card>
        </div>

        <Card className="p-5 bg-rose-50 border-rose-300 border-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-7 h-7 text-rose-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-rose-800 text-lg">Diqqat: 1-haftada zaxiradan tugab qoladi</h3>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {FORECASTS.filter(f => f.status === "critical").map(f => (
                  <div key={f.id} className="bg-white p-3 rounded-lg flex items-center gap-3">
                    <Package className="w-5 h-5 text-rose-500" />
                    <div className="flex-1">
                      <div className="text-sm font-bold">{f.product}</div>
                      <div className="text-xs text-slate-500">{f.daysOfStock.toFixed(1)} kun · tugash: {f.stockoutDate}</div>
                    </div>
                    <Button size="sm" className="h-8 text-xs">Buyurtma +{f.recommendedOrder}</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Forecast jadvali
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 text-left">SKU</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Zaxira</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">O'rta/kun</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Kun qoldi</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Tugash sanasi</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Reorder point</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Tavsiya buyurtma</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Holat</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 font-mono">{f.sku}</td>
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{f.product}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(f.currentStock)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{f.avgDailyUsage}</td>
                    <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${f.daysOfStock <= 5 ? "text-rose-700" : f.daysOfStock <= 14 ? "text-amber-700" : "text-emerald-700"}`}>
                      {f.daysOfStock.toFixed(1)}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-xs">{f.stockoutDate}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-500">{fmt(f.reorderPoint)}</td>
                    <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${f.recommendedOrder > 0 ? "text-emerald-700" : "text-slate-300"}`}>
                      {f.recommendedOrder > 0 ? `+${fmt(f.recommendedOrder)}` : "—"}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLOR[f.status]}`}>{STATUS_LABEL[f.status]}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      {f.recommendedOrder > 0 && (
                        <Button size="sm" className="h-7 text-xs">Buyurtma</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
