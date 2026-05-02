"use client"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { Search, Download, Building2 } from "lucide-react"

const CLIENTS = [
  { id: 1024, name: "Salom Magazin №1", agent: "Babadjanova N.", region: "Toshkent — Yashnobod", products: ["Choco-Boom × 84", "Coca-Cola × 36", "Bonjur × 24"], totalQty: 144, totalValue: 2_840_000 },
  { id: 1058, name: "Bona Магазин", agent: "Berdiyev R.", region: "Toshkent — Sergeli", products: ["Pechenye × 48", "Sok × 24", "Choco-Boom × 36"], totalQty: 108, totalValue: 1_840_000 },
  { id: 1142, name: "Дастархон Сервис", agent: "Sayitqulov M.", region: "Toshkent — M.Ulug'bek", products: ["Coca-Cola × 60", "Voda × 36", "Bonjur × 48"], totalQty: 144, totalValue: 2_120_000 },
  { id: 1224, name: "Гулямов Маркет", agent: "ДАВЛАТ", region: "Toshkent — Bektemir", products: ["Choco-Boom × 96", "Pechenye × 72"], totalQty: 168, totalValue: 1_960_000 },
  { id: 1389, name: "Ali Ake Магазин", agent: "BORIEV M.", region: "Toshkent — Yashnobod", products: ["Sok × 48", "Voda × 24"], totalQty: 72, totalValue: 980_000 },
  { id: 1502, name: "Турсун Ake Магазин", agent: "BORIEV M.", region: "Toshkent — Mirzo", products: ["Choco-Boom × 60", "Bonjur × 36", "Coca-Cola × 24"], totalQty: 120, totalValue: 1_640_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientOutletPage() {
  const totalValue = CLIENTS.reduce((s, c) => s + c.totalValue, 0)
  const totalQty = CLIENTS.reduce((s, c) => s + c.totalQty, 0)

  return (
    <PremiumPage
      backLink={{ href: "/klientlar", label: "KLIENTLAR" }}
      title="Klient"
      accent="qoldiqlari"
      description={`${CLIENTS.length} ta klient · ${fmt(totalQty)} dona qoldiq · ${fmt(totalValue / 1_000_000)} M so'm`}
      actions={
        <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Excel
        </button>
      }
    >
      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="TORGOVAYA TOCHKA" title="Klient sotmagan tovarlar" />
        <div className="space-y-3">
          {CLIENTS.map(c => (
            <div key={c.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D3] hover:border-[#C75D3C]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-[#E8E0D3]">
                <Building2 className="w-6 h-6 text-[#9C8A6E]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[#1A1A1A]">{c.name}</span>
                  <span className="text-xs text-[#9C8A6E]">#{c.id}</span>
                </div>
                <div className="text-xs text-[#6B5B4D] mb-2">{c.agent} · {c.region}</div>
                <div className="flex flex-wrap gap-2">
                  {c.products.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-white border border-[#E8E0D3] text-[#6B5B4D]">{p}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Qoldiq</div>
                <div className="text-xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {fmt(c.totalQty)}
                </div>
                <div className="text-sm font-medium text-[#C75D3C]">{fmt(c.totalValue)} so'm</div>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
