"use client"
import { useState } from "react"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { Download, Settings2 } from "lucide-react"

const PIVOT_ROWS = ["Tovar", "Postavshik", "Brand", "Kategoriya", "Sklad", "Sana"]
const PIVOT_COLS = ["Sana", "Sklad", "Brand", "Postavshik"]
const PIVOT_VALUES = ["Qoldiq qiymat", "Qoldiq summa", "Sotilgan", "Tushum"]

const SAMPLE_DATA = [
  { tovar: "Choco-Boom 75g", brand: "Choco-Boom", sklad_main: 1240, sklad_sergeli: 824, sklad_bektemir: 196, total: 2260 },
  { tovar: "Coca-Cola 1.5L", brand: "Coca-Cola", sklad_main: 888, sklad_sergeli: 256, sklad_bektemir: 92, total: 1236 },
  { tovar: "Bonjur 50g", brand: "Bonjur", sklad_main: 240, sklad_sergeli: 96, sklad_bektemir: 0, total: 336 },
  { tovar: "Sok Apelsin 1L", brand: "Sok", sklad_main: 156, sklad_sergeli: 48, sklad_bektemir: 24, total: 228 },
  { tovar: "Voda Premium 1L", brand: "Voda", sklad_main: 84, sklad_sergeli: 12, sklad_bektemir: 0, total: 96 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function PivotPage() {
  const [rowField] = useState("Tovar")
  const [colField] = useState("Sklad")
  const [valueField] = useState("Qoldiq qiymat")

  const totalMain = SAMPLE_DATA.reduce((s, r) => s + r.sklad_main, 0)
  const totalSergeli = SAMPLE_DATA.reduce((s, r) => s + r.sklad_sergeli, 0)
  const totalBektemir = SAMPLE_DATA.reduce((s, r) => s + r.sklad_bektemir, 0)
  const grand = totalMain + totalSergeli + totalBektemir

  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Pivot"
      accent="hisobot"
      description={`Multi-dimensional ko'rinish · drag-drop fields · ${SAMPLE_DATA.length} qator × 3 ustun`}
      actions={
        <>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" /> Sozlash
          </button>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PremiumCard className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-3">QATORLAR (ROW)</div>
          <div className="space-y-2">
            {PIVOT_ROWS.map(r => (
              <div key={r} className={`px-3 py-2 rounded-md text-sm cursor-grab ${rowField === r ? "bg-[#C75D3C] text-white font-medium" : "bg-[#FAF7F2] text-[#1A1A1A] border border-[#E8E0D3] hover:border-[#C75D3C]"}`}>
                {r}
              </div>
            ))}
          </div>
        </PremiumCard>
        <PremiumCard className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-3">USTUNLAR (COL)</div>
          <div className="space-y-2">
            {PIVOT_COLS.map(c => (
              <div key={c} className={`px-3 py-2 rounded-md text-sm cursor-grab ${colField === c ? "bg-blue-700 text-white font-medium" : "bg-[#FAF7F2] text-[#1A1A1A] border border-[#E8E0D3] hover:border-blue-700"}`}>
                {c}
              </div>
            ))}
          </div>
        </PremiumCard>
        <PremiumCard className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-3">QIYMAT (VALUE)</div>
          <div className="space-y-2">
            {PIVOT_VALUES.map(v => (
              <div key={v} className={`px-3 py-2 rounded-md text-sm cursor-grab ${valueField === v ? "bg-emerald-700 text-white font-medium" : "bg-[#FAF7F2] text-[#1A1A1A] border border-[#E8E0D3] hover:border-emerald-700"}`}>
                {v}
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow={`${rowField.toUpperCase()} × ${colField.toUpperCase()}`} title={valueField} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <th className="text-left py-3 px-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">{rowField}</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider font-medium text-emerald-700">Asosiy ombor</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider font-medium text-blue-700">Sergeli filial</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider font-medium text-violet-700">Bektemir filial</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider font-medium text-[#C75D3C]">JAMI</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DATA.map(r => (
                <tr key={r.tovar} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                  <td className="py-3 px-3 font-medium text-[#1A1A1A]">{r.tovar}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">{fmt(r.sklad_main)}</td>
                  <td className="py-3 px-3 text-right font-mono text-blue-700">{fmt(r.sklad_sergeli)}</td>
                  <td className="py-3 px-3 text-right font-mono text-violet-700">{fmt(r.sklad_bektemir)}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-[#C75D3C]">{fmt(r.total)}</td>
                </tr>
              ))}
              <tr className="bg-[#FAF7F2] font-medium">
                <td className="py-3 px-3 text-xs uppercase tracking-wider text-[#9C8A6E]">JAMI</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">{fmt(totalMain)}</td>
                <td className="py-3 px-3 text-right font-mono text-blue-700">{fmt(totalSergeli)}</td>
                <td className="py-3 px-3 text-right font-mono text-violet-700">{fmt(totalBektemir)}</td>
                <td className="py-3 px-3 text-right font-mono text-2xl text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {fmt(grand)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
