"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"

const ITEMS = [
  { id: 1, code: "0_1", category: "Trichup·Maска·Маслo·Крем·Кондиционер для волос", name: "MILKY", oldPrice: 5_500, newPrice: 5_800, change: 5.5 },
  { id: 2, code: "0_2", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "MK02", oldPrice: 12_400, newPrice: 12_400, change: 0 },
  { id: 3, code: "0_3", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "ПЕЧЕНЬЕ", oldPrice: 8_400, newPrice: 8_900, change: 5.95 },
  { id: 4, code: "0_4", category: "ПЕЧЕНЬЕ", name: "MS00 SHOKOLADNIY в коробке", oldPrice: 124_000, newPrice: 132_000, change: 6.45 },
  { id: 5, code: "0_5", category: "ПЕЧЕНЬЕ", name: "SLADUS", oldPrice: 8_400, newPrice: 8_400, change: 0 },
  { id: 6, code: "0_6", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "MK01 Kerasilk Hair Conditioner — Olive Cream and Vitamin", oldPrice: 14_800, newPrice: 15_400, change: 4.05 },
  { id: 7, code: "0_7", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "Trichup Маска Масло Крем для волос", oldPrice: 22_400, newPrice: 22_400, change: 0 },
  { id: 8, code: "0_8", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "Масло маска Tri 1L kelovaya healthy Long & Strong oil", oldPrice: 38_400, newPrice: 36_800, change: -4.16 },
  { id: 9, code: "0_9", category: "ПЕЧЕНЬЕ", name: "Кондиционер от tara сильнокожный (HV) бальзам", oldPrice: 18_400, newPrice: 19_200, change: 4.35 },
  { id: 10, code: "0_10", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "M.K. COLOR в коробке (PI)", oldPrice: 24_800, newPrice: 26_400, change: 6.45 },
  { id: 11, code: "0_11", category: "ПЕЧЕНЬЕ", name: "SLADUS", oldPrice: 8_400, newPrice: 8_400, change: 0 },
  { id: 12, code: "0_12", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "TRichup Premium Keratin Hair Treatment", oldPrice: 42_400, newPrice: 44_800, change: 5.66 },
  { id: 13, code: "0_13", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "Maska Hair Serum 200ml For Damaged Hair Treatment", oldPrice: 18_400, newPrice: 19_800, change: 7.61 },
  { id: 14, code: "0_14", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "DR.RASHEL Маска для волос", oldPrice: 12_800, newPrice: 13_400, change: 4.69 },
  { id: 15, code: "0_15", category: "Trichup·Маска·Маслo·Крем·Кондиционер для волос", name: "DR.RASHEL Маска ассорти", oldPrice: 12_800, newPrice: 13_200, change: 3.13 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function PriceHistoryPage() {
  const [search, setSearch] = useState("")
  const filtered = ITEMS.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
  const increases = ITEMS.filter(i => i.change > 0).length
  const decreases = ITEMS.filter(i => i.change < 0).length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                История изменения <span className="italic text-[#C75D3C]">цен</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{ITEMS.length} ta tovar · {increases} podorojalo · {decreases} podeshevelo</p>
            </div>
            <button className="px-3 py-2 border border-[#C75D3C] bg-[#F5E5D6] rounded-md text-sm font-medium text-[#C75D3C] flex items-center gap-1">
              <Calendar className="w-4 h-4" /> 05/01/2026 - 05/02/2026
            </button>
          </div>

          <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {["Тип цен фикст. кондитерская", "Категория поставшика", "Категория продукта"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-white">
                  <span className="text-[#6B5B4D] truncate">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>Подорожало</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{increases}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">narxlar oshgan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingDown className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#10B981" }}>Подешевело</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{decreases}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">narxlar tushgan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Minus className="w-5 h-5 mb-2" style={{ color: "#9C8A6E" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#9C8A6E" }}>Без изменений</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{ITEMS.length - increases - decreases}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">o'zgarishsiz</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#9C8A6E" }} />
            </Card>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-[#6B5B4D]">Поиск:</span>
              <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48 border-[#E8E0D3]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Товар ИД</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Код товара</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Категория</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Наименование</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Стар. цена</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Нов. цена</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Изменение %</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => (
                    <tr key={it.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{it.id}</td>
                      <td className="py-2 px-2 font-mono tabular-nums text-[#9C8A6E]">{it.code}</td>
                      <td className="py-2 px-2 font-mono tabular-nums text-[#1A1A1A]">{`SKU${it.id.toString().padStart(4, "0")}`}</td>
                      <td className="py-2 px-2 text-xs text-[#9C8A6E]">{it.category}</td>
                      <td className="py-2 px-2 text-[#1A1A1A]">{it.name}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-[#9C8A6E] line-through">{fmt(it.oldPrice)}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-medium text-[#1A1A1A]">{fmt(it.newPrice)}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-medium" style={{ color: it.change > 0 ? "#C75D3C" : it.change < 0 ? "#047857" : "#9C8A6E" }}>
                        {it.change === 0 ? "—" : (it.change > 0 ? "+" : "") + it.change.toFixed(2) + "%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#9C8A6E]">
              <span>Показано {filtered.length} из 1455</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 border border-[#E8E0D3] rounded text-[#6B5B4D] hover:bg-[#FAF7F2]">Пред..</button>
                <button className="px-2 py-1 border border-[#E8E0D3] rounded text-[#6B5B4D] hover:bg-[#FAF7F2]">След..</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
