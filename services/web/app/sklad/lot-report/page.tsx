"use client"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { Calendar, Download, Package, AlertTriangle } from "lucide-react"

const LOTS = [
  { id: "B-2026-04-A", product: "Bonjur Молочный 50g", supplier: "Hi baby", arrived: "2026-04-12", expires: "2026-05-04", qty: 48, soldQty: 12, remaining: 36, daysLeft: 2, status: "critical" },
  { id: "B-2026-04-C", product: "Choco-Boom 75g", supplier: "Cosmo World", arrived: "2026-04-15", expires: "2026-09-05", qty: 480, soldQty: 296, remaining: 184, daysLeft: 126, status: "ok" },
  { id: "B-2026-03-C", product: "Pechenye Yubileynoye", supplier: "GOLD-KEKS", arrived: "2026-03-10", expires: "2026-05-08", qty: 60, soldQty: 12, remaining: 48, daysLeft: 6, status: "warning" },
  { id: "B-2026-04-E", product: "Coca-Cola 1.5L", supplier: "Coca-Cola Co.", arrived: "2026-04-20", expires: "2026-08-20", qty: 240, soldQty: 144, remaining: 96, daysLeft: 110, status: "ok" },
  { id: "B-2026-02-B", product: "Sok Apelsin 1L", supplier: "Cosmo World", arrived: "2026-02-15", expires: "2026-05-12", qty: 120, soldQty: 84, remaining: 36, daysLeft: 10, status: "warning" },
  { id: "B-2026-04-D", product: "Voda Premium 1L", supplier: "Aqua Vita", arrived: "2026-04-25", expires: "2026-05-15", qty: 144, soldQty: 72, remaining: 72, daysLeft: 13, status: "warning" },
  { id: "B-2026-03-A", product: "Biskvit Triton 150g", supplier: "Утёнок", arrived: "2026-03-22", expires: "2026-05-22", qty: 60, soldQty: 42, remaining: 18, daysLeft: 20, status: "warning" },
  { id: "B-2025-12-F", product: "Chay Dilmah", supplier: "Dilmah Tea", arrived: "2025-12-15", expires: "2026-06-15", qty: 36, soldQty: 24, remaining: 12, daysLeft: 44, status: "ok" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const STATUS_COLOR: Record<string, string> = {
  critical: "#C75D3C",
  warning: "#D97706",
  ok: "#10B981",
}

export default function LotReportPage() {
  const totalLots = LOTS.length
  const criticalLots = LOTS.filter(l => l.status === "critical").length
  const warningLots = LOTS.filter(l => l.status === "warning").length
  const totalRemaining = LOTS.reduce((s, l) => s + l.remaining, 0)

  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Partiyalar"
      accent="(LOT) hisoboti"
      description={`${totalLots} ta partiya · ${criticalLots} kritik · ${warningLots} ogoh · ${fmt(totalRemaining)} dona qoldiq · FEFO tartibi`}
      actions={
        <>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> 02.05.2026
          </button>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PremiumCard className="p-5 relative overflow-hidden">
          <Package className="w-7 h-7 text-[#9C8A6E] mb-2" />
          <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Jami partiya</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {totalLots}
          </div>
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <AlertTriangle className="w-7 h-7 text-[#C75D3C] mb-2" />
          <div className="text-xs uppercase tracking-wider text-[#C75D3C] font-medium">Kritik (≤3 kun)</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {criticalLots}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <AlertTriangle className="w-7 h-7 text-[#D97706] mb-2" />
          <div className="text-xs uppercase tracking-wider text-[#D97706] font-medium">Ogoh (≤30)</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {warningLots}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D97706]" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <Package className="w-7 h-7 text-emerald-700 mb-2" />
          <div className="text-xs uppercase tracking-wider text-emerald-700 font-medium">Qoldiq</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
            {fmt(totalRemaining)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700" />
        </PremiumCard>
      </div>

      {/* Table */}
      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="FEFO TARTIBI (oldin tugaydigan)" title="Partiyalar ro'yxati" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Partiya ID</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Postavshik</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kelgan</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tugash</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qoldiq</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kun</th>
                <th className="text-center py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
              </tr>
            </thead>
            <tbody>
              {[...LOTS].sort((a, b) => a.daysLeft - b.daysLeft).map(lot => (
                <tr key={lot.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                  <td className="py-3 px-2 font-mono text-xs text-[#C75D3C]">{lot.id}</td>
                  <td className="py-3 px-2 font-medium text-[#1A1A1A]">{lot.product}</td>
                  <td className="py-3 px-2 text-[#6B5B4D]">{lot.supplier}</td>
                  <td className="py-3 px-2 font-mono text-xs text-[#9C8A6E]">{lot.arrived}</td>
                  <td className="py-3 px-2 font-mono text-xs text-[#1A1A1A]">{lot.expires}</td>
                  <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]">{fmt(lot.remaining)} / {fmt(lot.qty)}</td>
                  <td className="py-3 px-2 text-right font-mono font-medium" style={{ color: STATUS_COLOR[lot.status] }}>
                    {lot.daysLeft}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${STATUS_COLOR[lot.status]}15`, color: STATUS_COLOR[lot.status] }}>
                      {lot.status === "critical" ? "🔴 KRITIK" : lot.status === "warning" ? "🟡 OGOH" : "🟢 OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
