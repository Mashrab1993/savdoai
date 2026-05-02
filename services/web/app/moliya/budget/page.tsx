"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, Download, TrendingUp, TrendingDown, Save, AlertCircle } from "lucide-react"
import Link from "next/link"

type BudgetLine = {
  id: number; category: string; name: string;
  planned: number; actual: number; type: "income" | "expense";
}

const INITIAL: BudgetLine[] = [
  { id: 1, category: "DAROMAD", name: "Sotuv tushum", planned: 180_000_000, actual: 168_400_000, type: "income" },
  { id: 2, category: "DAROMAD", name: "Boshqa daromad", planned: 4_000_000, actual: 5_200_000, type: "income" },

  { id: 3, category: "OPERATSION", name: "Tovar nartanarxi", planned: 96_000_000, actual: 91_200_000, type: "expense" },
  { id: 4, category: "OPERATSION", name: "Ish haqi", planned: 28_000_000, actual: 28_400_000, type: "expense" },
  { id: 5, category: "OPERATSION", name: "Aren da", planned: 8_000_000, actual: 8_000_000, type: "expense" },
  { id: 6, category: "OPERATSION", name: "Kommunal", planned: 2_400_000, actual: 2_140_000, type: "expense" },

  { id: 7, category: "LOGISTIKA", name: "Yoqilg'i", planned: 4_800_000, actual: 5_240_000, type: "expense" },
  { id: 8, category: "LOGISTIKA", name: "Avto remont", planned: 1_200_000, actual: 1_840_000, type: "expense" },

  { id: 9, category: "MARKETING", name: "Promo aktsiyalar", planned: 6_000_000, actual: 4_400_000, type: "expense" },
  { id: 10, category: "MARKETING", name: "Reklama", planned: 2_000_000, actual: 2_200_000, type: "expense" },

  { id: 11, category: "MOLIYA", name: "Soliq va to'lovlar", planned: 12_000_000, actual: 11_400_000, type: "expense" },
  { id: 12, category: "MOLIYA", name: "Bank xizmatlari", planned: 600_000, actual: 580_000, type: "expense" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function BudgetPage() {
  const [lines, setLines] = useState(INITIAL)

  const updatePlanned = (id: number, val: string) => {
    const num = Number(val) || 0
    setLines(lines.map(l => l.id === id ? { ...l, planned: num } : l))
  }

  const totalIncome = lines.filter(l => l.type === "income").reduce((s, l) => s + l.actual, 0)
  const totalIncomePlanned = lines.filter(l => l.type === "income").reduce((s, l) => s + l.planned, 0)
  const totalExpense = lines.filter(l => l.type === "expense").reduce((s, l) => s + l.actual, 0)
  const totalExpensePlanned = lines.filter(l => l.type === "expense").reduce((s, l) => s + l.planned, 0)

  const profitActual = totalIncome - totalExpense
  const profitPlanned = totalIncomePlanned - totalExpensePlanned

  const categories = Array.from(new Set(lines.map(l => l.category)))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/moliya" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Byudjet rejalashtirish</h1>
            <p className="text-sm text-slate-500">May 2026 · Plan vs Fakt taqqoslash · {lines.length} ta yo'nalish</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> May 2026</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">DAROMAD</span>
            </div>
            <div className="text-3xl font-bold font-mono">{fmt(totalIncome / 1_000_000)} M</div>
            <div className="text-xs text-slate-500 mt-1">plan: {fmt(totalIncomePlanned / 1_000_000)} M ({Math.round((totalIncome / totalIncomePlanned) * 100)}%)</div>
            <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (totalIncome / totalIncomePlanned) * 100)}%` }} />
            </div>
          </Card>

          <Card className="p-5 bg-rose-50 border-rose-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-6 h-6 text-rose-600" />
              <span className="text-xs font-bold text-rose-700">XARAJAT</span>
            </div>
            <div className="text-3xl font-bold font-mono">{fmt(totalExpense / 1_000_000)} M</div>
            <div className="text-xs text-slate-500 mt-1">plan: {fmt(totalExpensePlanned / 1_000_000)} M ({Math.round((totalExpense / totalExpensePlanned) * 100)}%)</div>
            <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (totalExpense / totalExpensePlanned) * 100)}%` }} />
            </div>
          </Card>

          <Card className={`p-5 border-2 ${profitActual >= 0 ? "bg-blue-50 border-blue-300" : "bg-rose-50 border-rose-300"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700">SOF FOYDA</span>
            </div>
            <div className={`text-3xl font-bold font-mono ${profitActual >= 0 ? "text-blue-700" : "text-rose-700"}`}>
              {profitActual >= 0 ? "+" : ""}{fmt(profitActual / 1_000_000)} M
            </div>
            <div className="text-xs text-slate-500 mt-1">plan: {fmt(profitPlanned / 1_000_000)} M · margin {Math.round((profitActual / totalIncome) * 100)}%</div>
          </Card>
        </div>

        {categories.map(cat => {
          const catLines = lines.filter(l => l.category === cat)
          const catPlanned = catLines.reduce((s, l) => s + l.planned, 0)
          const catActual = catLines.reduce((s, l) => s + l.actual, 0)
          const catType = catLines[0]?.type
          return (
            <Card key={cat} className="p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <h2 className="text-base font-bold flex items-center gap-2">
                  {catType === "income" ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
                  {cat}
                </h2>
                <div className="text-sm">
                  <span className="text-slate-500">Plan: </span><span className="font-mono">{fmt(catPlanned)}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500">Fakt: </span><span className={`font-mono font-bold ${catActual <= catPlanned ? "text-emerald-700" : "text-rose-700"}`}>{fmt(catActual)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-slate-50">
                      <th className="py-2 px-2">Yo'nalish</th>
                      <th className="py-2 px-2 text-right">Plan</th>
                      <th className="py-2 px-2 text-right">Fakt</th>
                      <th className="py-2 px-2 text-right">Δ</th>
                      <th className="py-2 px-2">Bajarish %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catLines.map(l => {
                      const diff = l.actual - l.planned
                      const pct = Math.round((l.actual / l.planned) * 100)
                      const isOver = catType === "expense" ? l.actual > l.planned : l.actual < l.planned
                      return (
                        <tr key={l.id} className="border-b border-slate-100">
                          <td className="py-2 px-2 font-semibold">{l.name}</td>
                          <td className="py-2 px-2 text-right">
                            <Input type="number" value={l.planned} onChange={e => updatePlanned(l.id, e.target.value)} className="h-7 text-right font-mono w-32 ml-auto" />
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold">{fmt(l.actual)}</td>
                          <td className={`py-2 px-2 text-right font-mono font-bold ${isOver ? "text-rose-700" : "text-emerald-700"}`}>
                            {diff > 0 ? "+" : ""}{fmt(diff)}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden min-w-[80px]">
                                <div className={`h-full ${isOver ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(120, pct)}%` }} />
                              </div>
                              <span className={`text-xs font-bold font-mono w-12 text-right ${isOver ? "text-rose-700" : "text-emerald-700"}`}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        })}

        {totalExpense > totalExpensePlanned && (
          <Card className="p-5 bg-amber-50 border-amber-300 border-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-800">Xarajat rejadan oshib ketdi</h3>
                <p className="text-sm text-slate-700 mt-1">
                  Reja: {fmt(totalExpensePlanned)} so'm · Fakt: {fmt(totalExpense)} so'm · oshib ketgani: <span className="font-bold text-rose-700">+{fmt(totalExpense - totalExpensePlanned)} so'm</span>.
                  Eng katta o'sish — Logistika va Ish haqida.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
