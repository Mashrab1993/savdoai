"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, DollarSign, Calendar, Download } from "lucide-react"
import Link from "next/link"

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel"]

const FLOW = {
  income: [
    { name: "Klient to'lovlari (UZS)", values: [284_500_000, 312_400_000, 298_700_000, 342_100_000] },
    { name: "Klient to'lovlari (USD→UZS)", values: [42_300_000, 51_200_000, 48_600_000, 56_800_000] },
    { name: "Click/Payme transferlar", values: [124_000_000, 142_800_000, 138_500_000, 156_200_000] },
    { name: "Naqd kassaga", values: [86_400_000, 94_200_000, 88_700_000, 102_500_000] },
  ],
  expense: [
    { name: "Postavshikga to'lov", values: [-186_400_000, -212_500_000, -198_600_000, -228_700_000] },
    { name: "Ish haqi", values: [-98_500_000, -102_400_000, -108_700_000, -124_800_000] },
    { name: "Arenda", values: [-18_000_000, -18_000_000, -18_000_000, -18_500_000] },
    { name: "Yoqilg'i / GSM", values: [-28_400_000, -30_200_000, -29_800_000, -32_400_000] },
    { name: "Komunal", values: [-7_400_000, -8_100_000, -7_800_000, -8_200_000] },
    { name: "Boshqa", values: [-12_300_000, -14_500_000, -13_200_000, -14_600_000] },
  ],
}

function fmt(n: number) { return Math.abs(n).toLocaleString("ru-RU") }
function fmtSign(n: number) { return (n >= 0 ? "+" : "−") + fmt(n) }

export default function CashflowPage() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('quarter')

  const incomeTotals = MONTHS.map((_, i) => FLOW.income.reduce((s, r) => s + r.values[i], 0))
  const expenseTotals = MONTHS.map((_, i) => FLOW.expense.reduce((s, r) => s + r.values[i], 0))
  const netFlow = MONTHS.map((_, i) => incomeTotals[i] + expenseTotals[i])

  const totalIncome = incomeTotals.reduce((s, n) => s + n, 0)
  const totalExpense = expenseTotals.reduce((s, n) => s + n, 0)
  const totalNet = netFlow.reduce((s, n) => s + n, 0)

  const maxFlow = Math.max(...incomeTotals, ...expenseTotals.map(Math.abs))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Pul oqimi (Cash Flow)</h1>
            <p className="text-base text-slate-500 mt-1">Yanvar — Aprel 2026 · Income vs Expense · Net flow</p>
          </div>
          <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
            {(['month', 'quarter', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  period === p ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p === 'month' ? 'Oy' : p === 'quarter' ? 'Kvartal' : 'Yil'}
              </button>
            ))}
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <div className="flex items-start justify-between mb-2">
              <ArrowDownRight className="w-8 h-8 text-emerald-600 bg-white rounded-xl p-1.5 shadow-sm" />
              <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded">INCOME</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700 mb-1">Jami kirim (4 oy)</div>
            <div className="text-3xl font-bold text-slate-900">{fmt(totalIncome)}</div>
            <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +18.4% (oldingi kvartal)</div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300 border-2">
            <div className="flex items-start justify-between mb-2">
              <ArrowUpRight className="w-8 h-8 text-rose-600 bg-white rounded-xl p-1.5 shadow-sm" />
              <span className="text-xs font-bold text-rose-700 bg-white px-2 py-0.5 rounded">EXPENSE</span>
            </div>
            <div className="text-xs font-semibold text-rose-700 mb-1">Jami chiqim (4 oy)</div>
            <div className="text-3xl font-bold text-slate-900">{fmt(totalExpense)}</div>
            <div className="text-xs text-rose-600 mt-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> +12.8% (oldingi kvartal)</div>
          </Card>

          <Card className={`p-5 border-2 ${totalNet >= 0 ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300" : "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-300"}`}>
            <div className="flex items-start justify-between mb-2">
              <DollarSign className={`w-8 h-8 ${totalNet >= 0 ? "text-blue-600" : "text-orange-600"} bg-white rounded-xl p-1.5 shadow-sm`} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded bg-white ${totalNet >= 0 ? "text-blue-700" : "text-orange-700"}`}>NET FLOW</span>
            </div>
            <div className={`text-xs font-semibold mb-1 ${totalNet >= 0 ? "text-blue-700" : "text-orange-700"}`}>Sof oqim</div>
            <div className="text-3xl font-bold text-slate-900">{fmtSign(totalNet)}</div>
            <div className="text-xs text-slate-600 mt-1">{((totalNet / totalIncome) * 100).toFixed(1)}% margin</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Oylik trend</h2>
          <div className="grid grid-cols-4 gap-4">
            {MONTHS.map((m, i) => {
              const inc = incomeTotals[i]
              const exp = expenseTotals[i]
              const net = netFlow[i]
              const incHeight = (inc / maxFlow) * 100
              const expHeight = (Math.abs(exp) / maxFlow) * 100
              return (
                <div key={m} className="space-y-2">
                  <div className="text-center text-sm font-semibold text-slate-700">{m}</div>
                  <div className="relative h-48 bg-slate-50 rounded-lg flex items-end justify-around px-3">
                    <div className="w-1/3 bg-emerald-500 rounded-t-md transition-all" style={{ height: `${incHeight}%` }} title={`Kirim: ${fmt(inc)}`} />
                    <div className="w-1/3 bg-rose-500 rounded-t-md transition-all" style={{ height: `${expHeight}%` }} title={`Chiqim: ${fmt(exp)}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-emerald-600 font-semibold">+{fmt(inc / 1_000_000)}M</div>
                    <div className="text-xs text-rose-600 font-semibold">−{fmt(Math.abs(exp) / 1_000_000)}M</div>
                    <div className={`text-sm font-bold mt-0.5 ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmtSign(net / 1_000_000)}M</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Detallashtirilgan ko'rinish</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Maqola</th>
                  {MONTHS.map(m => <th key={m} className="py-3 px-2 font-semibold text-slate-600 text-right">{m}</th>)}
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right bg-slate-50">Jami</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-emerald-200 bg-emerald-50/30">
                  <td className="py-2 px-2 font-bold text-emerald-700 uppercase text-xs">Kirim (Income)</td>
                  {MONTHS.map((_, i) => <td key={i} />)}
                  <td />
                </tr>
                {FLOW.income.map(row => (
                  <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 text-slate-700 pl-6">{row.name}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-2 px-2 text-right font-mono text-emerald-700">{fmt(v)}</td>
                    ))}
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800 bg-slate-50">{fmt(row.values.reduce((s, n) => s + n, 0))}</td>
                  </tr>
                ))}
                <tr className="border-b-2 border-emerald-300 bg-emerald-100/50 font-bold">
                  <td className="py-2 px-2">Jami kirim</td>
                  {incomeTotals.map((v, i) => <td key={i} className="py-2 px-2 text-right font-mono text-emerald-800">{fmt(v)}</td>)}
                  <td className="py-2 px-2 text-right font-mono text-emerald-900 bg-emerald-200/50">{fmt(totalIncome)}</td>
                </tr>

                <tr className="border-b-2 border-rose-200 bg-rose-50/30">
                  <td className="py-2 px-2 font-bold text-rose-700 uppercase text-xs">Chiqim (Expense)</td>
                  {MONTHS.map((_, i) => <td key={i} />)}
                  <td />
                </tr>
                {FLOW.expense.map(row => (
                  <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 text-slate-700 pl-6">{row.name}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-2 px-2 text-right font-mono text-rose-700">{fmt(v)}</td>
                    ))}
                    <td className="py-2 px-2 text-right font-mono font-bold text-rose-800 bg-slate-50">{fmt(row.values.reduce((s, n) => s + n, 0))}</td>
                  </tr>
                ))}
                <tr className="border-b-2 border-rose-300 bg-rose-100/50 font-bold">
                  <td className="py-2 px-2">Jami chiqim</td>
                  {expenseTotals.map((v, i) => <td key={i} className="py-2 px-2 text-right font-mono text-rose-800">{fmt(v)}</td>)}
                  <td className="py-2 px-2 text-right font-mono text-rose-900 bg-rose-200/50">{fmt(totalExpense)}</td>
                </tr>

                <tr className="border-t-4 border-slate-400 bg-slate-100 font-bold text-lg">
                  <td className="py-3 px-2">SOF OQIM (Net)</td>
                  {netFlow.map((v, i) => (
                    <td key={i} className={`py-3 px-2 text-right font-mono ${v >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmtSign(v)}</td>
                  ))}
                  <td className={`py-3 px-2 text-right font-mono ${totalNet >= 0 ? "text-blue-800" : "text-orange-800"} bg-slate-200`}>{fmtSign(totalNet)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
