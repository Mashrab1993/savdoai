"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, TrendingUp, Calendar, Download, Award } from "lucide-react"
import Link from "next/link"

type Agent = {
  id: number; name: string; visits: number; visitsPlanned: number; orders: number;
  revenue: number; targetRevenue: number; clients: number; activeClients: number;
  avgOrderSum: number; conversionRate: number; rating: number;
}

const AGENTS: Agent[] = [
  { id: 1, name: "Babadjanova Nargiza", visits: 218, visitsPlanned: 248, orders: 184, revenue: 28_400_000, targetRevenue: 25_000_000, clients: 84, activeClients: 62, avgOrderSum: 154_000, conversionRate: 84, rating: 4.8 },
  { id: 2, name: "BORIEV MIRJALOL", visits: 248, visitsPlanned: 282, orders: 196, revenue: 36_400_000, targetRevenue: 30_000_000, clients: 102, activeClients: 84, avgOrderSum: 186_000, conversionRate: 79, rating: 4.7 },
  { id: 3, name: "Berdiyev Rahmatillo", visits: 192, visitsPlanned: 216, orders: 162, revenue: 24_800_000, targetRevenue: 22_000_000, clients: 72, activeClients: 58, avgOrderSum: 153_000, conversionRate: 84, rating: 4.6 },
  { id: 4, name: "ДАВЛАТ", visits: 248, visitsPlanned: 288, orders: 198, revenue: 31_200_000, targetRevenue: 28_000_000, clients: 96, activeClients: 78, avgOrderSum: 158_000, conversionRate: 80, rating: 4.5 },
  { id: 5, name: "Sayitqulov Mashrab", visits: 84, visitsPlanned: 108, orders: 68, revenue: 11_200_000, targetRevenue: 12_000_000, clients: 36, activeClients: 28, avgOrderSum: 165_000, conversionRate: 81, rating: 4.4 },
  { id: 6, name: "Турсунов Жамшед", visits: 96, visitsPlanned: 144, orders: 64, revenue: 14_800_000, targetRevenue: 18_000_000, clients: 48, activeClients: 32, avgOrderSum: 231_000, conversionRate: 67, rating: 3.9 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const RANK_BADGE = ["bg-amber-100 text-amber-800 border-amber-300", "bg-slate-100 text-slate-700 border-slate-300", "bg-orange-100 text-orange-700 border-orange-300"]
const RANK_ICON = ["🥇", "🥈", "🥉"]

export default function AgentPerformancePage() {
  const sorted = [...AGENTS].sort((a, b) => b.revenue - a.revenue)
  const totalRevenue = AGENTS.reduce((s, a) => s + a.revenue, 0)
  const totalTarget = AGENTS.reduce((s, a) => s + a.targetRevenue, 0)
  const overall = Math.round((totalRevenue / totalTarget) * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Agent KPI rating</h1>
            <p className="text-sm text-slate-500">{AGENTS.length} agent · jami {fmt(totalRevenue / 1_000_000)}M / {fmt(totalTarget / 1_000_000)}M ({overall}%)</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sorted.slice(0, 3).map((a, i) => (
            <Card key={a.id} className={`p-5 border-2 ${RANK_BADGE[i]}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{RANK_ICON[i]}</div>
                <div>
                  <div className="text-xs font-semibold opacity-70">RANK {i + 1}</div>
                  <div className="text-base font-bold">{a.name}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-70">Tushum</span>
                  <span className="font-mono font-bold">{fmt(a.revenue / 1_000_000)} M</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Plan%</span>
                  <span className="font-mono font-bold">{Math.round((a.revenue / a.targetRevenue) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Reyting</span>
                  <span className="font-mono font-bold">{a.rating.toFixed(1)} ⭐</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" /> Agent KPI table
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Agent</th>
                  <th className="py-3 px-2 text-right">Vizit (reja/fakt)</th>
                  <th className="py-3 px-2 text-right">Zakazlar</th>
                  <th className="py-3 px-2 text-right">Klientlar (active/total)</th>
                  <th className="py-3 px-2 text-right">O'rta zakaz</th>
                  <th className="py-3 px-2 text-right">Konversiya</th>
                  <th className="py-3 px-2 text-right">Tushum</th>
                  <th className="py-3 px-2">Plan%</th>
                  <th className="py-3 px-2 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, i) => {
                  const planPct = Math.round((a.revenue / a.targetRevenue) * 100)
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-400">{i + 1}</td>
                      <td className="py-3 px-2 font-semibold">
                        <Link href="#" className="text-blue-700 hover:underline flex items-center gap-2">
                          {i < 3 && <span>{RANK_ICON[i]}</span>}
                          {a.name}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-xs">{a.visitsPlanned} / <span className="font-bold">{a.visits}</span></td>
                      <td className="py-3 px-2 text-right font-mono">{a.orders}</td>
                      <td className="py-3 px-2 text-right font-mono text-xs">
                        <span className="text-emerald-700 font-bold">{a.activeClients}</span> / {a.clients}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{fmt(a.avgOrderSum)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${a.conversionRate >= 80 ? "bg-emerald-100 text-emerald-700" : a.conversionRate >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {a.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(a.revenue)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden min-w-[80px]">
                            <div className={`h-full ${planPct >= 100 ? "bg-emerald-500" : planPct >= 85 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, planPct)}%` }} />
                          </div>
                          <span className={`text-xs font-bold font-mono w-10 text-right ${planPct >= 100 ? "text-emerald-700" : planPct >= 85 ? "text-amber-700" : "text-rose-700"}`}>{planPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold flex items-center justify-center gap-0.5">
                          <Award className={`w-4 h-4 ${a.rating >= 4.5 ? "text-amber-500" : a.rating >= 4.0 ? "text-slate-400" : "text-rose-400"}`} />
                          {a.rating.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <div className="flex-1">
              <h3 className="text-lg font-bold">Komanda umumiy ko'rsatkichi</h3>
              <p className="text-sm text-slate-600 mt-1">
                Jami {fmt(totalRevenue)} so'm tushum / target {fmt(totalTarget)} so'm
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold font-mono ${overall >= 100 ? "text-emerald-700" : overall >= 85 ? "text-amber-700" : "text-rose-700"}`}>
                {overall}%
              </div>
              <div className="text-xs text-slate-600">plan bajarish</div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
