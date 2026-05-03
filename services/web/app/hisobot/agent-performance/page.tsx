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

const RANK_ACCENTS = ["#D97706", "#9C8A6E", "#C75D3C"]
const RANK_ICON = ["🥇", "🥈", "🥉"]

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function AgentPerformancePage() {
  const sorted = [...AGENTS].sort((a, b) => b.revenue - a.revenue)
  const totalRevenue = AGENTS.reduce((s, a) => s + a.revenue, 0)
  const totalTarget = AGENTS.reduce((s, a) => s + a.targetRevenue, 0)
  const overall = Math.round((totalRevenue / totalTarget) * 100)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Agent KPI <span className="italic text-[#C75D3C]">rating</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{AGENTS.length} agent · jami {fmt(totalRevenue / 1_000_000)}M / {fmt(totalTarget / 1_000_000)}M ({overall}%)</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sorted.slice(0, 3).map((a, i) => {
              const accent = RANK_ACCENTS[i]
              return (
                <Card key={a.id} className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl">{RANK_ICON[i]}</div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>RANK {i + 1}</div>
                      <div className="text-base font-medium text-[#1A1A1A]">{a.name}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#9C8A6E]">Tushum</span>
                      <span className="font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(a.revenue / 1_000_000)} M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9C8A6E]">Plan%</span>
                      <span className="font-mono tabular-nums text-[#1A1A1A]">{Math.round((a.revenue / a.targetRevenue) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9C8A6E]">Reyting</span>
                      <span className="font-mono tabular-nums text-[#1A1A1A]">{a.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#1A1A1A]" style={SERIF}>
              <Trophy className="w-5 h-5" style={{ color: "#D97706" }} /> Agent KPI table
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Vizit (reja/fakt)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakazlar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klientlar (active/total)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Konversiya</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Plan%</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a, i) => {
                    const planPct = Math.round((a.revenue / a.targetRevenue) * 100)
                    return (
                      <tr key={a.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#9C8A6E]">{i + 1}</td>
                        <td className="py-3 px-2 font-medium">
                          <Link href="#" className="text-[#C75D3C] hover:underline flex items-center gap-2">
                            {i < 3 && <span>{RANK_ICON[i]}</span>}
                            {a.name}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-xs text-[#6B5B4D]">{a.visitsPlanned} / <span className="font-medium text-[#1A1A1A]">{a.visits}</span></td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{a.orders}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-xs">
                          <span className="text-emerald-700 font-medium">{a.activeClients}</span> <span className="text-[#9C8A6E]">/ {a.clients}</span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(a.avgOrderSum)}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded font-mono tabular-nums font-medium text-xs ${a.conversionRate >= 80 ? "bg-emerald-50 text-emerald-700" : a.conversionRate >= 70 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                            {a.conversionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{fmt(a.revenue)}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#F0EAE0] rounded-full overflow-hidden min-w-[80px]">
                              <div className="h-full" style={{ width: `${Math.min(100, planPct)}%`, background: planPct >= 100 ? "#10B981" : planPct >= 85 ? "#D97706" : "#C75D3C" }} />
                            </div>
                            <span className="text-xs font-medium font-mono tabular-nums w-10 text-right" style={{ color: planPct >= 100 ? "#047857" : planPct >= 85 ? "#D97706" : "#C75D3C" }}>{planPct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-mono tabular-nums font-medium flex items-center justify-center gap-0.5 text-[#1A1A1A]">
                            <Award className="w-4 h-4" style={{ color: a.rating >= 4.5 ? "#D97706" : a.rating >= 4.0 ? "#9C8A6E" : "#C75D3C" }} />
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

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" style={{ color: overall >= 100 ? "#10B981" : overall >= 85 ? "#D97706" : "#C75D3C" }} />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-[#1A1A1A]" style={SERIF}>Komanda umumiy ko'rsatkichi</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  Jami {fmt(totalRevenue)} so'm tushum / target {fmt(totalTarget)} so'm
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-light font-mono tabular-nums" style={{ ...SERIF, color: overall >= 100 ? "#047857" : overall >= 85 ? "#D97706" : "#C75D3C" }}>
                  {overall}%
                </div>
                <div className="text-xs text-[#9C8A6E]">plan bajarish</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: overall >= 100 ? "#10B981" : overall >= 85 ? "#D97706" : "#C75D3C" }} />
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
