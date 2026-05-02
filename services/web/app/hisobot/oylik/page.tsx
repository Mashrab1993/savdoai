"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Download, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

const MOCK_DATA = [
  { month: "Yanvar", sotuv: 312_400_000, zakaz: 1248, klient: 156, foyda: 48_200_000 },
  { month: "Fevral", sotuv: 298_700_000, zakaz: 1184, klient: 162, foyda: 45_100_000 },
  { month: "Mart", sotuv: 356_200_000, zakaz: 1342, klient: 178, foyda: 56_400_000 },
  { month: "Aprel", sotuv: 412_800_000, zakaz: 1568, klient: 192, foyda: 64_800_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function OylikPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiData, loading } = useApi<typeof MOCK_DATA>(isAuthenticated ? "/api/v1/hisobot/oylik" : null)
  const data = (apiData && Array.isArray(apiData) && apiData.length) ? apiData : MOCK_DATA
  const usingMock = !apiData

  const totalSotuv = data.reduce((s, m) => s + m.sotuv, 0)
  const totalFoyda = data.reduce((s, m) => s + m.foyda, 0)
  const totalZakaz = data.reduce((s, m) => s + m.zakaz, 0)
  const lastMonth = data[data.length - 1]
  const prevMonth = data[data.length - 2]
  const sotuvGrowth = prevMonth ? ((lastMonth.sotuv - prevMonth.sotuv) / prevMonth.sotuv * 100) : 0
  const foydaPct = (totalFoyda / totalSotuv * 100)

  const maxSotuv = Math.max(...data.map(m => m.sotuv))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Oylik hisobot</h1>
            <p className="text-base text-slate-500 mt-1">Sotuv · zakaz · foyda · klient — Yanvar-Aprel 2026</p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && apiData && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real-time API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami sotuv (4 oy)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalSotuv / 1_000_000)} M</div>
            <div className={`text-xs mt-1 font-semibold flex items-center gap-1 ${sotuvGrowth >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {sotuvGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {sotuvGrowth >= 0 ? "+" : ""}{sotuvGrowth.toFixed(1)}% Mart→Aprel
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <DollarSign className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Jami foyda</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalFoyda / 1_000_000)} M</div>
            <div className="text-xs text-blue-700 mt-1 font-semibold">Marja: {foydaPct.toFixed(1)}%</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <ShoppingBag className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Zakazlar soni</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalZakaz)}</div>
            <div className="text-xs text-violet-700 mt-1 font-semibold">O'rtacha: {fmt(Math.round(totalSotuv / totalZakaz))} so'm/zakaz</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 border-2">
            <Users className="w-7 h-7 text-amber-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-amber-700">Aktiv klientlar</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{lastMonth.klient}</div>
            <div className="text-xs text-amber-700 mt-1 font-semibold">+{lastMonth.klient - data[0].klient} ({((lastMonth.klient - data[0].klient) / data[0].klient * 100).toFixed(1)}%)</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Oylik sotuv trendi</h2>
          <div className="grid grid-cols-4 gap-4 h-64 items-end">
            {data.map(m => {
              const h = (m.sotuv / maxSotuv * 100)
              return (
                <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-sm font-bold text-emerald-700">{fmt(m.sotuv / 1_000_000)} M</div>
                  <div className="w-full max-w-[120px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h * 0.6}%` }} title={`${m.month}: ${fmt(m.sotuv)} so'm`}>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{m.month}</div>
                  <div className="text-xs text-slate-500">{m.zakaz} zakaz · {m.klient} klient</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Oylik tafsilot</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Oy</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv (so'm)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Zakaz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">O'rtacha (so'm)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Klient</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Foyda</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Marja %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">o'sish %</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m, i) => {
                  const margin = (m.foyda / m.sotuv * 100)
                  const growth = i > 0 ? ((m.sotuv - data[i - 1].sotuv) / data[i - 1].sotuv * 100) : 0
                  return (
                    <tr key={m.month} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-semibold text-slate-900">{m.month}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(m.sotuv)}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{fmt(m.zakaz)}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600">{fmt(Math.round(m.sotuv / m.zakaz))}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{m.klient}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-blue-700">{fmt(m.foyda)}</td>
                      <td className={`py-3 px-2 text-right font-mono font-semibold ${margin >= 15 ? "text-emerald-700" : margin >= 10 ? "text-amber-700" : "text-rose-700"}`}>
                        {margin.toFixed(1)}%
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-semibold ${i === 0 ? "text-slate-400" : growth >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {i === 0 ? "—" : (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%"}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td className="py-3 px-2 text-slate-700">JAMI 4 oy</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-800">{fmt(totalSotuv)}</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(totalZakaz)}</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(Math.round(totalSotuv / totalZakaz))}</td>
                  <td className="py-3 px-2 text-right font-mono">{lastMonth.klient}</td>
                  <td className="py-3 px-2 text-right font-mono text-blue-800">{fmt(totalFoyda)}</td>
                  <td className="py-3 px-2 text-right font-mono">{foydaPct.toFixed(1)}%</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
