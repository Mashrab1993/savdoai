"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Save, AlertCircle, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const INITIAL = [
  { id: 1, client: "Asia Optom Market", initBalance: 24_000_000, currentBalance: -18_500_000, change: -42_500_000, type: "debet" },
  { id: 2, client: "Globus Plus", initBalance: 12_000_000, currentBalance: -12_300_000, change: -24_300_000, type: "debet" },
  { id: 3, client: "Salom Magazin №1", initBalance: 0, currentBalance: 0, change: 0, type: "balanced" },
  { id: 4, client: "Mega Market", initBalance: 0, currentBalance: 580_000, change: 580_000, type: "credit" },
  { id: 5, client: "Lider Optom", initBalance: 4_000_000, currentBalance: -2_800_000, change: -6_800_000, type: "debet" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function InitBalansPage() {
  const [search, setSearch] = useState("")
  const [date, setDate] = useState("2026-01-01")
  const filtered = INITIAL.filter(i => !search || i.client.toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Boshlang'ich balans (Klient)</h1>
          <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Excel'dan import</Button>
          <Button onClick={() => toast.success("Saqlandi")} className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-4 bg-amber-50 border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Boshlang'ich balans nima?</h3>
              <p className="text-sm text-amber-800 mt-1">
                Tizimga o'tilgan paytda klientlar bilan oldindan mavjud bo'lgan qarz/avans summasini kiritish.
                Keyingi tranzaksiyalar shu balansga qo'shiladi/ayriladi.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Sana</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700">Boshlang'ich</div>
            <div className="text-xl font-bold mt-1">{fmt(INITIAL.reduce((s, i) => s + i.initBalance, 0))}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <div className="text-xs font-bold text-rose-700">Joriy o'zgarish</div>
            <div className="text-xl font-bold mt-1">{fmt(INITIAL.reduce((s, i) => s + i.change, 0))}</div>
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
                <th className="py-3 px-2 font-semibold text-slate-600 text-right">Boshlang'ich (sana={date})</th>
                <th className="py-3 px-2 font-semibold text-slate-600 text-right">Joriy</th>
                <th className="py-3 px-2 font-semibold text-slate-600 text-right">o'zgarish</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 font-semibold">{it.client}</td>
                  <td className="py-3 px-2 text-right">
                    <input
                      defaultValue={it.initBalance}
                      className="w-32 px-2 py-1 border-2 border-slate-200 hover:border-emerald-400 rounded text-right font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className={`py-3 px-2 text-right font-mono font-bold ${it.currentBalance < 0 ? "text-rose-700" : it.currentBalance > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                    {fmt(it.currentBalance)}
                  </td>
                  <td className={`py-3 px-2 text-right font-mono ${it.change < 0 ? "text-rose-700" : it.change > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                    {it.change >= 0 ? "+" : ""}{fmt(it.change)}
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
