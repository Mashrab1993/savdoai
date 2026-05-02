"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, Tag, TrendingUp, TrendingDown, Sparkles, Target } from "lucide-react"
import Link from "next/link"

type Promo = {
  id: number; name: string; productSku: string; period: string;
  discount: number; type: "%" | "fix" | "1+1";
  baselineSales: number; promoSales: number;
  baselineQty: number; promoQty: number;
  cost: number; margin: number;
  clientsReached: number; conversionRate: number;
}

const PROMOS: Promo[] = [
  {
    id: 1, name: "Choco-Boom −20%", productSku: "CB-075-CHO", period: "01.04 — 15.04",
    discount: 20, type: "%",
    baselineSales: 12_400_000, promoSales: 28_800_000,
    baselineQty: 420, promoQty: 1240,
    cost: 5_600_000, margin: 32,
    clientsReached: 184, conversionRate: 78,
  },
  {
    id: 2, name: "Coca-Cola 1+1", productSku: "CC-1500-CL", period: "10.04 — 25.04",
    discount: 50, type: "1+1",
    baselineSales: 9_800_000, promoSales: 18_400_000,
    baselineQty: 280, promoQty: 580,
    cost: 4_800_000, margin: 18,
    clientsReached: 142, conversionRate: 84,
  },
  {
    id: 3, name: "Bonjur fix 8000", productSku: "BJ-050-MOL", period: "15.04 — 30.04",
    discount: 2000, type: "fix",
    baselineSales: 6_400_000, promoSales: 8_200_000,
    baselineQty: 240, promoQty: 320,
    cost: 1_600_000, margin: 24,
    clientsReached: 98, conversionRate: 62,
  },
  {
    id: 4, name: "Pechenye −15%", productSku: "PEC-300-YU", period: "20.04 — 02.05",
    discount: 15, type: "%",
    baselineSales: 3_200_000, promoSales: 3_840_000,
    baselineQty: 120, promoQty: 144,
    cost: 480_000, margin: 28,
    clientsReached: 64, conversionRate: 48,
  },
  {
    id: 5, name: "Sok Apelsin −10%", productSku: "SK-1000-OR", period: "01.05 — 15.05",
    discount: 10, type: "%",
    baselineSales: 4_800_000, promoSales: 5_200_000,
    baselineQty: 160, promoQty: 168,
    cost: 480_000, margin: 22,
    clientsReached: 48, conversionRate: 36,
  },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function PromoEffectivenessPage() {
  const enriched = PROMOS.map(p => ({
    ...p,
    uplift: p.promoSales - p.baselineSales,
    upliftPct: Math.round(((p.promoSales / p.baselineSales) - 1) * 100),
    qtyUplift: p.promoQty - p.baselineQty,
    netProfit: (p.promoSales - p.baselineSales) * (p.margin / 100) - p.cost,
    roi: Math.round(((p.promoSales - p.baselineSales) * (p.margin / 100) - p.cost) / p.cost * 100),
  }))

  const totalUplift = enriched.reduce((s, p) => s + p.uplift, 0)
  const totalCost = enriched.reduce((s, p) => s + p.cost, 0)
  const totalNetProfit = enriched.reduce((s, p) => s + p.netProfit, 0)
  const avgRoi = Math.round(enriched.reduce((s, p) => s + p.roi, 0) / enriched.length)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Promo samaradorligi</h1>
            <p className="text-sm text-slate-500">{PROMOS.length} ta promo · ROI tahlili · 1-oy</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 1-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Sparkles className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol promolar</div>
            <div className="text-2xl font-bold mt-1">{PROMOS.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Total Uplift</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalUplift / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <Tag className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Promo xarajati</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalCost / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Target className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">O'rtacha ROI</div>
            <div className="text-2xl font-bold mt-1 font-mono">{avgRoi}%</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Promo per-promo tahlil</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Promo</th>
                  <th className="py-3 px-2">Davr</th>
                  <th className="py-3 px-2 text-right">Baseline → Promo (so'm)</th>
                  <th className="py-3 px-2 text-right">Uplift</th>
                  <th className="py-3 px-2 text-right">Uplift %</th>
                  <th className="py-3 px-2 text-right">Xarajat</th>
                  <th className="py-3 px-2 text-right">Sof foyda</th>
                  <th className="py-3 px-2 text-center">ROI</th>
                  <th className="py-3 px-2 text-center">Konversiya</th>
                </tr>
              </thead>
              <tbody>
                {enriched.sort((a, b) => b.roi - a.roi).map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{p.productSku} · {p.discount}{p.type === "%" ? "%" : p.type === "fix" ? " so'm" : ""}</div>
                    </td>
                    <td className="py-3 px-2 text-xs">{p.period}</td>
                    <td className="py-3 px-2 text-right font-mono text-xs">
                      <div className="text-slate-500">{fmt(p.baselineSales / 1000)}k</div>
                      <div className="font-bold text-emerald-700">→ {fmt(p.promoSales / 1000)}k</div>
                    </td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${p.uplift >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {p.uplift >= 0 ? "+" : ""}{fmt(p.uplift / 1000)}k
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-mono font-bold flex items-center justify-end gap-1 ${p.upliftPct >= 50 ? "text-emerald-700" : p.upliftPct >= 20 ? "text-amber-700" : "text-rose-700"}`}>
                        {p.upliftPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {p.upliftPct >= 0 ? "+" : ""}{p.upliftPct}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-rose-700">−{fmt(p.cost / 1000)}k</td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${p.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {p.netProfit >= 0 ? "+" : ""}{fmt(Math.round(p.netProfit / 1000))}k
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${p.roi >= 100 ? "bg-emerald-100 text-emerald-700" : p.roi >= 30 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {p.roi >= 0 ? "+" : ""}{p.roi}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs">{p.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={`p-5 border-2 ${totalNetProfit >= 0 ? "bg-emerald-50 border-emerald-300" : "bg-rose-50 border-rose-300"}`}>
          <div className="flex items-center gap-3">
            <Sparkles className={`w-8 h-8 ${totalNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`} />
            <div className="flex-1">
              <h3 className="text-lg font-bold">Promo kampaniyalar umumiy natijasi</h3>
              <p className="text-sm text-slate-600 mt-1">
                Total uplift {fmt(totalUplift)} so'm − xarajat {fmt(totalCost)} so'm
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-mono ${totalNetProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {totalNetProfit >= 0 ? "+" : ""}{fmt(Math.round(totalNetProfit / 1000))}k
              </div>
              <div className="text-xs text-slate-600">sof foyda</div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
