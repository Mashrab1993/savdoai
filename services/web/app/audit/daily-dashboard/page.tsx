"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Eye, EyeOff, ListChecks, BarChart3, CheckCircle2, Camera } from "lucide-react"
import Link from "next/link"

const KPIS = [
  { label: "Vizitlar", value: 0, total: 1042, color: "emerald", icon: Eye, dirChip: "Yashil" },
  { label: "Tashrif buyurilmagan", value: 96, total: 100, color: "rose", icon: EyeOff, dirChip: "Qizil" },
  { label: "SKU coverage", value: 0, total: 100, color: "blue", icon: ListChecks, dirChip: "Ko'k" },
  { label: "Facing", value: 0, total: 100, color: "emerald", icon: BarChart3, dirChip: "Yashil" },
  { label: "Merchandising", value: 0, total: 100, color: "violet", icon: CheckCircle2, dirChip: "Binafsha" },
  { label: "Foto-hisobot", value: 0, total: 100, color: "amber", icon: Camera, dirChip: "Sariq" },
]

type AgentRow = {
  agent: string; plannedVisits: number; visits: number; cancellations: number; missedVisits: number;
  facingPct: number; skuPct: number;
}

const AGENTS: AgentRow[] = [
  { agent: "Babadjanova Nargiza", plannedVisits: 261, visits: 0, cancellations: 18, missedVisits: 24, facingPct: 0, skuPct: 0 },
  { agent: "Berdiyev Rahmatillo", plannedVisits: 172, visits: 0, cancellations: 12, missedVisits: 16, facingPct: 0, skuPct: 0 },
  { agent: "BORIEV MIRJALOL", plannedVisits: 282, visits: 0, cancellations: 0, missedVisits: 25, facingPct: 0, skuPct: 0 },
  { agent: "Sayitqulov Mashrab", plannedVisits: 127, visits: 0, cancellations: 0, missedVisits: 12, facingPct: 0, skuPct: 0 },
  { agent: "ДАВЛАТ", plannedVisits: 186, visits: 0, cancellations: 8, missedVisits: 17, facingPct: 0, skuPct: 0 },
  { agent: "Турсунов Жамшед", plannedVisits: 14, visits: 0, cancellations: 0, missedVisits: 14, facingPct: 0, skuPct: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const tileMap: Record<string, { iconBg: string; iconText: string; bar: string; accent: string }> = {
  emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-700", bar: "bg-emerald-500", accent: "bg-emerald-500" },
  rose:    { iconBg: "bg-[#F5E5D6]", iconText: "text-[#C75D3C]", bar: "bg-[#C75D3C]", accent: "bg-[#C75D3C]" },
  blue:    { iconBg: "bg-blue-50",   iconText: "text-blue-700",   bar: "bg-blue-500",   accent: "bg-blue-500" },
  violet:  { iconBg: "bg-purple-50", iconText: "text-purple-700", bar: "bg-purple-500", accent: "bg-purple-500" },
  amber:   { iconBg: "bg-[#FCE9DD]", iconText: "text-[#D97706]", bar: "bg-[#D97706]", accent: "bg-[#D97706]" },
}

export default function DailyDashboardPage() {
  const totalPlanned = AGENTS.reduce((s, a) => s + a.plannedVisits, 0)
  const totalVisits = AGENTS.reduce((s, a) => s + a.visits, 0)
  const totalCancellations = AGENTS.reduce((s, a) => s + a.cancellations, 0)
  const totalMissed = AGENTS.reduce((s, a) => s + a.missedVisits, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Kunlik audit <span className="italic text-[#C75D3C]">dashboard</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Mercendayzer va agent vizit ko'rsatkichlari</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 02.05.2026</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KPIS.map((k, i) => {
              const Icon = k.icon
              const t = tileMap[k.color]
              const pct = Math.min(100, Math.round((k.value / k.total) * 100))
              return (
                <Card key={i} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${t.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${t.iconText}`} />
                    </div>
                    <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">{k.label}</span>
                  </div>
                  <div className="text-4xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {k.value}<span className="text-xl ml-1 text-[#9C8A6E]">%</span>
                  </div>
                  <div className="mt-4 h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden">
                    <div className={`h-full ${t.bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-px ${t.accent}`} />
                </Card>
              )
            })}
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E0D3]">
              <h2 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Мерчендайзеры
              </h2>
              <span className="text-xs uppercase tracking-wider text-[#9C8A6E]">По 50</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Запланир. визиты</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Визиты</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Отказы</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Непосещенные</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Facing %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU %</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map(a => (
                    <tr key={a.agent} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-medium">
                        <Link href="#" className="text-[#C75D3C] hover:underline">{a.agent}</Link>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(a.plannedVisits)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#6B5B4D]">{a.visits}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#6B5B4D]">{a.cancellations}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums">
                        <span className="px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C]">{a.missedVisits}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#6B5B4D]">{a.facingPct}%</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#6B5B4D]">{a.skuPct}%</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium">
                    <td className="py-3 px-2 text-[#1A1A1A]">Total</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalPlanned)}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{totalVisits}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{totalCancellations}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{totalMissed}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">—</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-center text-xs text-[#9C8A6E]">
              1 - {AGENTS.length} / {AGENTS.length}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
