"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download, Wallet, AlertCircle } from "lucide-react"
import Link from "next/link"

type Day = {
  day: number; weekday: string;
  inflow: number; outflow: number;
  balance: number;
  events: string[];
}

const PROJECTION: Day[] = [
  { day: 2, weekday: "Ju", inflow: 1_800_000, outflow: 240_000, balance: 12_400_000, events: [] },
  { day: 3, weekday: "Sh", inflow: 1_200_000, outflow: 0, balance: 13_600_000, events: ["Hayit kichik bayrami"] },
  { day: 4, weekday: "Ya", inflow: 800_000, outflow: 0, balance: 14_400_000, events: [] },
  { day: 5, weekday: "Du", inflow: 2_400_000, outflow: 1_200_000, balance: 15_600_000, events: ["Aren da to'lov"] },
  { day: 6, weekday: "Se", inflow: 2_800_000, outflow: 480_000, balance: 17_920_000, events: [] },
  { day: 7, weekday: "Ch", inflow: 3_200_000, outflow: 320_000, balance: 20_800_000, events: [] },
  { day: 8, weekday: "Pa", inflow: 2_600_000, outflow: 280_000, balance: 23_120_000, events: [] },
  { day: 9, weekday: "Ju", inflow: 1_400_000, outflow: 14_000_000, balance: 10_520_000, events: ["Ish haqi (Aprel)"] },
  { day: 10, weekday: "Sh", inflow: 1_400_000, outflow: 0, balance: 11_920_000, events: [] },
  { day: 11, weekday: "Ya", inflow: 900_000, outflow: 0, balance: 12_820_000, events: [] },
  { day: 12, weekday: "Du", inflow: 2_400_000, outflow: 5_400_000, balance: 9_820_000, events: ["Postavshik to'lov #1"] },
  { day: 13, weekday: "Se", inflow: 2_800_000, outflow: 480_000, balance: 12_140_000, events: [] },
  { day: 14, weekday: "Ch", inflow: 3_200_000, outflow: 240_000, balance: 15_100_000, events: [] },
  { day: 15, weekday: "Pa", inflow: 2_600_000, outflow: 12_000_000, balance: 5_700_000, events: ["Soliq to'lov!"] },
  { day: 16, weekday: "Ju", inflow: 1_800_000, outflow: 240_000, balance: 7_260_000, events: [] },
  { day: 17, weekday: "Sh", inflow: 1_200_000, outflow: 0, balance: 8_460_000, events: [] },
  { day: 18, weekday: "Ya", inflow: 800_000, outflow: 0, balance: 9_260_000, events: [] },
  { day: 19, weekday: "Du", inflow: 2_400_000, outflow: 4_800_000, balance: 6_860_000, events: ["Postavshik to'lov #2"] },
  { day: 20, weekday: "Se", inflow: 2_800_000, outflow: 320_000, balance: 9_340_000, events: [] },
  { day: 21, weekday: "Ch", inflow: 3_200_000, outflow: 280_000, balance: 12_260_000, events: [] },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function CashflowProjectionPage() {
  const startBalance = 11_000_000
  const totalInflow = PROJECTION.reduce((s, d) => s + d.inflow, 0)
  const totalOutflow = PROJECTION.reduce((s, d) => s + d.outflow, 0)
  const endBalance = PROJECTION[PROJECTION.length - 1].balance

  const minBalance = Math.min(...PROJECTION.map(d => d.balance))
  const minDay = PROJECTION.find(d => d.balance === minBalance)
  const isAtRisk = minBalance < 10_000_000

  const max = Math.max(...PROJECTION.map(d => d.balance))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/moliya" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Pul oqimi bashorati (cashflow)</h1>
            <p className="text-sm text-slate-500">Keyingi 20 kun · kirim/chiqim balansiga ta'siri · 02.05 - 21.05</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 20-kun</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-slate-50 border-slate-200">
            <Wallet className="w-5 h-5 text-slate-600 mb-2" />
            <div className="text-xs font-bold text-slate-700">Boshlang'ich balans</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(startBalance / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Kirim (20-kun)</div>
            <div className="text-2xl font-bold mt-1 font-mono">+{fmt(totalInflow / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <TrendingDown className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Chiqim (20-kun)</div>
            <div className="text-2xl font-bold mt-1 font-mono">−{fmt(totalOutflow / 1_000_000)} M</div>
          </Card>
          <Card className={`p-4 border-2 ${endBalance >= startBalance ? "bg-blue-50 border-blue-300" : "bg-rose-50 border-rose-300"}`}>
            <Wallet className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Yakuniy balans</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(endBalance / 1_000_000)} M</div>
          </Card>
        </div>

        {isAtRisk && minDay && (
          <Card className="p-5 bg-rose-50 border-2 border-rose-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-rose-800 text-lg">Diqqat: balans 10M dan pasayadi</h3>
                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-bold">{minDay.day}-may</span> kuni minimal balans{" "}
                  <span className="font-mono font-bold text-rose-700">{fmt(minBalance / 1_000_000)} M</span> bo'ladi
                  ({minDay.events.join(", ")} sababli). Mumkin bo'lsa, postavshik bilan to'lov muddatini siljitish yoki klient qarz yig'ishni tezlashtirish.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Pul oqimi grafigi (cumulative balance)</h2>
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end gap-1">
              {PROJECTION.map(d => {
                const heightPct = (d.balance / max) * 95
                const isLow = d.balance < 10_000_000
                const hasEvent = d.events.length > 0
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex flex-col items-center justify-end h-full relative">
                      {hasEvent && <span className="absolute top-0 w-2 h-2 bg-amber-500 rounded-full" title={d.events.join(", ")} />}
                      <div
                        className={`w-full rounded-t transition-all ${isLow ? "bg-rose-500" : d.balance < 12_000_000 ? "bg-amber-500" : "bg-emerald-500"} hover:opacity-80`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" /> Yaxshi (12M+)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded" /> Diqqat (10-12M)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded" /> Past (10M)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Voqea</div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Kunlik tafsilot</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2">Kun</th>
                  <th className="py-3 px-2 text-right">Kirim</th>
                  <th className="py-3 px-2 text-right">Chiqim</th>
                  <th className="py-3 px-2 text-right">Sof</th>
                  <th className="py-3 px-2 text-right">Balans</th>
                  <th className="py-3 px-2">Voqealar</th>
                </tr>
              </thead>
              <tbody>
                {PROJECTION.map(d => (
                  <tr key={d.day} className={`border-b border-slate-100 hover:bg-slate-50 ${d.balance < 10_000_000 ? "bg-rose-50/30" : ""}`}>
                    <td className="py-2 px-2 font-mono">{d.day}.05</td>
                    <td className="py-2 px-2">{d.weekday}</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-700">+{fmt(d.inflow)}</td>
                    <td className="py-2 px-2 text-right font-mono text-rose-700">−{fmt(d.outflow)}</td>
                    <td className={`py-2 px-2 text-right font-mono font-bold ${d.inflow - d.outflow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {d.inflow - d.outflow >= 0 ? "+" : ""}{fmt(d.inflow - d.outflow)}
                    </td>
                    <td className={`py-2 px-2 text-right font-mono font-bold ${d.balance < 10_000_000 ? "text-rose-700" : d.balance < 12_000_000 ? "text-amber-700" : "text-emerald-700"}`}>
                      {fmt(d.balance / 1_000_000)} M
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {d.events.length > 0 && d.events.map((e, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 mr-1">⚡ {e}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
