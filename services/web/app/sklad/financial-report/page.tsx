"use client"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { TrendingUp, TrendingDown, Calendar, Download } from "lucide-react"

const ROWS = [
  { product: "Choco-Boom 75g", category: "Shokolad", revenue: 28_400_000, cost: 18_240_000, profit: 10_160_000, margin: 35.8 },
  { product: "Coca-Cola 1.5L", category: "Gazli ichimlik", revenue: 24_640_000, cost: 17_248_000, profit: 7_392_000, margin: 30.0 },
  { product: "Bonjur Молочный 50g", category: "Shokolad", revenue: 18_200_000, cost: 11_830_000, profit: 6_370_000, margin: 35.0 },
  { product: "Sok Apelsin 1L", category: "Sok", revenue: 12_400_000, cost: 8_680_000, profit: 3_720_000, margin: 30.0 },
  { product: "Pechenye Yubileynoye", category: "Pechenye", revenue: 10_800_000, cost: 7_560_000, profit: 3_240_000, margin: 30.0 },
  { product: "Voda Premium 1L", category: "Mineral suv", revenue: 8_640_000, cost: 5_184_000, profit: 3_456_000, margin: 40.0 },
  { product: "Biskvit Triton 150g", category: "Pechenye", revenue: 6_820_000, cost: 4_774_000, profit: 2_046_000, margin: 30.0 },
  { product: "Chay Dilmah", category: "Chay", revenue: 5_280_000, cost: 3_696_000, profit: 1_584_000, margin: 30.0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function FinancialReportPage() {
  const totalRev = ROWS.reduce((s, r) => s + r.revenue, 0)
  const totalCost = ROWS.reduce((s, r) => s + r.cost, 0)
  const totalProfit = ROWS.reduce((s, r) => s + r.profit, 0)
  const avgMargin = (totalProfit / totalRev) * 100

  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Sklad fin."
      accent="hisoboti"
      description={`${ROWS.length} ta tovar · ${fmt(totalRev / 1_000_000)} M tushum · ${fmt(totalProfit / 1_000_000)} M sof foyda · ${avgMargin.toFixed(1)}% marja`}
      actions={
        <>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Aprel 2026
          </button>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </>
      }
    >
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PremiumCard className="p-5 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-2">Tushum</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {fmt(totalRev / 1_000_000)} M
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-2">Tannarx</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {fmt(totalCost / 1_000_000)} M
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#9C8A6E]" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-2">Sof foyda</div>
          <div className="text-2xl font-medium tabular-nums text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {fmt(totalProfit / 1_000_000)} M
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-2">O'rta marja</div>
          <div className="text-2xl font-medium tabular-nums text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {avgMargin.toFixed(1)}%
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700" />
        </PremiumCard>
      </div>

      {/* Detailed table */}
      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="TOVAR BO'YICHA" title="Tafsilot" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kategoriya</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tannarx</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foyda</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Marja</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.sort((a, b) => b.profit - a.profit).map((r, i) => (
                <tr key={r.product} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                  <td className="py-3 px-2">
                    <div className="font-medium text-[#1A1A1A]">{i + 1}. {r.product}</div>
                  </td>
                  <td className="py-3 px-2 text-[#6B5B4D]">{r.category}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-700">{fmt(r.revenue)}</td>
                  <td className="py-3 px-2 text-right font-mono text-[#9C8A6E]">{fmt(r.cost)}</td>
                  <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]">{fmt(r.profit)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={`px-2 py-0.5 rounded font-medium text-xs ${r.margin >= 35 ? "bg-emerald-50 text-emerald-700" : r.margin >= 30 ? "bg-blue-50 text-blue-700" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                      {r.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#FAF7F2] font-medium">
                <td colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider text-[#9C8A6E]">Jami</td>
                <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(totalRev)}</td>
                <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(totalCost)}</td>
                <td className="py-3 px-2 text-right font-mono text-[#C75D3C] text-base" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {fmt(totalProfit)}
                </td>
                <td className="py-3 px-2 text-right font-medium text-emerald-700">{avgMargin.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
