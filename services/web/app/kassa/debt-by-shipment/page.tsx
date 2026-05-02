"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, RefreshCw, Download, Search } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { id: 1, code: "0_1", client: "ИЧЕ ВАЗАЙИК", company: "MCHJ Akmal Mr", buckets: [3_000_000, 0, 0, 0, 0, 0], total: 3_000_000 },
  { id: 2, code: "0_5_2_5", client: "Marin Бараки", company: "Optom Mar.", buckets: [1_080_000, 0, 0, 0, 0, 0], total: 1_080_000 },
  { id: 3, code: "0_4_4_3_5", client: "PRO Mar.", company: "Sale (СЛАДУС)", buckets: [0, 0, 0, 0, 0, 0], total: 0 },
  { id: 4, code: "0_3_3_2_3", client: "Чехав Чехав", company: "ASGAR.", buckets: [0, 0, 0, 0, 0, 0], total: 0 },
  { id: 5, code: "0_3_4_5_2_2", client: "Maja Мухтаров", company: "GORM.", buckets: [0, 0, 0, 0, 0, 0], total: 0 },
  { id: 6, code: "0_3_4_2_3", client: "Aka VAR.AR Optom", company: "ОРТОИЛ AKA", buckets: [9_840_000, 0, 0, 0, 0, 0], total: 9_840_000 },
  { id: 7, code: "0_4_3_3", client: "Sharyn Aka", company: "Magazin", buckets: [0, 8_400_000, 0, 0, 0, 0], total: 8_400_000 },
  { id: 8, code: "0_3_2_2_3", client: "Jamshid Aka", company: "Magazin", buckets: [0, 0, 7_840_000, 0, 0, 0], total: 7_840_000 },
  { id: 9, code: "0_3_2_2_3", client: "BOBURJON", company: "ROBO BOBO Magazin", buckets: [0, 0, 0, 7_842_000, 0, 0], total: 7_842_000 },
  { id: 10, code: "0_4_2_3", client: "Sirojiddin Aka", company: "AKA-MAGAZIN", buckets: [0, 0, 0, 0, 7_842_000, 0], total: 7_842_000 },
]

const BUCKETS = [
  { label: "0-7 дней", color: "emerald" },
  { label: "8-15 дней", color: "lime" },
  { label: "16-30 дней", color: "amber" },
  { label: "31-50 дней", color: "orange" },
  { label: "51-90 дней", color: "rose" },
  { label: "Свыше 90 дней", color: "red" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function DebtByShipmentPage() {
  const [search, setSearch] = useState("")
  const filtered = ROWS.filter(r => !search || r.client.toLowerCase().includes(search.toLowerCase()))
  const bucketTotals = BUCKETS.map((_, bi) => filtered.reduce((s, r) => s + r.buckets[bi], 0))
  const grandTotal = filtered.reduce((s, r) => s + r.total, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Задолженность клиентов (по отгрузке)</h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {["Категория клиента", "Территория", "Агент", "Экспедитор", "Направление продаж"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> май 2 - май 2 ▾
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="gap-1"><RefreshCw className="w-3 h-3" /> Сбросить фильтр</Button>
            <Button size="sm" className="gap-1"><Download className="w-3 h-3" /> Загрузить</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">Быстрый поиск:</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
            </div>
            <span className="ml-auto text-sm text-slate-600">Экспорт в Excel</span>
            <Button size="sm" variant="outline" className="gap-1"><Download className="w-3 h-3" /></Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 align-bottom">ID клиента</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 align-bottom min-w-[120px] text-left">Название клиента</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 align-bottom min-w-[120px] text-left">Название фирмы</th>
                  <th colSpan={6} className="border border-slate-300 py-2 px-2 bg-rose-50">Сроки по погашению срока</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 align-bottom bg-emerald-50 min-w-[100px]">Общий долг</th>
                </tr>
                <tr className="bg-slate-100 text-[10px]">
                  {BUCKETS.map(b => (
                    <th key={b.label} className={`border border-slate-300 py-1.5 px-2 bg-${b.color}-50`}>{b.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-500">{r.code}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-semibold">{r.client}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-600">{r.company}</td>
                    {r.buckets.map((v, bi) => (
                      <td key={bi} className={`border border-slate-300 py-1.5 px-2 text-right font-mono ${v > 0 ? `text-${BUCKETS[bi].color}-700 font-bold` : "text-slate-300"}`}>
                        {v > 0 ? fmt(v) : "0.00"}
                      </td>
                    ))}
                    <td className={`border border-slate-300 py-1.5 px-2 text-right font-mono font-bold ${r.total > 0 ? "text-rose-700" : "text-slate-300"}`}>
                      {fmt(r.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-slate-300 py-2 px-2">Итог</td>
                  {bucketTotals.map((v, bi) => (
                    <td key={bi} className={`border border-slate-300 py-2 px-2 text-right font-mono text-${BUCKETS[bi].color}-800`}>
                      {fmt(v)}
                    </td>
                  ))}
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-800">{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
