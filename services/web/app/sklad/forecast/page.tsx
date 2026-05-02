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
  critical: "🔴 Kritik",
  warning: "🟡 Ogohlantirish",
  ok: "🟢 OK",
  overstock: "🔵 Ortiqcha",
}
const STATUS_COLOR: Record<string, string> = {
  critical: "bg-[#F5E5D6] text-[#C75D3C] border-[#C75D3C]/30",
  warning: "bg-[#FCE9DD] text-[#D97706] border-[#D97706]/30",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overstock: "bg-blue-50 text-blue-700 border-blue-200",
}

export default function StockForecastPage() {
  const sorted = [...FORECASTS].sort((a, b) => a.daysOfStock - b.daysOfStock)
  const criticalCount = FORECASTS.filter(f => f.status === "critical").length
  const totalRecOrder = FORECASTS.reduce((s, f) => s + f.recommendedOrder, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Sklad <span className="italic text-[#C75D3C]">bashorati</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Sotuv velosipedi asosida zaxira tahlili va buyurtma tavsiyalari</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 7-kunlik avg</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={AlertTriangle} accent="#C75D3C" label="Kritik (≤ 7 kun)" value={criticalCount.toString()} />
            <KpiCard icon={AlertTriangle} accent="#D97706" label="Ogohlantirish (≤ 14 kun)" value={FORECASTS.filter(f => f.status === "warning").length.toString()} />
            <KpiCard icon={Package} accent="#3B82F6" label="Ortiqcha zaxira" value={FORECASTS.filter(f => f.status === "overstock").length.toString()} />
            <KpiCard icon={ShoppingCart} accent="#10B981" label="Tavsiya buyurtma" value={fmt(totalRecOrder)} />
          </div>

          <Card className="p-6 bg-white border-2 border-[#C75D3C]/40 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#C75D3C]" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">DIQQAT</div>
                <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>1-haftada zaxiradan tugab qoladi</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {FORECASTS.filter(f => f.status === "critical").map(f => (
                    <div key={f.id} className="bg-[#FAF7F2] border border-[#E8E0D3] p-3 rounded-2xl flex items-center gap-3">
                      <Package className="w-5 h-5 text-[#C75D3C]" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1A1A1A]">{f.product}</div>
                        <div className="text-xs text-[#9C8A6E]">{f.daysOfStock.toFixed(1)} kun · tugash: {f.stockoutDate}</div>
                      </div>
                      <Button size="sm" className="h-8 text-xs" style={{ background: "#C75D3C" }}>+{f.recommendedOrder}</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <TrendingUp className="w-5 h-5 text-[#3B82F6]" /> Forecast jadvali
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zaxira</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta/kun</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kun qoldi</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tugash sanasi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Reorder</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tavsiya</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(f => (
                    <tr key={f.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-mono text-xs text-[#1A1A1A]">{f.sku}</td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{f.product}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(f.currentStock)}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{f.avgDailyUsage}</td>
                      <td className={`py-3 px-2 text-right font-mono font-medium ${f.daysOfStock <= 5 ? "text-[#C75D3C]" : f.daysOfStock <= 14 ? "text-[#D97706]" : "text-emerald-700"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                        {f.daysOfStock.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs text-[#6B5B4D]">{f.stockoutDate}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#9C8A6E]">{fmt(f.reorderPoint)}</td>
                      <td className={`py-3 px-2 text-right font-mono font-medium ${f.recommendedOrder > 0 ? "text-emerald-700" : "text-[#9C8A6E]"}`} style={f.recommendedOrder > 0 ? { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } : {}}>
                        {f.recommendedOrder > 0 ? `+${fmt(f.recommendedOrder)}` : "—"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLOR[f.status]}`}>{STATUS_LABEL[f.status]}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {f.recommendedOrder > 0 && (
                          <Button size="sm" className="h-7 text-xs" style={{ background: "#C75D3C" }}>Buyurtma</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
