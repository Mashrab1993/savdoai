"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Repeat, Calendar, Pause, Play, Edit, Trash2, Sparkles } from "lucide-react"
import Link from "next/link"

type Subscription = {
  id: number; client: string; agent: string;
  cadence: "weekly" | "biweekly" | "monthly";
  nextDate: string; lastOrder: string;
  itemsCount: number; avgSum: number; totalGenerated: number;
  active: boolean; autoConfirm: boolean;
}

const SUBS: Subscription[] = [
  { id: 1, client: "Salom Magazin №1", agent: "Babadjanova N.", cadence: "weekly", nextDate: "2026-05-09", lastOrder: "2026-05-02", itemsCount: 12, avgSum: 1_840_000, totalGenerated: 22_080_000, active: true, autoConfirm: true },
  { id: 2, client: "Bona Магазин", agent: "Berdiyev R.", cadence: "biweekly", nextDate: "2026-05-14", lastOrder: "2026-04-30", itemsCount: 8, avgSum: 1_240_000, totalGenerated: 14_880_000, active: true, autoConfirm: false },
  { id: 3, client: "Дастархон Сервис", agent: "Sayitqulov M.", cadence: "weekly", nextDate: "2026-05-08", lastOrder: "2026-05-01", itemsCount: 18, avgSum: 2_840_000, totalGenerated: 51_120_000, active: true, autoConfirm: true },
  { id: 4, client: "Гулямов Маркет", agent: "ДАВЛАТ", cadence: "monthly", nextDate: "2026-05-26", lastOrder: "2026-04-26", itemsCount: 24, avgSum: 4_200_000, totalGenerated: 16_800_000, active: true, autoConfirm: false },
  { id: 5, client: "Турсун Ake Магазин", agent: "BORIEV M.", cadence: "weekly", nextDate: "2026-05-12", lastOrder: "2026-04-29", itemsCount: 6, avgSum: 920_000, totalGenerated: 7_360_000, active: false, autoConfirm: true },
  { id: 6, client: "Family Маркет", agent: "ДАВЛАТ", cadence: "biweekly", nextDate: "2026-05-15", lastOrder: "2026-05-01", itemsCount: 14, avgSum: 1_640_000, totalGenerated: 11_480_000, active: true, autoConfirm: true },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const CADENCE_LABEL: Record<string, string> = {
  weekly: "🔁 Haftalik",
  biweekly: "🔁 2-haftalik",
  monthly: "🔁 Oylik",
}
const CADENCE_DAYS: Record<string, number> = {
  weekly: 7, biweekly: 14, monthly: 30,
}

export default function RecurringOrdersPage() {
  const [subs, setSubs] = useState(SUBS)

  const toggleActive = (id: number) => {
    setSubs(subs.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const activeCount = subs.filter(s => s.active).length
  const totalMonthlyValue = subs.filter(s => s.active).reduce((sum, s) => sum + (s.avgSum * 30) / CADENCE_DAYS[s.cadence], 0)
  const totalLifetime = subs.reduce((s, x) => s + x.totalGenerated, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Repeat className="w-7 h-7 text-emerald-600" />
              Avtomatik takroriy zakazlar
            </h1>
            <p className="text-sm text-slate-500">{activeCount} faol obuna · ~{fmt(totalMonthlyValue / 1_000_000)} M oylik · {fmt(totalLifetime / 1_000_000)} M lifetime</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi obuna</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Repeat className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol obuna</div>
            <div className="text-2xl font-bold mt-1">{activeCount}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Calendar className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Bu oy ETA</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalMonthlyValue / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Sparkles className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Auto-confirm</div>
            <div className="text-2xl font-bold mt-1">{subs.filter(s => s.autoConfirm).length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Repeat className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Lifetime tushum</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalLifetime / 1_000_000)} M</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Obunalar ro'yxati</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Klient</th>
                  <th className="py-3 px-2">Agent</th>
                  <th className="py-3 px-2 text-center">Davriylik</th>
                  <th className="py-3 px-2 text-center">Keyingi</th>
                  <th className="py-3 px-2 text-right">SKU</th>
                  <th className="py-3 px-2 text-right">O'rta zakaz</th>
                  <th className="py-3 px-2 text-right">Lifetime</th>
                  <th className="py-3 px-2 text-center">Auto</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                  <th className="py-3 px-2 text-center w-32">Amal</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!s.active ? "opacity-50" : ""}`}>
                    <td className="py-3 px-2 font-semibold">{s.client}</td>
                    <td className="py-3 px-2 text-xs">{s.agent}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{CADENCE_LABEL[s.cadence]}</span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs">{s.nextDate}</td>
                    <td className="py-3 px-2 text-right font-mono">{s.itemsCount}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(s.avgSum)}</td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(s.totalGenerated / 1_000_000)} M</td>
                    <td className="py-3 px-2 text-center">
                      {s.autoConfirm ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Auto</span> : <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">Manual</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {s.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">▶ Faol</span> : <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">⏸ Pauza</span>}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleActive(s.id)} className={`p-1.5 rounded ${s.active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`} title={s.active ? "Pauza" : "Davom"}>
                          {s.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-emerald-800">Avtomatik takroriy zakaz nima?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Klient haftalik/oylik bir xil tovar to'plamini sotib oladigan bo'lsa — uni avtomatlashtirish mumkin.
                Belgilangan kunda tizim avtomatik zakaz yaratadi va (auto-confirm bo'lsa) yetkazib berishga yuboradi.
                Champions klientlar bilan ishlash uchun ideal vosita.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
