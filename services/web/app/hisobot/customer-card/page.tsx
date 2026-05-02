"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Building2, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { id: 1, name: "Asia Optom Market", inn: "302134987", agent: "Nurmatov A.", region: "Sergeli", visits: 28, orders: 84, revenue: 142_800_000, avgOrder: 1_700_000, lastOrder: "2026-04-30", debt: 18_500_000 },
  { id: 2, name: "Globus Plus", inn: "302456789", agent: "Rasulov B.", region: "Markaz", visits: 22, orders: 62, revenue: 98_600_000, avgOrder: 1_590_000, lastOrder: "2026-04-28", debt: 12_300_000 },
  { id: 3, name: "Mega Skidka Bozor", inn: "302789012", agent: "Yusupov D.", region: "Buxoro", visits: 18, orders: 56, revenue: 84_200_000, avgOrder: 1_503_000, lastOrder: "2026-04-25", debt: 6_400_000 },
  { id: 4, name: "Optom Tovar Service", inn: "302890123", agent: "Karimov S.", region: "Yashnobod", visits: 14, orders: 48, revenue: 72_400_000, avgOrder: 1_508_000, lastOrder: "2026-04-22", debt: 8_900_000 },
  { id: 5, name: "Lider Optom", inn: "302345678", agent: "Nurmatov A.", region: "Sergeli", visits: 12, orders: 42, revenue: 58_600_000, avgOrder: 1_395_000, lastOrder: "2026-04-20", debt: 2_800_000 },
  { id: 6, name: "Sharq Magazin", inn: "302901234", agent: "Karimov S.", region: "Yashnobod", visits: 8, orders: 36, revenue: 42_400_000, avgOrder: 1_177_000, lastOrder: "2026-04-15", debt: 4_200_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function CustomerCardPage() {
  const [search, setSearch] = useState("")
  const filtered = ROWS.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue = ROWS.reduce((s, r) => s + r.revenue, 0)
  const totalDebt = ROWS.reduce((s, r) => s + r.debt, 0)
  const totalVisits = ROWS.reduce((s, r) => s + r.visits, 0)
  const totalOrders = ROWS.reduce((s, r) => s + r.orders, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Карточка клиента — детальный отчёт</h1>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient..." className="pl-9" />
            </div>
            {["Агент", "Территория", "Категория клиента"].map(f => (
              <button key={f} className="px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center gap-1">
                <span>{f}</span><span className="text-slate-400">▾</span>
              </button>
            ))}
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> май 2 ▾
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Общая выручка</div>
            <div className="text-xl font-bold mt-1">{fmt(totalRevenue / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Building2 className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Заказы</div>
            <div className="text-xl font-bold mt-1">{totalOrders}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Building2 className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Visit'ы</div>
            <div className="text-xl font-bold mt-1">{totalVisits}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Долги</div>
            <div className="text-xl font-bold mt-1">{fmt(totalDebt / 1_000_000)} M</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[200px]">Клиент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИНН</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Регион</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Visit</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Заказы</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Выручка</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Средний</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Последний</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Долг</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 py-2 px-2">
                      <Link href={`/klientlar/${r.id}`} className="font-semibold text-emerald-700 hover:underline">{r.name}</Link>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-mono">{r.inn}</td>
                    <td className="border border-slate-300 py-2 px-2 text-slate-700">{r.agent}</td>
                    <td className="border border-slate-300 py-2 px-2 text-slate-700">{r.region}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{r.visits}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{r.orders}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(r.revenue)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(r.avgOrder)}</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono text-xs">{r.lastOrder}</td>
                    <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${r.debt > 0 ? "text-rose-700" : "text-slate-400"}`}>
                      {r.debt > 0 ? fmt(r.debt) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="border border-slate-300 py-2 px-2">Итого: {filtered.length} клиентов</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{totalVisits}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{totalOrders}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{fmt(totalRevenue)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(Math.round(totalRevenue / totalOrders))}</td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">{fmt(totalDebt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
