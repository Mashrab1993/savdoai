"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, TrendingUp, Search, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

const POSTAVSHIKS = [
  { id: 1, name: "Sladkiy Mir LLC", brands: ["Bonjur", "Choco-Boom"], orders: 28, sum: 412_800_000, lastDelivery: "2026-04-28", quality: 96, onTime: 92, debt: 24_500_000 },
  { id: 2, name: "Coca-Cola Uzbekistan", brands: ["Coca-Cola", "Fanta", "Sprite"], orders: 42, sum: 624_800_000, lastDelivery: "2026-04-30", quality: 98, onTime: 96, debt: 18_400_000 },
  { id: 3, name: "Aqua-Plus Distribution", brands: ["Aqua-Plus", "Eco-Drink"], orders: 18, sum: 156_400_000, lastDelivery: "2026-04-25", quality: 94, onTime: 88, debt: 6_200_000 },
  { id: 4, name: "Hilol Pechen'e", brands: ["Hilol"], orders: 12, sum: 84_200_000, lastDelivery: "2026-04-22", quality: 92, onTime: 84, debt: 12_800_000 },
  { id: 5, name: "Truffles Confectionery", brands: ["Truffles"], orders: 8, sum: 42_400_000, lastDelivery: "2026-04-15", quality: 90, onTime: 76, debt: 8_400_000 },
  { id: 6, name: "Yubileynoye Premium", brands: ["Yubileynoye"], orders: 14, sum: 96_800_000, lastDelivery: "2026-04-26", quality: 95, onTime: 90, debt: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function score(p: typeof POSTAVSHIKS[0]) {
  return Math.round((p.quality * 0.4 + p.onTime * 0.4 + (p.debt === 0 ? 100 : Math.max(0, 100 - (p.debt / p.sum * 100 * 5))) * 0.2))
}

export default function PostavshikAuditPage() {
  const [search, setSearch] = useState("")

  const ranked = [...POSTAVSHIKS].map(p => ({ ...p, score: score(p) })).sort((a, b) => b.score - a.score)
  const filtered = ranked.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const totalSum = POSTAVSHIKS.reduce((s, p) => s + p.sum, 0)
  const totalDebt = POSTAVSHIKS.reduce((s, p) => s + p.debt, 0)
  const avgQuality = POSTAVSHIKS.reduce((s, p) => s + p.quality, 0) / POSTAVSHIKS.length
  const avgOnTime = POSTAVSHIKS.reduce((s, p) => s + p.onTime, 0) / POSTAVSHIKS.length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Postavshik audit</h1>
            <p className="text-base text-slate-500 mt-1">{POSTAVSHIKS.length} ta postavshik · Sifat + Vaqt + Qarz tahlili</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Building2 className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami olish</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalSum / 1_000_000)} M</div>
            <div className="text-xs text-slate-600 mt-1">so'm · 4 oy</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <CheckCircle2 className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">O'rtacha sifat</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{avgQuality.toFixed(0)}%</div>
            <div className="text-xs text-slate-600 mt-1">brak nisbatdan teskari</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <Clock className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Vaqtida (on-time)</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{avgOnTime.toFixed(0)}%</div>
            <div className="text-xs text-slate-600 mt-1">yetkazib berish vaqti</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300 border-2">
            <AlertCircle className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-rose-700">Bizning qarz</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalDebt / 1_000_000)} M</div>
            <div className="text-xs text-slate-600 mt-1">postavshikga to'lash</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Postavshik..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Postavshik</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Brendlar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Olish (4 oy)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sifat %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Vaqtida %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Qarz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Reyting</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const s = p.score
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-400">#{ranked.findIndex(r => r.id === p.id) + 1}</td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">So'nggi: {p.lastDelivery}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {p.brands.map(b => (
                            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">{b}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold">{fmt(p.sum / 1_000_000)} M</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${p.quality >= 95 ? "text-emerald-700" : p.quality >= 90 ? "text-amber-700" : "text-rose-700"}`}>{p.quality}%</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${p.onTime >= 90 ? "text-emerald-700" : p.onTime >= 80 ? "text-amber-700" : "text-rose-700"}`}>{p.onTime}%</td>
                      <td className={`py-3 px-2 text-right font-mono ${p.debt > 0 ? "text-rose-700 font-bold" : "text-slate-400"}`}>
                        {p.debt > 0 ? fmt(p.debt) : "—"}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`inline-block px-3 py-1 rounded-md font-bold text-sm ${s >= 90 ? "bg-emerald-100 text-emerald-800" : s >= 75 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                          {s}/100
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
