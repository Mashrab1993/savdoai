"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, TrendingUp, TrendingDown } from "lucide-react"
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

export default function PriceHistoryPage() {
  const [search, setSearch] = useState("")
  const filtered = ITEMS.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
  const increases = ITEMS.filter(i => i.change > 0).length
  const decreases = ITEMS.filter(i => i.change < 0).length

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">История изменения цен</h1>
          <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-sm font-semibold text-emerald-700 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> 05/01/2026 - 05/02/2026
          </button>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {["Тип цен фикст. кондитерская", "Категория поставшика", "Категория продукта"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700 truncate">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Подорожало</div>
            <div className="text-2xl font-bold mt-1">{increases}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <TrendingDown className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Подешевело</div>
            <div className="text-2xl font-bold mt-1">{decreases}</div>
          </Card>
          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="text-xs font-bold text-slate-700">Без изменений</div>
            <div className="text-2xl font-bold mt-1">{ITEMS.length - increases - decreases}</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">Поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Товар ИД</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Код товара</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Категория</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Наименование</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Стар. цена</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Нов. цена</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Изменение %</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">{it.id}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-400">{it.code}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{`SKU${it.id.toString().padStart(4, "0")}`}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-xs text-slate-500">{it.category}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{it.name}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-500 line-through">{fmt(it.oldPrice)}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold">{fmt(it.newPrice)}</td>
                    <td className={`border border-slate-300 py-1.5 px-2 text-right font-mono font-bold ${it.change > 0 ? "text-rose-700" : it.change < 0 ? "text-emerald-700" : "text-slate-400"}`}>
                      {it.change === 0 ? "—" : (it.change > 0 ? "+" : "") + it.change.toFixed(2) + "%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Показано {filtered.length} из 1455</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-300 rounded">Пред..</button>
              <button className="px-2 py-1 border border-slate-300 rounded">След..</button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
