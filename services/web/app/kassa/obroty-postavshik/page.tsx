"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Building2 } from "lucide-react"
import Link from "next/link"

const POSTAVSHIKS = [
  { id: 1, name: "Sladkiy Mir LLC", inn: "302134987", openBal: 24_000_000, debit: 412_800_000, credit: 386_300_000, closeBal: 50_500_000 },
  { id: 2, name: "Coca-Cola Uzbekistan", inn: "302456789", openBal: 0, debit: 624_800_000, credit: 612_400_000, closeBal: 12_400_000 },
  { id: 3, name: "Aqua-Plus Distribution", inn: "302789012", openBal: 8_400_000, debit: 156_400_000, credit: 158_600_000, closeBal: 6_200_000 },
  { id: 4, name: "Hilol Pechen'e", inn: "302890123", openBal: 12_400_000, debit: 84_200_000, credit: 84_000_000, closeBal: 12_600_000 },
  { id: 5, name: "Truffles Confectionery", inn: "302901234", openBal: 4_200_000, debit: 42_400_000, credit: 38_200_000, closeBal: 8_400_000 },
  { id: 6, name: "Yubileynoye Premium", inn: "302345678", openBal: 0, debit: 96_800_000, credit: 96_800_000, closeBal: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ObrotyPostavshikPage() {
  const [search, setSearch] = useState("")
  const filtered = POSTAVSHIKS.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
  const totals = filtered.reduce((acc, p) => ({
    open: acc.open + p.openBal, debit: acc.debit + p.debit, credit: acc.credit + p.credit, close: acc.close + p.closeBal,
  }), { open: 0, debit: 0, credit: 0, close: 0 })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Обороты по поставщикам</h1>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Postavshik..." className="pl-9" />
            </div>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> апр 2 6 — май 2 ▾
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-1">Откр. баланс</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.open)}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700 mb-1">Дебет (postup.)</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.debit)}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <div className="text-xs font-bold text-rose-700 mb-1">Кредит (to'lov)</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.credit)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700 mb-1">Закр. баланс</div>
            <div className="text-xl font-bold font-mono">{fmt(totals.close)}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Postavshik</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИНН</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Откр. баланс</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Дебет (postup.)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кредит (to'lov)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Закр. баланс</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono">{i + 1}</td>
                    <td className="border border-slate-300 py-2 px-2 font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" /> {p.name}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-mono">{p.inn}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(p.openBal)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-700 font-bold">{fmt(p.debit)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700 font-bold">{fmt(p.credit)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">{fmt(p.closeBal)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-slate-300 py-2 px-2">Итого</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(totals.open)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{fmt(totals.debit)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-800">{fmt(totals.credit)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(totals.close)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
