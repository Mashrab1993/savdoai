"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, RefreshCw } from "lucide-react"
import Link from "next/link"

const ITEMS = [
  { idx: 1, code: "0_1", sku: "BS01", artikul: "GANGAALI Karol", brand: "GANGAALI", block: 24, qty: 0, weight: 0 },
  { idx: 2, code: "0_2", sku: "BS02", artikul: "Молочка зеленая", brand: "MILKY", block: 24, qty: 0, weight: 0 },
  { idx: 3, code: "0_3", sku: "BS03", artikul: "SLADUS", brand: "SLADUS", block: 12, qty: 8, weight: 0 },
  { idx: 4, code: "0_4", sku: "BS04", artikul: "ERFIBLES", brand: "ERFIBLES", block: 24, qty: 0, weight: 0 },
  { idx: 5, code: "0_5", sku: "BS05", artikul: "ECO_бутилчик", brand: "ECO", block: 12, qty: 0, weight: 0 },
  { idx: 6, code: "0_6", sku: "BS06", artikul: "BAKER", brand: "BAKER", block: 24, qty: 4, weight: 0 },
  { idx: 7, code: "0_7", sku: "BS07", artikul: "EM CANDY", brand: "EM", block: 48, qty: 0, weight: 0 },
  { idx: 8, code: "0_8", sku: "BS08", artikul: "HILOL", brand: "HILOL", block: 24, qty: 6, weight: 0 },
  { idx: 9, code: "0_9", sku: "BS09", artikul: "Choco_Boom", brand: "CHOCO", block: 24, qty: 0, weight: 0 },
  { idx: 10, code: "0_10", sku: "BS10", artikul: "TRUFFLES_COCOA", brand: "TRUFFLES", block: 12, qty: 0, weight: 0 },
  { idx: 11, code: "0_11", sku: "BS11", artikul: "CASA", brand: "CASA", block: 24, qty: 0, weight: 0 },
  { idx: 12, code: "0_12", sku: "BS12", artikul: "GENIE", brand: "GENIE", block: 12, qty: 0, weight: 0 },
  { idx: 13, code: "0_13", sku: "BS13", artikul: "ESF__shokolad", brand: "ESF", block: 48, qty: 0, weight: 0 },
  { idx: 14, code: "0_14", sku: "BS14", artikul: "PERFECT", brand: "PERFECT", block: 24, qty: 0, weight: 0 },
  { idx: 15, code: "0_15", sku: "BS15", artikul: "HALL_SAKER", brand: "HALL", block: 24, qty: 0, weight: 0 },
  { idx: 16, code: "0_16", sku: "BS16", artikul: "PRIMA Shokolad", brand: "PRIMA", block: 24, qty: 0, weight: 0 },
  { idx: 17, code: "0_17", sku: "BS17", artikul: "PRIMA_Yashil", brand: "PRIMA", block: 12, qty: 0, weight: 0 },
  { idx: 18, code: "0_18", sku: "BS18", artikul: "LENOR", brand: "LENOR", block: 6, qty: 0, weight: 0 },
  { idx: 19, code: "0_19", sku: "BS19", artikul: "M.Munoor.Foryur", brand: "MUNOOR", block: 12, qty: 0, weight: 0 },
  { idx: 20, code: "0_20", sku: "BS20", artikul: "PERSIL", brand: "PERSIL", block: 6, qty: 0, weight: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function VolumeReportPage() {
  const [search, setSearch] = useState("")
  const filtered = ITEMS.filter(i => !search || i.artikul.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()))
  const totalQty = ITEMS.reduce((s, i) => s + i.qty, 0)
  const totalBlocks = ITEMS.reduce((s, i) => s + i.qty * i.block, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Отчет — продажи по товарам</h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {["Категория продукта", "Отгружен, Доставлен", "Тип цены", "Группа товаров", "Территория", "Сегменты клиентов"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
            <button className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs flex items-center justify-between">
              <span>Все товары</span><span className="text-slate-400">▾</span>
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Дата отгрузки ▾
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> май 1 — май 3 ▾
            </button>
            <Button size="sm" className="gap-1"><RefreshCw className="w-3 h-3" /> Сбросить</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <button className="px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded text-xs">Только проданные</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Показать все</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">По 2 0</button>
            <span className="ml-auto text-xs text-slate-500">Поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Код</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">SKU код</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Артикул</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Название</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Блок</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кол-во</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Вес</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => (
                  <tr key={it.idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-slate-400">{it.idx}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-500">{it.code}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-600">{it.sku}</td>
                    <td className="border border-slate-300 py-1.5 px-2">
                      <Link href={`/sklad/tovar/${it.idx}`} className="text-emerald-700 hover:underline font-semibold">{it.artikul}</Link>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-600">{it.brand}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{it.block}</td>
                    <td className={`border border-slate-300 py-1.5 px-2 text-right font-mono ${it.qty > 0 ? "font-bold text-emerald-700" : "text-slate-300"}`}>{it.qty || "0"}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-400">{it.weight || "0"}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={6} className="border border-slate-300 py-2 px-2 text-center">Общее</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{fmt(totalQty)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(totalBlocks)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - 1 0 8 8 / 1 0 8 8</span>
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
