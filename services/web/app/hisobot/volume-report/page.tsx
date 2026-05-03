"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, RefreshCw } from "lucide-react"
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
const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function VolumeReportPage() {
  const [search, setSearch] = useState("")
  const filtered = ITEMS.filter(i => !search || i.artikul.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()))
  const totalQty = ITEMS.reduce((s, i) => s + i.qty, 0)
  const totalBlocks = ITEMS.reduce((s, i) => s + i.qty * i.block, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Volume <span className="italic text-[#C75D3C]">otchet</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Tovarlar bo'yicha hajm hisobot · {ITEMS.length} ta SKU</p>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {["Категория продукта", "Отгружен, Доставлен", "Тип цены", "Группа товаров", "Территория", "Сегменты клиентов"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-[#FAF7F2]">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
              <button className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs flex items-center justify-between bg-[#FAF7F2]">
                <span className="text-[#6B5B4D]">Все товары</span><span className="text-[#9C8A6E]">▾</span>
              </button>
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Дата отгрузки ▾
              </button>
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> май 1 — май 3 ▾
              </button>
              <Button size="sm" className="gap-1 border-[#E8E0D3] text-[#6B5B4D]" variant="outline"><RefreshCw className="w-3 h-3" /> Сбросить</Button>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <button className="px-3 py-1.5 border border-[#C75D3C] text-[#C75D3C] rounded text-xs font-medium">Только проданные</button>
              <button className="px-3 py-1.5 border border-[#E8E0D3] text-[#6B5B4D] rounded text-xs">Показать все</button>
              <button className="px-3 py-1.5 border border-[#E8E0D3] text-[#6B5B4D] rounded text-xs">По 20</button>
              <span className="ml-auto text-xs text-[#9C8A6E]">Поиск:</span>
              <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48 border-[#E8E0D3]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-12">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Код</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU код</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Артикул</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Название</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Блок</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Кол-во</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Вес</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => (
                    <tr key={it.idx} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{it.idx}</td>
                      <td className="py-2 px-2 font-mono tabular-nums text-[#9C8A6E]">{it.code}</td>
                      <td className="py-2 px-2 font-mono tabular-nums text-[#6B5B4D]">{it.sku}</td>
                      <td className="py-2 px-2">
                        <Link href={`/sklad/tovar/${it.idx}`} className="text-[#C75D3C] hover:underline font-medium">{it.artikul}</Link>
                      </td>
                      <td className="py-2 px-2 text-[#6B5B4D]">{it.brand}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{it.block}</td>
                      <td className={`py-2 px-2 text-right font-mono tabular-nums ${it.qty > 0 ? "font-medium text-emerald-700" : "text-[#9C8A6E]"}`}>{it.qty || "0"}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">{it.weight || "0"}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t-2 border-[#E8E0D3]">
                    <td colSpan={6} className="py-3 px-2 text-center text-[#1A1A1A]" style={SERIF}>Общее</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{fmt(totalQty)}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(totalBlocks)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#9C8A6E]">
              <span>1 — 1088 / 1088</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 border border-[#E8E0D3] rounded text-[#6B5B4D]">Пред.</button>
                <button className="px-2 py-1 border border-[#E8E0D3] rounded text-[#6B5B4D]">След.</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
