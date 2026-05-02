"use client"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { Calendar, Download, Plus, Sparkles, TrendingUp, Target } from "lucide-react"

const PLANS = [
  { product: "Choco-Boom 75g", currentStock: 1240, monthlySales: 2840, avgDaily: 95, planQty: 3000, planCost: 27_000_000, supplier: "Cosmo World", priority: "high", recommendation: "Hayit oldi" },
  { product: "Coca-Cola 1.5L", currentStock: 888, monthlySales: 1880, avgDaily: 63, planQty: 2400, planCost: 33_600_000, supplier: "Coca-Cola Co.", priority: "high", recommendation: "Yoz peak" },
  { product: "Voda Premium 1L", currentStock: 84, monthlySales: 840, avgDaily: 28, planQty: 1500, planCost: 6_750_000, supplier: "Aqua Vita", priority: "high", recommendation: "Past zaxira" },
  { product: "Bonjur 50g", currentStock: 240, monthlySales: 540, avgDaily: 18, planQty: 600, planCost: 2_700_000, supplier: "Hi baby", priority: "medium", recommendation: "Standart" },
  { product: "Pechenye Yubileynoye", currentStock: 282, monthlySales: 240, avgDaily: 8, planQty: 300, planCost: 2_520_000, supplier: "GOLD-KEKS", priority: "low", recommendation: "Aralash" },
  { product: "Sok Apelsin 1L", currentStock: 156, monthlySales: 420, avgDaily: 14, planQty: 600, planCost: 6_600_000, supplier: "Cosmo World", priority: "medium", recommendation: "Yoz peak" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const PRIORITY_COLOR: Record<string, string> = { high: "#C75D3C", medium: "#D97706", low: "#9C8A6E" }

export default function PlanProductPage() {
  const totalQty = PLANS.reduce((s, p) => s + p.planQty, 0)
  const totalCost = PLANS.reduce((s, p) => s + p.planCost, 0)

  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Sotib olish"
      accent="rejasi"
      description={`${PLANS.length} ta SKU · jami ${fmt(totalQty)} dona buyurtma · ${fmt(totalCost / 1_000_000)} M so'm`}
      actions={
        <>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> May 2026
          </button>
          <button className="px-3 py-2 rounded-md bg-[#C75D3C] text-white text-sm flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Yangi reja
          </button>
        </>
      }
    >
      <PremiumCard className="p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FCE9DD 0%, #FAF7F2 100%)" }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #C75D3C 0%, #E27B5C 100%)" }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">AI TAVSIYA</div>
            <h3 className="text-xl font-medium text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              Sotuv velosipedi asosida buyurtma
            </h3>
            <p className="text-sm text-[#6B5B4D] mt-2">
              AI 30-kunlik o'rtacha sotish asosida har SKU uchun buyurtma miqdori taklif qiladi.
              <span className="font-medium text-[#C75D3C]"> Voda Premium</span> juda past zaxirada — birinchi navbatda buyurtma berish kerak.
            </p>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="MAY 2026" title="Sotib olish rejasi" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Hozirgi</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Oylik sotuv</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Avg/kun</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#C75D3C]">Reja qiymat</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#C75D3C]">Reja summa</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Postavshik</th>
                <th className="text-center py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Pri</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.sort((a, b) => (a.currentStock / a.avgDaily) - (b.currentStock / b.avgDaily)).map(p => (
                <tr key={p.product} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                  <td className="py-3 px-2 font-medium text-[#1A1A1A]">{p.product}</td>
                  <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(p.currentStock)}</td>
                  <td className="py-3 px-2 text-right font-mono text-[#9C8A6E]">{fmt(p.monthlySales)}</td>
                  <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{p.avgDaily}</td>
                  <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]">{fmt(p.planQty)}</td>
                  <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {fmt(p.planCost / 1000)}k
                  </td>
                  <td className="py-3 px-2 text-[#6B5B4D]">{p.supplier}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-xs font-medium px-2 py-0.5 rounded uppercase" style={{ background: `${PRIORITY_COLOR[p.priority]}15`, color: PRIORITY_COLOR[p.priority] }}>
                      {p.priority}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#FAF7F2] font-medium">
                <td colSpan={4} className="py-3 px-2 text-xs uppercase tracking-wider text-[#9C8A6E]">Jami</td>
                <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(totalQty)}</td>
                <td className="py-3 px-2 text-right font-mono text-2xl text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {fmt(totalCost)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
