"use client"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { TrendingUp, TrendingDown, Calendar, Download, Package } from "lucide-react"

const MOVEMENTS = [
  { date: "2026-05-02", product: "Choco-Boom 75g", in: 480, out: 124, transfer: 0, return: 4, balance: 1240, change: 352 },
  { date: "2026-05-01", product: "Coca-Cola 1.5L", in: 240, out: 96, transfer: 12, return: 0, balance: 888, change: 132 },
  { date: "2026-04-30", product: "Bonjur 50g", in: 0, out: 48, transfer: 24, return: 0, balance: 240, change: -72 },
  { date: "2026-04-30", product: "Sok Apelsin 1L", in: 120, out: 36, transfer: 0, return: 0, balance: 156, change: 84 },
  { date: "2026-04-29", product: "Pechenye Yubileynoye", in: 60, out: 24, transfer: 0, return: 6, balance: 282, change: 30 },
  { date: "2026-04-28", product: "Voda Premium 1L", in: 0, out: 28, transfer: 12, return: 0, balance: 84, change: -40 },
  { date: "2026-04-28", product: "Choco-Boom 75g", in: 0, out: 96, transfer: 0, return: 0, balance: 888, change: -96 },
  { date: "2026-04-27", product: "Biskvit Triton", in: 60, out: 18, transfer: 0, return: 0, balance: 60, change: 42 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function MovementReportPage() {
  const totalIn = MOVEMENTS.reduce((s, m) => s + m.in, 0)
  const totalOut = MOVEMENTS.reduce((s, m) => s + m.out, 0)
  const totalTransfer = MOVEMENTS.reduce((s, m) => s + m.transfer, 0)
  const totalReturn = MOVEMENTS.reduce((s, m) => s + m.return, 0)

  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Tovar"
      accent="harakati hisoboti"
      description={`${MOVEMENTS.length} ta yozuv · IN: ${fmt(totalIn)} · OUT: ${fmt(totalOut)} · TRANSFER: ${fmt(totalTransfer)} · RETURN: ${fmt(totalReturn)}`}
      actions={
        <>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> 7-kun
          </button>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PremiumCard className="p-5 relative overflow-hidden">
          <TrendingUp className="w-7 h-7 text-emerald-700 mb-2" />
          <div className="text-xs uppercase tracking-wider text-emerald-700 font-medium">Kirim (IN)</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalIn)}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-700" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <TrendingDown className="w-7 h-7 text-[#C75D3C] mb-2" />
          <div className="text-xs uppercase tracking-wider text-[#C75D3C] font-medium">Chiqim (OUT)</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalOut)}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <Package className="w-7 h-7 text-blue-700 mb-2" />
          <div className="text-xs uppercase tracking-wider text-blue-700 font-medium">Transfer</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalTransfer)}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-700" />
        </PremiumCard>
        <PremiumCard className="p-5 relative overflow-hidden">
          <Package className="w-7 h-7 text-violet-700 mb-2" />
          <div className="text-xs uppercase tracking-wider text-violet-700 font-medium">Return</div>
          <div className="text-2xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalReturn)}</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-700" />
        </PremiumCard>
      </div>

      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="HARAKATLAR JURNALI" title="Tafsilot" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-emerald-700">IN</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#C75D3C]">OUT</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-blue-700">Transfer</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-violet-700">Return</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'zgarish</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Balans</th>
              </tr>
            </thead>
            <tbody>
              {MOVEMENTS.map((m, i) => (
                <tr key={i} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                  <td className="py-3 px-2 font-mono text-xs text-[#9C8A6E]">{m.date}</td>
                  <td className="py-3 px-2 font-medium text-[#1A1A1A]">{m.product}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-700">{m.in > 0 ? "+" + fmt(m.in) : "—"}</td>
                  <td className="py-3 px-2 text-right font-mono text-[#C75D3C]">{m.out > 0 ? "−" + fmt(m.out) : "—"}</td>
                  <td className="py-3 px-2 text-right font-mono text-blue-700">{m.transfer > 0 ? "↔" + m.transfer : "—"}</td>
                  <td className="py-3 px-2 text-right font-mono text-violet-700">{m.return > 0 ? "↺" + m.return : "—"}</td>
                  <td className={`py-3 px-2 text-right font-mono font-medium ${m.change >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                    {m.change >= 0 ? "+" : ""}{fmt(m.change)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]">{fmt(m.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
