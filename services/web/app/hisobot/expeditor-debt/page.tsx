"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertCircle, TrendingUp, Phone, Download } from "lucide-react"
import Link from "next/link"

const EXPEDITORS = [
  { id: 1, name: "Toxirov M.", phone: "+998935678902", region: "Toshkent · Sergeli", deliveries: 124, collected: 86_400_000, owed: 12_400_000, last: "2026-05-01" },
  { id: 2, name: "Aminov R.", phone: "+998935678903", region: "Samarqand · yetkazish", deliveries: 96, collected: 72_800_000, owed: 8_200_000, last: "2026-04-30" },
  { id: 3, name: "Karimov F.", phone: "+998935678906", region: "Buxoro · yetkazish", deliveries: 64, collected: 48_400_000, owed: 6_800_000, last: "2026-04-29" },
  { id: 4, name: "Sobirov G.", phone: "+998935678907", region: "Andijon · yetkazish", deliveries: 48, collected: 36_200_000, owed: 4_200_000, last: "2026-04-28" },
  { id: 5, name: "Yuldoshev H.", phone: "+998935678908", region: "Toshkent · Yashnobod", deliveries: 84, collected: 62_400_000, owed: 0, last: "2026-04-27" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ExpeditorDebtPage() {
  const [search, setSearch] = useState("")
  const filtered = EXPEDITORS.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()))
  const totalCollected = EXPEDITORS.reduce((s, e) => s + e.collected, 0)
  const totalOwed = EXPEDITORS.reduce((s, e) => s + e.owed, 0)
  const totalDeliveries = EXPEDITORS.reduce((s, e) => s + e.deliveries, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Ekspeditor qarzlari</h1>
            <p className="text-base text-slate-500 mt-1">Yetkazish vakili qo'lidagi naqd pul · {EXPEDITORS.length} ta ekspeditor</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <TrendingUp className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Yig'ilgan to'lovlar</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalCollected / 1_000_000)} M</div>
            <div className="text-xs text-slate-600 mt-1">so'm · oy davomida</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300 border-2">
            <AlertCircle className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-rose-700">Ekspeditor qo'lida</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalOwed / 1_000_000)} M</div>
            <div className="text-xs text-slate-600 mt-1">{(totalOwed / totalCollected * 100).toFixed(1)}% topshirilmagan</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <TrendingUp className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Yetkazib berish</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalDeliveries}</div>
            <div className="text-xs text-slate-600 mt-1">ta dostavka oy davomida</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <TrendingUp className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">O'rtacha</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(Math.round(totalCollected / totalDeliveries / 1000))}K</div>
            <div className="text-xs text-slate-600 mt-1">so'm/dostavka</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ekspeditor..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Ekspeditor</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Region</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Dostavka</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Yig'ilgan</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Qo'lida (qarz)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">So'nggi topshirish</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Aloqa</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{e.name}</div>
                      <div className="text-xs text-slate-500">{e.phone}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-700 text-xs">{e.region}</td>
                    <td className="py-3 px-2 text-right font-mono">{e.deliveries}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(e.collected)}</td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${e.owed > 0 ? "text-rose-700" : "text-slate-400"}`}>
                      {e.owed > 0 ? fmt(e.owed) : "—"}
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">{e.last}</td>
                    <td className="py-3 px-2 text-center">
                      <button className="p-1.5 hover:bg-emerald-100 rounded-lg"><Phone className="w-4 h-4 text-emerald-600" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-3 px-2">Jami:</td>
                  <td className="py-3 px-2 text-right font-mono">{totalDeliveries}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-800">{fmt(totalCollected)}</td>
                  <td className="py-3 px-2 text-right font-mono text-rose-700">{fmt(totalOwed)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
