"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Filter, Receipt, TrendingDown, AlertCircle, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { key: "rent", name: "Arenda", color: "rose", count: 12, sum: 18_500_000 },
  { key: "salary", name: "Ish haqi", color: "violet", count: 28, sum: 124_800_000 },
  { key: "fuel", name: "Yoqilg'i / GSM", color: "amber", count: 86, sum: 32_400_000 },
  { key: "utility", name: "Komunal", color: "blue", count: 14, sum: 8_200_000 },
  { key: "marketing", name: "Reklama", color: "emerald", count: 6, sum: 4_800_000 },
  { key: "other", name: "Boshqa", color: "slate", count: 24, sum: 14_600_000 },
]

const EXPENSES = [
  { id: 1001, date: "2026-05-02", category: "salary", desc: "Aprel ish haqi · agentlar", sum: 36_500_000, currency: "UZS", pnl: true, kassa: "Markaziy", user: "Mashrab S." },
  { id: 1002, date: "2026-05-01", category: "rent", desc: "Sergeli ofis arenda — May", sum: 6_000_000, currency: "UZS", pnl: true, kassa: "Markaziy", user: "Mashrab S." },
  { id: 1003, date: "2026-05-01", category: "fuel", desc: "Bensin · Lacetti #01-A-123-AA", sum: 480_000, currency: "UZS", pnl: true, kassa: "Sergeli", user: "Toxirov M." },
  { id: 1004, date: "2026-04-30", category: "utility", desc: "Elektr energiya · April", sum: 1_240_000, currency: "UZS", pnl: true, kassa: "Markaziy", user: "Ergashev F." },
  { id: 1005, date: "2026-04-30", category: "marketing", desc: "Reklama tizimi · Telegram Ads", sum: 250, currency: "USD", pnl: true, kassa: "Markaziy", user: "Mashrab S." },
  { id: 1006, date: "2026-04-29", category: "other", desc: "Ofis kanstovar", sum: 850_000, currency: "UZS", pnl: false, kassa: "Sergeli", user: "Sobirova N." },
  { id: 1007, date: "2026-04-29", category: "fuel", desc: "Bensin · Damas #01-T-456-BB", sum: 320_000, currency: "UZS", pnl: true, kassa: "Markaziy", user: "Aminov R." },
  { id: 1008, date: "2026-04-28", category: "salary", desc: "Avans · ekspeditorlar", sum: 18_000_000, currency: "UZS", pnl: true, kassa: "Markaziy", user: "Mashrab S." },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function XarajatPage() {
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [showPnlOnly, setShowPnlOnly] = useState(false)

  const filtered = EXPENSES.filter(e => {
    const matchSearch = !search || e.desc.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCat || e.category === activeCat
    const matchPnl = !showPnlOnly || e.pnl
    return matchSearch && matchCat && matchPnl
  })

  const totalUZS = CATEGORIES.reduce((s, c) => s + c.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Xarajatlar</h1>
            <p className="text-base text-slate-500 mt-1">Multi-currency · PNL flag · 6 kategoriya · Apr 2026: <span className="font-bold text-rose-700">{fmt(totalUZS)} so'm</span></p>
          </div>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filtr</Button>
          <Link href="/kassa/xarajat/yangi"><Button className="gap-2"><Plus className="w-4 h-4" /> Yangi xarajat</Button></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(c => {
            const pct = (c.sum / totalUZS) * 100
            const isActive = activeCat === c.key
            return (
              <Card
                key={c.key}
                onClick={() => setActiveCat(isActive ? null : c.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 bg-${c.color}-50 border-${c.color}-200 ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
              >
                <Receipt className={`w-5 h-5 text-${c.color}-600 mb-2`} />
                <div className={`text-xs font-bold text-${c.color}-700`}>{c.name}</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{fmt(c.sum)}</div>
                <div className="text-xs text-slate-500">{c.count} yozuv · {pct.toFixed(0)}%</div>
                <div className="mt-2 h-1 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full bg-${c.color}-500`} style={{ width: `${pct}%` }} />
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Xarajat tavsifi..." className="pl-9" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showPnlOnly} onChange={e => setShowPnlOnly(e.target.checked)} className="rounded" />
              <span className="font-semibold">Faqat PNL</span>
            </label>
            <span className="text-sm text-slate-500">{filtered.length} ta yozuv</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Sana</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Kategoriya</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Tavsif</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Summa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">PNL</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Kassa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">User</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const cat = CATEGORIES.find(c => c.key === e.category)!
                  return (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-400 font-mono">#{e.id}</td>
                      <td className="py-3 px-2 text-slate-700 font-mono text-xs">{e.date}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-${cat.color}-100 text-${cat.color}-700`}>
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-900">{e.desc}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">
                        −{fmt(e.sum)} <span className="text-xs text-slate-500 font-normal">{e.currency}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {e.pnl ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">PNL</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{e.kassa}</td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{e.user}</td>
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
