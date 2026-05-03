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
const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Promo <span className="italic text-[#C75D3C]">samaradorligi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{PROMOS.length} ta promo · ROI tahlili · 1-oy</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 1-oy</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Sparkles className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#10B981" }}>Faol promolar</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{PROMOS.length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">davr ichida ishga tushgan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#2563EB" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#2563EB" }}>Total uplift</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{fmt(totalUplift / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">qo'shimcha tushum</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#2563EB" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Tag className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>Promo xarajati</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{fmt(totalCost / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami investitsiya</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Target className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>O'rtacha ROI</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{avgRoi}%</div>
              <div className="text-xs text-[#9C8A6E] mt-1">return on investment</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#7C3AED" }} />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={SERIF}>Promo per-promo tahlil</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Promo</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Davr</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Baseline → Promo (so'm)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Uplift</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Uplift %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Xarajat</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sof foyda</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ROI</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Konversiya</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.sort((a, b) => b.roi - a.roi).map(p => (
                    <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{p.name}</div>
                        <div className="text-xs text-[#9C8A6E] font-mono">{p.productSku} · {p.discount}{p.type === "%" ? "%" : p.type === "fix" ? " so'm" : ""}</div>
                      </td>
                      <td className="py-3 px-2 text-xs text-[#6B5B4D]">{p.period}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-xs">
                        <div className="text-[#9C8A6E]">{fmt(p.baselineSales / 1000)}k</div>
                        <div className="font-medium text-emerald-700">→ {fmt(p.promoSales / 1000)}k</div>
                      </td>
                      <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${p.uplift >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                        {p.uplift >= 0 ? "+" : ""}{fmt(p.uplift / 1000)}k
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-mono tabular-nums font-medium flex items-center justify-end gap-1 ${p.upliftPct >= 50 ? "text-emerald-700" : p.upliftPct >= 20 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>
                          {p.upliftPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {p.upliftPct >= 0 ? "+" : ""}{p.upliftPct}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]">−{fmt(p.cost / 1000)}k</td>
                      <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${p.netProfit >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                        {p.netProfit >= 0 ? "+" : ""}{fmt(Math.round(p.netProfit / 1000))}k
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono tabular-nums font-medium text-xs ${p.roi >= 100 ? "bg-emerald-50 text-emerald-700" : p.roi >= 30 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                          {p.roi >= 0 ? "+" : ""}{p.roi}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-xs text-[#6B5B4D]">{p.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8" style={{ color: totalNetProfit >= 0 ? "#10B981" : "#C75D3C" }} />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-[#1A1A1A]" style={SERIF}>Promo kampaniyalar umumiy natijasi</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  Total uplift {fmt(totalUplift)} so'm − xarajat {fmt(totalCost)} so'm
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-light font-mono tabular-nums" style={{ ...SERIF, color: totalNetProfit >= 0 ? "#047857" : "#C75D3C" }}>
                  {totalNetProfit >= 0 ? "+" : ""}{fmt(Math.round(totalNetProfit / 1000))}k
                </div>
                <div className="text-xs text-[#9C8A6E]">sof foyda</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: totalNetProfit >= 0 ? "#10B981" : "#C75D3C" }} />
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
