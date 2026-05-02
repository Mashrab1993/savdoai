"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Award, Users, Truck, Save, Plus } from "lucide-react"
import Link from "next/link"

const ROLES = [
  { key: 'agent', label: 'Agentlar', icon: Users, count: 6 },
  { key: 'supervisor', label: 'Supervайzerlar', icon: Award, count: 2 },
  { key: 'expeditor', label: 'Ekspeditorlar', icon: Truck, count: 5 },
]

const AGENT_KPIS = [
  { name: "Babadjanova Nargiza", visit_plan: 261, visit_fact: 0, sum_plan: 25_000_000, sum_fact: 0, sku_plan: 1500, sku_fact: 0 },
  { name: "Berdiyev Rahmatillo", visit_plan: 172, visit_fact: 0, sum_plan: 18_000_000, sum_fact: 0, sku_plan: 1000, sku_fact: 0 },
  { name: "BORIEV MIRJALOL", visit_plan: 282, visit_fact: 0, sum_plan: 30_000_000, sum_fact: 0, sku_plan: 1800, sku_fact: 0 },
  { name: "Sayitqulov Mashrab", visit_plan: 127, visit_fact: 0, sum_plan: 12_000_000, sum_fact: 0, sku_plan: 700, sku_fact: 0 },
  { name: "ДАВЛАТ", visit_plan: 186, visit_fact: 0, sum_plan: 20_000_000, sum_fact: 0, sku_plan: 1200, sku_fact: 0 },
  { name: "Турсунов Жамшид", visit_plan: 14, visit_fact: 0, sum_plan: 2_000_000, sum_fact: 0, sku_plan: 100, sku_fact: 0 },
]

export default function KPIPage() {
  const [activeRole, setActiveRole] = useState<'agent' | 'supervisor' | 'expeditor'>('agent')

  const totalVisit = AGENT_KPIS.reduce((s, a) => s + a.visit_plan, 0)
  const totalSum = AGENT_KPIS.reduce((s, a) => s + a.sum_plan, 0)
  const totalSKU = AGENT_KPIS.reduce((s, a) => s + a.sku_plan, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/komanda" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> KOMANDA
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                KPI <span className="italic text-[#C75D3C]">boshqaruv</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Plan vs Fact · Har 3 role uchun alohida
              </p>
            </div>
            <Button size="lg" style={{ background: "#C75D3C" }}>
              <Plus className="w-5 h-5" /> Yangi plan
            </Button>
          </div>

          {/* Role tabs */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-x-auto">
            <div className="flex border-b border-[#E8E0D3]">
              {ROLES.map(r => {
                const Icon = r.icon
                const active = activeRole === r.key
                return (
                  <button
                    key={r.key}
                    onClick={() => setActiveRole(r.key as any)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium ${
                      active ? 'border-[#C75D3C] text-[#C75D3C] bg-[#FCE9DD]/30' : 'border-transparent text-[#6B5B4D] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {r.label}
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      active ? 'bg-[#C75D3C] text-white' : 'bg-[#E8E0D3] text-[#6B5B4D]'
                    }`}>{r.count}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* KPI summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Visit reja" value={totalVisit.toLocaleString()} sub="Bajarildi: 0 / 0%" accent="#10B981" />
            <SummaryCard label="Sotuv reja" value={`${(totalSum / 1_000_000).toFixed(0)}M`} sub="Bajarildi: 0 so'm / 0%" accent="#3B82F6" />
            <SummaryCard label="SKU reja" value={totalSKU.toLocaleString()} sub="Bajarildi: 0 / 0%" accent="#C75D3C" />
          </div>

          {/* KPI per agent */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E8E0D3] bg-[#FAF7F2] flex items-center justify-between">
              <h3 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{ROLES.find(r => r.key === activeRole)?.label} KPI</h3>
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Save className="w-4 h-4" /> Saqlash</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" rowSpan={2}>Agent</th>
                    <th className="text-center px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-x border-[#E8E0D3]" colSpan={3}>Visit</th>
                    <th className="text-center px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-r border-[#E8E0D3]" colSpan={3}>Sotuv</th>
                    <th className="text-center px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" colSpan={3}>SKU</th>
                  </tr>
                  <tr>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E] border-l border-[#E8E0D3]">Reja</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E]">Fakt</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E] border-r border-[#E8E0D3]">%</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E]">Reja</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E]">Fakt</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E] border-r border-[#E8E0D3]">%</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E]">Reja</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E]">Fakt</th>
                    <th className="text-right px-3 py-2 text-xs text-[#9C8A6E]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENT_KPIS.map(a => {
                    const visitPct = a.visit_plan > 0 ? (a.visit_fact / a.visit_plan) * 100 : 0
                    const sumPct = a.sum_plan > 0 ? (a.sum_fact / a.sum_plan) * 100 : 0
                    const skuPct = a.sku_plan > 0 ? (a.sku_fact / a.sku_plan) * 100 : 0
                    const pctClass = (p: number) => p < 50 ? 'text-[#C75D3C]' : p < 80 ? 'text-[#D97706]' : 'text-emerald-700'
                    return (
                      <tr key={a.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]">{a.name}</td>
                        <td className="px-3 py-3 text-right tabular-nums border-l border-[#E8E0D3]">
                          <input type="number" defaultValue={a.visit_plan} className="w-20 text-right h-8 px-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded text-[#1A1A1A]" />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-[#1A1A1A]">{a.visit_fact}</td>
                        <td className={`px-3 py-3 text-right tabular-nums font-medium border-r border-[#E8E0D3] ${pctClass(visitPct)}`}>{visitPct.toFixed(0)}%</td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <input type="number" defaultValue={a.sum_plan} className="w-28 text-right h-8 px-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded text-[#1A1A1A]" />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-[#1A1A1A]">{a.sum_fact.toLocaleString()}</td>
                        <td className={`px-3 py-3 text-right tabular-nums font-medium border-r border-[#E8E0D3] ${pctClass(sumPct)}`}>{sumPct.toFixed(0)}%</td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <input type="number" defaultValue={a.sku_plan} className="w-20 text-right h-8 px-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded text-[#1A1A1A]" />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-[#1A1A1A]">{a.sku_fact}</td>
                        <td className={`px-3 py-3 text-right tabular-nums font-medium ${pctClass(skuPct)}`}>{skuPct.toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-4xl font-medium tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-sm text-[#9C8A6E] mt-2">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
