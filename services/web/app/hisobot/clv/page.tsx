"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Calendar, Download, Crown, Users } from "lucide-react"
import Link from "next/link"

type ClientCLV = {
  id: number; name: string; segment: string; firstOrder: string;
  monthsActive: number; totalOrders: number; totalSpent: number;
  avgOrderValue: number; orderFrequency: number;
  predictedClv: number; predictedMonths: number;
  retention: number;
}

const CLIENTS: ClientCLV[] = [
  { id: 1024, name: "Salom Magazin №1", segment: "Champions", firstOrder: "2024-08-12", monthsActive: 21, totalOrders: 168, totalSpent: 28_400_000, avgOrderValue: 169_000, orderFrequency: 8, predictedClv: 84_000_000, predictedMonths: 60, retention: 95 },
  { id: 1142, name: "Дастархон Сервис", segment: "Champions", firstOrder: "2024-09-10", monthsActive: 20, totalOrders: 142, totalSpent: 24_800_000, avgOrderValue: 175_000, orderFrequency: 7, predictedClv: 72_000_000, predictedMonths: 60, retention: 92 },
  { id: 1058, name: "Bona Магазин", segment: "Loyal", firstOrder: "2024-12-05", monthsActive: 17, totalOrders: 84, totalSpent: 18_200_000, avgOrderValue: 217_000, orderFrequency: 5, predictedClv: 54_400_000, predictedMonths: 48, retention: 88 },
  { id: 1224, name: "Гулямов Маркет", segment: "Loyal", firstOrder: "2025-02-01", monthsActive: 15, totalOrders: 64, totalSpent: 12_800_000, avgOrderValue: 200_000, orderFrequency: 4, predictedClv: 42_000_000, predictedMonths: 48, retention: 84 },
  { id: 1342, name: "Bona Maxsus Магазин", segment: "Potential", firstOrder: "2025-09-18", monthsActive: 8, totalOrders: 18, totalSpent: 4_240_000, avgOrderValue: 235_000, orderFrequency: 2, predictedClv: 18_400_000, predictedMonths: 36, retention: 76 },
  { id: 1456, name: "Yangi Magazin Чорсу", segment: "New", firstOrder: "2026-04-01", monthsActive: 1, totalOrders: 4, totalSpent: 720_000, avgOrderValue: 180_000, orderFrequency: 4, predictedClv: 12_400_000, predictedMonths: 36, retention: 0 },
  { id: 1389, name: "Ali Ake Магазин", segment: "At Risk", firstOrder: "2024-10-15", monthsActive: 19, totalOrders: 28, totalSpent: 6_800_000, avgOrderValue: 243_000, orderFrequency: 1.5, predictedClv: 8_400_000, predictedMonths: 12, retention: 42 },
  { id: 1402, name: "Гулямов Магазин Сирож", segment: "Hibernating", firstOrder: "2024-06-20", monthsActive: 23, totalOrders: 38, totalSpent: 8_400_000, avgOrderValue: 221_000, orderFrequency: 1, predictedClv: 4_200_000, predictedMonths: 6, retention: 18 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const SEGMENT_COLOR: Record<string, string> = {
  Champions: "bg-amber-100 text-amber-800",
  Loyal: "bg-emerald-100 text-emerald-700",
  Potential: "bg-blue-100 text-blue-700",
  New: "bg-violet-100 text-violet-700",
  "At Risk": "bg-rose-100 text-rose-700",
  Hibernating: "bg-slate-100 text-slate-700",
}

export default function ClvPage() {
  const sorted = [...CLIENTS].sort((a, b) => b.predictedClv - a.predictedClv)
  const totalClv = CLIENTS.reduce((s, c) => s + c.predictedClv, 0)
  const avgClv = Math.round(totalClv / CLIENTS.length)
  const totalCurrent = CLIENTS.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Klient hayot qiymati (CLV)</h1>
            <p className="text-sm text-slate-500">Customer Lifetime Value bashorati · {CLIENTS.length} ta klient</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 12-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Crown className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Hozirgi tushum</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalCurrent / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Bashorat CLV (jami)</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalClv / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Users className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">O'rtacha CLV</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(avgClv / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Crown className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Top-1 klient CLV</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(sorted[0].predictedClv / 1_000_000)} M</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">CLV jadvali (bashorat asosida)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Klient</th>
                  <th className="py-3 px-2 text-center">Segment</th>
                  <th className="py-3 px-2 text-right">Birinchi xarid</th>
                  <th className="py-3 px-2 text-right">Aktivlik (oy)</th>
                  <th className="py-3 px-2 text-right">Hozirgi tushum</th>
                  <th className="py-3 px-2 text-right">O'rta zakaz</th>
                  <th className="py-3 px-2 text-right">Zakaz/oy</th>
                  <th className="py-3 px-2 text-right">Retention %</th>
                  <th className="py-3 px-2 text-right">Bashorat CLV</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold">
                        {i < 3 && <span className="mr-1">{["🥇", "🥈", "🥉"][i]}</span>}
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">#{c.id}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${SEGMENT_COLOR[c.segment] ?? "bg-slate-100 text-slate-700"}`}>{c.segment}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{c.firstOrder}</td>
                    <td className="py-3 px-2 text-right font-mono">{c.monthsActive}</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-700 font-bold">{fmt(c.totalSpent / 1_000_000)} M</td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(c.avgOrderValue)}</td>
                    <td className="py-3 px-2 text-right font-mono">{c.orderFrequency.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${c.retention >= 80 ? "bg-emerald-100 text-emerald-700" : c.retention >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {c.retention}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-blue-700">{fmt(c.predictedClv / 1_000_000)} M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
            💡 CLV formula: <span className="font-mono">avgOrderValue × orderFrequency × predictedMonths × retention%</span>
          </div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">📈 Strategiya tavsiyalari</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>• <span className="font-bold">Champions/Loyal</span> ({CLIENTS.filter(c => c.segment === "Champions" || c.segment === "Loyal").length} klient) — VIP xizmat, premium tovar, alohida menejer</li>
            <li>• <span className="font-bold">Potential/New</span> ({CLIENTS.filter(c => c.segment === "Potential" || c.segment === "New").length} klient) — onboarding, chegirma, pastdan-yuqoriga ko'tarilish strategiyasi</li>
            <li>• <span className="font-bold">At Risk/Hibernating</span> ({CLIENTS.filter(c => c.segment === "At Risk" || c.segment === "Hibernating").length} klient) — reaktivatsiya kampaniya, agressiv promo, qo'ng'iroq</li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  )
}
