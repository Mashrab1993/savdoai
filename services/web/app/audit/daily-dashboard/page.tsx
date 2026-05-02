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

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rose: "bg-rose-50 border-rose-200 text-rose-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
}
const barMap: Record<string, string> = {
  emerald: "bg-emerald-500", rose: "bg-rose-500", blue: "bg-blue-500", violet: "bg-violet-500", amber: "bg-amber-500",
}

export default function DailyDashboardPage() {
  const totalPlanned = AGENTS.reduce((s, a) => s + a.plannedVisits, 0)
  const totalVisits = AGENTS.reduce((s, a) => s + a.visits, 0)
  const totalCancellations = AGENTS.reduce((s, a) => s + a.cancellations, 0)
  const totalMissed = AGENTS.reduce((s, a) => s + a.missedVisits, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Kunlik audit dashboard</h1>
            <p className="text-sm text-slate-500">Mercendayzer va agent vizit ko'rsatkichlari</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 02.05.2026</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KPIS.map((k, i) => {
            const Icon = k.icon
            const pct = Math.min(100, Math.round((k.value / k.total) * 100))
            return (
              <Card key={i} className={`p-5 border ${colorMap[k.color]}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl font-bold font-mono">{k.value}<span className="text-base ml-1">%</span></div>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold mb-2">{k.label}</div>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full ${barMap[k.color]} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-200">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-orange-500 rounded-sm" />
              Мерчендайзеры
            </h2>
            <span className="text-xs text-slate-500">По 50</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Agent</th>
                  <th className="py-3 px-2 text-right">Запланир. визиты</th>
                  <th className="py-3 px-2 text-right">Визиты</th>
                  <th className="py-3 px-2 text-right">Отказы</th>
                  <th className="py-3 px-2 text-right">Непосещенные</th>
                  <th className="py-3 px-2 text-right">Facing %</th>
                  <th className="py-3 px-2 text-right">SKU %</th>
                </tr>
              </thead>
              <tbody>
                {AGENTS.map(a => (
                  <tr key={a.agent} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-semibold">
                      <Link href="#" className="text-blue-700 hover:underline">{a.agent}</Link>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(a.plannedVisits)}</td>
                    <td className="py-3 px-2 text-right font-mono">{a.visits}</td>
                    <td className="py-3 px-2 text-right font-mono">{a.cancellations}</td>
                    <td className="py-3 px-2 text-right font-mono">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700">{a.missedVisits}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{a.facingPct}%</td>
                    <td className="py-3 px-2 text-right font-mono">{a.skuPct}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="py-3 px-2">Total</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(totalPlanned)}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalVisits}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalCancellations}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalMissed}</td>
                  <td className="py-3 px-2 text-right font-mono">—</td>
                  <td className="py-3 px-2 text-right font-mono">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-center text-xs text-slate-500">
            1 - {AGENTS.length} / {AGENTS.length}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
