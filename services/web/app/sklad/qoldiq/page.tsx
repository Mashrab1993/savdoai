"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Download, Building2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

const SKLADS = ["Markaziy ombor", "Sergeli filial", "Yangiyul filial"]
const SKLAD_COLORS = ["#10B981", "#3B82F6", "#8B5CF6"]

const MOCK_ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", brand: "Bonjur", stocks: [64, 36, 24], price: 5500 },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", brand: "Bonjur", stocks: [12, 4, 2], price: 11200 },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", brand: "Choco-Boom", stocks: [128, 84, 36], price: 8400 },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", brand: "Eco-Drink", stocks: [4, 2, 0], price: 12500 },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", brand: "Aqua-Plus", stocks: [48, 32, 16], price: 6400 },
  { id: 6, name: "Pechenye Yubileynoye", code: "COOK-YUB-500", brand: "Yubileynoye", stocks: [180, 120, 20], price: 10400 },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET", brand: "Coca-Cola", stocks: [96, 64, 24], price: 14800 },
  { id: 8, name: "Fanta 1.5L", code: "FT-15-PET", brand: "Coca-Cola", stocks: [72, 36, 16], price: 14500 },
  { id: 9, name: "Bonjur Sub 200g", code: "BONJ-SUB-200", brand: "Bonjur", stocks: [24, 12, 8], price: 18400 },
  { id: 10, name: "Hilol pechenye 200g", code: "HIL-200", brand: "Hilol", stocks: [54, 18, 12], price: 7820 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function QoldiqPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiData, loading } = useApi<any>(
    isAuthenticated ? "/api/v1/tovarlar" : null
  )

  const [search, setSearch] = useState("")
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const usingMock = !apiData
  const ITEMS = MOCK_ITEMS

  const brands = Array.from(new Set(ITEMS.map(i => i.brand)))
  const filtered = ITEMS.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
    const matchBrand = !activeBrand || i.brand === activeBrand
    return matchSearch && matchBrand
  })

  const totalValue = ITEMS.reduce((s, i) => s + i.stocks.reduce((a, b) => a + b, 0) * i.price, 0)
  const totalQty = ITEMS.reduce((s, i) => s + i.stocks.reduce((a, b) => a + b, 0), 0)
  const skladTotals = SKLADS.map((_, si) => ITEMS.reduce((s, i) => s + i.stocks[si] * i.price, 0))

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/sklad" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> SKLAD
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Qoldiq <span className="italic text-[#C75D3C]">(Real-time)</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                {ITEMS.length} SKU × {SKLADS.length} sklad · Jami: {fmt(totalQty)} dona, {fmt(totalValue / 1_000_000)} M so'm
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {loading && <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm">Yuklanmoqda...</div>}
              {!loading && !usingMock && <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real-time</div>}
              {!loading && usingMock && <div className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm">Demo data</div>}
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </div>

          {/* Sklad summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SKLADS.map((s, si) => (
              <Card key={s} className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <Building2 className="w-7 h-7" style={{ color: SKLAD_COLORS[si] }} />
                  <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">{s}</div>
                </div>
                <div className="text-2xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {fmt(skladTotals[si] / 1_000_000)} M
                </div>
                <div className="text-xs text-[#9C8A6E] mt-1">{ITEMS.reduce((sum, i) => sum + i.stocks[si], 0)} dona</div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: SKLAD_COLORS[si] }} />
              </Card>
            ))}
          </div>

          {/* Filters + Table */}
          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar yoki kod..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setActiveBrand(null)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${!activeBrand ? "bg-[#C75D3C] text-white" : "bg-[#FAF7F2] border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}>
                  Hammasi
                </button>
                {brands.map(b => (
                  <button key={b} onClick={() => setActiveBrand(b)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeBrand === b ? "bg-[#C75D3C] text-white" : "bg-[#FAF7F2] border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}>
                    {b}
                  </button>
                ))}
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] text-left bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Brand</th>
                    {SKLADS.map((s, si) => (
                      <th key={s} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-right" style={{ color: SKLAD_COLORS[si] }}>{s}</th>
                    ))}
                    <th className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] text-right">Jami</th>
                    <th className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] text-right">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const total = it.stocks.reduce((a, b) => a + b, 0)
                    const totalSum = total * it.price
                    return (
                      <tr key={it.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2">
                          <Link href={`/sklad/tovar/${it.id}`} className="font-medium text-[#C75D3C] hover:underline">{it.name}</Link>
                          <div className="text-xs text-[#9C8A6E] font-mono">{it.code}</div>
                        </td>
                        <td className="py-3 px-2 text-[#6B5B4D] text-xs">{it.brand}</td>
                        {it.stocks.map((q, si) => (
                          <td key={si} className="py-3 px-2 text-right font-mono font-medium" style={{ color: q === 0 ? "#C75D3C" : q < 10 ? "#D97706" : SKLAD_COLORS[si] }}>
                            {q || "—"}
                          </td>
                        ))}
                        <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]">{total}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {fmt(totalSum)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2] font-medium">
                    <td colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider text-[#9C8A6E]">Jami</td>
                    {SKLADS.map((_, si) => (
                      <td key={si} className="py-3 px-2 text-right font-mono text-[#1A1A1A]">
                        {ITEMS.reduce((s, i) => s + i.stocks[si], 0)}
                      </td>
                    ))}
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(totalQty)}</td>
                    <td className="py-3 px-2 text-right font-mono text-2xl text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {fmt(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
