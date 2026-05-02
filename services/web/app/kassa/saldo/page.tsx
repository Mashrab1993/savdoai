"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Download, Building2 } from "lucide-react"
import Link from "next/link"

const CLIENTS = [
  { id: 1, name: "Asia Optom Market", agent: "Nurmatov A.", balance: -18_500_000 },
  { id: 2, name: "Globus Plus", agent: "Rasulov B.", balance: -12_300_000 },
  { id: 3, name: "Salom Magazin №1", agent: "Nurmatov A.", balance: 0 },
  { id: 4, name: "Mega Market", agent: "Yusupov D.", balance: 580_000 },
  { id: 5, name: "Lider Optom", agent: "Karimov S.", balance: -2_800_000 },
  { id: 6, name: "Sharq Bozor", agent: "Yusupov D.", balance: -4_200_000 },
  { id: 7, name: "Bobur Magazin", agent: "Nurmatov A.", balance: 0 },
  { id: 8, name: "Optom Tovar Service", agent: "Karimov S.", balance: -8_900_000 },
  { id: 9, name: "Yangiyul Trade", agent: "Rasulov B.", balance: -3_100_000 },
  { id: 10, name: "Plov Prazdnik Centr", agent: "Yusupov D.", balance: -1_900_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function SaldoPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "debt" | "credit" | "zero">("all")

  const filtered = CLIENTS.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all"
      || (filter === "debt" && c.balance < 0)
      || (filter === "credit" && c.balance > 0)
      || (filter === "zero" && c.balance === 0)
    return matchSearch && matchFilter
  })

  const totalDebt = CLIENTS.filter(c => c.balance < 0).reduce((s, c) => s + c.balance, 0)
  const totalCredit = CLIENTS.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0)
  const debtors = CLIENTS.filter(c => c.balance < 0).length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Сальдо клиентов</h1>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card onClick={() => setFilter(filter === "debt" ? "all" : "debt")} className={`p-4 cursor-pointer transition-all border-2 bg-rose-50 border-rose-200 ${filter === "debt" ? "ring-2 ring-rose-500" : ""}`}>
            <div className="text-xs font-bold text-rose-700">Klient qarzi (debet)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalDebt)}</div>
            <div className="text-xs text-slate-600 mt-1">{debtors} qarzdor klient</div>
          </Card>
          <Card onClick={() => setFilter(filter === "credit" ? "all" : "credit")} className={`p-4 cursor-pointer transition-all border-2 bg-emerald-50 border-emerald-200 ${filter === "credit" ? "ring-2 ring-emerald-500" : ""}`}>
            <div className="text-xs font-bold text-emerald-700">Bizning qarz (kredit)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalCredit)}</div>
            <div className="text-xs text-slate-600 mt-1">avans qabul qilingan</div>
          </Card>
          <Card onClick={() => setFilter(filter === "zero" ? "all" : "zero")} className={`p-4 cursor-pointer transition-all border-2 bg-slate-50 border-slate-200 ${filter === "zero" ? "ring-2 ring-slate-500" : ""}`}>
            <div className="text-xs font-bold text-slate-700">Net</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalCredit + totalDebt)}</div>
            <div className="text-xs text-slate-600 mt-1">jami sof qarz</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">Klientlar</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{CLIENTS.length}</div>
            <div className="text-xs text-slate-600 mt-1">jami</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left">
                <th className="py-3 px-2 font-semibold text-slate-600">Klient</th>
                <th className="py-3 px-2 font-semibold text-slate-600">Agent</th>
                <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sальдо</th>
                <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <Link href={`/klientlar/${c.id}`} className="font-semibold text-emerald-700 hover:underline flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> {c.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-slate-700">{c.agent}</td>
                  <td className={`py-3 px-2 text-right font-mono font-bold ${c.balance < 0 ? "text-rose-700" : c.balance > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                    {fmt(c.balance)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {c.balance < -5_000_000 ? <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-semibold">⚠ KRITIK</span>
                      : c.balance < 0 ? <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">Qarzdor</span>
                      : c.balance > 0 ? <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold">Avans</span>
                      : <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">Toza</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminLayout>
  )
}
