"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, AlertCircle, Search, Download, Phone, MapPin } from "lucide-react"
import Link from "next/link"

const BRACKETS = [
  { key: "0_7", label: "0-7 kun", count: 156, sum: 124_500_000, color: "emerald", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" },
  { key: "8_15", label: "8-15 kun", count: 84, sum: 78_200_000, color: "lime", bg: "bg-lime-50", border: "border-lime-300", text: "text-lime-700" },
  { key: "16_30", label: "16-30 kun", count: 62, sum: 56_800_000, color: "amber", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  { key: "31_50", label: "31-50 kun", count: 38, sum: 42_100_000, color: "orange", bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  { key: "51_90", label: "51-90 kun", count: 24, sum: 28_400_000, color: "rose", bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700" },
  { key: "90_plus", label: "90+ kun KRITIK", count: 12, sum: 15_600_000, color: "red", bg: "bg-red-100", border: "border-red-400", text: "text-red-800" },
]

const CLIENTS = [
  { id: 1, name: "Asia Optom Market", debt: 18_500_000, days: 127, agent: "Nurmatov A.", phone: "+998901234567", region: "Toshkent", lastPay: "2026-01-04" },
  { id: 2, name: "Globus Plus", debt: 12_300_000, days: 96, agent: "Rasulov B.", phone: "+998935678901", region: "Samarqand", lastPay: "2026-01-30" },
  { id: 3, name: "Optom Tovar Service", debt: 8_900_000, days: 78, agent: "Karimov S.", phone: "+998901112233", region: "Toshkent", lastPay: "2026-02-13" },
  { id: 4, name: "Mega Skidka Bozor", debt: 6_400_000, days: 65, agent: "Yusupov D.", phone: "+998975544332", region: "Buxoro", lastPay: "2026-02-26" },
  { id: 5, name: "Sharq Magazin", debt: 4_200_000, days: 42, agent: "Nurmatov A.", phone: "+998935544221", region: "Toshkent", lastPay: "2026-03-21" },
  { id: 6, name: "Yangiyul Trade", debt: 3_100_000, days: 38, agent: "Rasulov B.", phone: "+998935678902", region: "Samarqand", lastPay: "2026-03-25" },
  { id: 7, name: "Lider Optom", debt: 2_800_000, days: 28, agent: "Karimov S.", phone: "+998935678903", region: "Toshkent", lastPay: "2026-04-04" },
  { id: 8, name: "Plov Prazdnik Centr", debt: 1_900_000, days: 14, agent: "Yusupov D.", phone: "+998935678904", region: "Toshkent", lastPay: "2026-04-18" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }
function bracketOf(days: number) {
  if (days >= 90) return BRACKETS[5]
  if (days >= 51) return BRACKETS[4]
  if (days >= 31) return BRACKETS[3]
  if (days >= 16) return BRACKETS[2]
  if (days >= 8) return BRACKETS[1]
  return BRACKETS[0]
}

export default function AgingPage() {
  const [search, setSearch] = useState("")
  const [selectedBracket, setSelectedBracket] = useState<string | null>(null)

  const filtered = CLIENTS.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.agent.toLowerCase().includes(search.toLowerCase())
    const b = bracketOf(c.days)
    const matchBracket = !selectedBracket || b.key === selectedBracket
    return matchSearch && matchBracket
  })
  const totalDebt = BRACKETS.reduce((s, b) => s + b.sum, 0)
  const totalCount = BRACKETS.reduce((s, b) => s + b.count, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Aging hisoboti — Klient qarzdorligi</h1>
            <p className="text-base text-slate-500 mt-1">{totalCount} qarzdor klient · Jami: <span className="font-bold text-rose-700">{fmt(totalDebt)} so'm</span></p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {BRACKETS.map(b => {
            const pct = (b.sum / totalDebt) * 100
            const isActive = selectedBracket === b.key
            return (
              <Card
                key={b.key}
                onClick={() => setSelectedBracket(isActive ? null : b.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${b.bg} ${b.border} ${isActive ? "ring-2 ring-offset-2 ring-slate-900 shadow-lg" : ""}`}
              >
                <div className={`text-xs font-bold ${b.text} mb-1`}>{b.label}</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{b.count}</div>
                <div className="text-xs text-slate-600">{fmt(b.sum)} so'm</div>
                <div className={`text-xs mt-1 ${b.text} font-semibold`}>{pct.toFixed(1)}% ulush</div>
                <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full bg-${b.color}-500`} style={{ width: `${pct}%` }} />
                </div>
              </Card>
            )
          })}
        </div>

        {selectedBracket && (
          <div className={`p-3 rounded-lg ${bracketOf(BRACKETS.find(b => b.key === selectedBracket)!.key === "90_plus" ? 100 : 5).bg} border ${bracketOf(BRACKETS.find(b => b.key === selectedBracket)!.key === "90_plus" ? 100 : 5).border} text-sm font-semibold flex items-center gap-2`}>
            <AlertCircle className="w-4 h-4" />
            Filtr: <span className="font-bold">{BRACKETS.find(b => b.key === selectedBracket)?.label}</span> bracket
            <button onClick={() => setSelectedBracket(null)} className="ml-auto text-xs underline">Filtr olib tashlash</button>
          </div>
        )}

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient yoki agent qidiring..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta natija</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Klient</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Region</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Agent</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Qarz (so'm)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Bracket</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Kun</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">So'nggi to'lov</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Aloqa</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const b = bracketOf(c.days)
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <Link href={`/klientlar/${c.id}`} className="font-semibold text-emerald-700 hover:underline">{c.name}</Link>
                      </td>
                      <td className="py-3 px-2 text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {c.region}
                      </td>
                      <td className="py-3 px-2 text-slate-700">{c.agent}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">{fmt(c.debt)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${b.bg} ${b.text} border ${b.border}`}>
                          {b.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-700">{c.days}</td>
                      <td className="py-3 px-2 text-slate-600 font-mono text-xs">{c.lastPay}</td>
                      <td className="py-3 px-2 text-center">
                        <button className="p-1.5 hover:bg-emerald-100 rounded-lg" title={c.phone}>
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </button>
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
