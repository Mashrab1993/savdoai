"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRightLeft, History, Calendar } from "lucide-react"
import Link from "next/link"

const KASSY = [
  { name: "Основная касса", cash: 82_483_325_766, bezna: 5_676_021_090, usd: 70_000, transfer: 2_501_469_215 },
  { name: "Sergeli filial касса", cash: 6_240_000, bezna: 1_240_000_000, usd: 0, transfer: 800_000_000 },
  { name: "Yangiyul filial касса", cash: 2_180_000, bezna: 480_000_000, usd: 0, transfer: 240_000_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function CashboxBalansPage() {
  const [date, setDate] = useState("2026-05-02")

  const totals = KASSY.reduce((acc, k) => ({
    cash: acc.cash + k.cash,
    bezna: acc.bezna + k.bezna,
    usd: acc.usd + k.usd,
    transfer: acc.transfer + k.transfer,
  }), { cash: 0, bezna: 0, usd: 0, transfer: 0 })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Остатки денежных средств</h1>
          <Button variant="outline" className="gap-2"><History className="w-4 h-4" /> История перемещений</Button>
          <button className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white flex items-center gap-1">
            <Calendar className="w-4 h-4" /> {date}
          </button>
        </div>

        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"><ArrowRightLeft className="w-4 h-4" /> Перемещение между кассами</Button>

        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 py-3 px-4 text-left font-bold text-slate-700">Касса</th>
                <th className="border border-slate-300 py-3 px-4 text-left font-bold text-slate-700">Остатки денежных средств</th>
                <th className="border border-slate-300 py-3 px-4 text-left font-bold text-slate-700">Наличный сум</th>
                <th className="border border-slate-300 py-3 px-4 text-left font-bold text-slate-700">Безналичный сум</th>
                <th className="border border-slate-300 py-3 px-4 text-left font-bold text-slate-700">Доллар США</th>
                <th className="border border-slate-300 py-3 px-4 text-left font-bold text-slate-700">Перечесления</th>
              </tr>
            </thead>
            <tbody>
              {KASSY.map(k => {
                const total = k.cash + k.bezna + k.transfer
                return (
                  <tr key={k.name} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-3 px-4 font-semibold">{k.name}</td>
                    <td className="border border-slate-300 py-3 px-4 font-mono font-bold text-emerald-700">{fmt(total)}</td>
                    <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(k.cash)}</td>
                    <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(k.bezna)}</td>
                    <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(k.usd)}</td>
                    <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(k.transfer)}</td>
                  </tr>
                )
              })}
              <tr className="bg-slate-100 font-bold">
                <td className="border border-slate-300 py-3 px-4">Итого</td>
                <td className="border border-slate-300 py-3 px-4 font-mono text-emerald-800">{fmt(totals.cash + totals.bezna + totals.transfer)}</td>
                <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(totals.cash)}</td>
                <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(totals.bezna)}</td>
                <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(totals.usd)}</td>
                <td className="border border-slate-300 py-3 px-4 font-mono">{fmt(totals.transfer)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700 mb-1">Наличный сум</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.cash)}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700 mb-1">Безналичный</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.bezna)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700 mb-1">Доллар США</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.usd)}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-xs font-bold text-amber-700 mb-1">Перечесления</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.transfer)}</div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
