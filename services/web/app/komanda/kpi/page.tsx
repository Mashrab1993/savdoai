"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Award, Users, Truck, Save, Plus } from "lucide-react"
import Link from "next/link"

const ROLES = [
  { key: 'agent', label: 'Agentlar', icon: Users, count: 6, color: 'emerald' },
  { key: 'supervisor', label: 'Supervайzerlar', icon: Award, count: 2, color: 'blue' },
  { key: 'expeditor', label: 'Ekspeditorlar', icon: Truck, count: 5, color: 'amber' },
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
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/komanda" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Komanda
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🎯 KPI boshqaruv</h1>
            <p className="text-base text-slate-500 mt-1">Plan vs Fact · Har 3 role uchun alohida</p>
          </div>
          <Button size="lg">
            <Plus className="w-5 h-5" /> Yangi plan
          </Button>
        </div>

        {/* Role tabs */}
        <Card className="overflow-x-auto">
          <div className="flex border-b border-slate-200">
            {ROLES.map(r => {
              const Icon = r.icon
              const active = activeRole === r.key
              return (
                <button
                  key={r.key}
                  onClick={() => setActiveRole(r.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    active ? 'border-emerald-600 text-emerald-700 font-semibold bg-emerald-50/50' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {r.label}
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>{r.count}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* KPI summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 p-5">
            <div className="text-sm opacity-90 mb-2">Visit reja</div>
            <div className="text-4xl font-bold tabular-nums">{totalVisit.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-2">Bajarildi: 0 / 0%</div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 p-5">
            <div className="text-sm opacity-90 mb-2">Sotuv reja</div>
            <div className="text-4xl font-bold tabular-nums">{(totalSum / 1_000_000).toFixed(0)}M</div>
            <div className="text-sm opacity-80 mt-2">Bajarildi: 0 so'm / 0%</div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 p-5">
            <div className="text-sm opacity-90 mb-2">SKU reja</div>
            <div className="text-4xl font-bold tabular-nums">{totalSKU.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-2">Bajarildi: 0 / 0%</div>
          </Card>
        </div>

        {/* KPI per agent */}
        <Card>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{ROLES.find(r => r.key === activeRole)?.label} KPI</h3>
            <Button variant="outline"><Save className="w-4 h-4" /> Saqlash</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold" rowSpan={2}>Agent</th>
                  <th className="text-center px-3 py-3 text-sm font-semibold border-x border-slate-200" colSpan={3}>Visit</th>
                  <th className="text-center px-3 py-3 text-sm font-semibold border-r border-slate-200" colSpan={3}>Sotuv</th>
                  <th className="text-center px-3 py-3 text-sm font-semibold" colSpan={3}>SKU</th>
                </tr>
                <tr>
                  <th className="text-right px-3 py-2 text-xs text-slate-500 border-l border-slate-200">Reja</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500">Fakt</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500 border-r border-slate-200">%</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500">Reja</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500">Fakt</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500 border-r border-slate-200">%</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500">Reja</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500">Fakt</th>
                  <th className="text-right px-3 py-2 text-xs text-slate-500">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AGENT_KPIS.map(a => {
                  const visitPct = a.visit_plan > 0 ? (a.visit_fact / a.visit_plan) * 100 : 0
                  const sumPct = a.sum_plan > 0 ? (a.sum_fact / a.sum_plan) * 100 : 0
                  const skuPct = a.sku_plan > 0 ? (a.sku_fact / a.sku_plan) * 100 : 0
                  return (
                    <tr key={a.name} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-3 py-3 text-right tabular-nums border-l border-slate-200">
                        <input type="number" defaultValue={a.visit_plan} className="w-20 text-right h-8 px-2 border rounded" />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{a.visit_fact}</td>
                      <td className={`px-3 py-3 text-right tabular-nums font-semibold border-r border-slate-200 ${visitPct < 50 ? 'text-rose-600' : visitPct < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{visitPct.toFixed(0)}%</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <input type="number" defaultValue={a.sum_plan} className="w-28 text-right h-8 px-2 border rounded" />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{a.sum_fact.toLocaleString()}</td>
                      <td className={`px-3 py-3 text-right tabular-nums font-semibold border-r border-slate-200 ${sumPct < 50 ? 'text-rose-600' : sumPct < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{sumPct.toFixed(0)}%</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <input type="number" defaultValue={a.sku_plan} className="w-20 text-right h-8 px-2 border rounded" />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{a.sku_fact}</td>
                      <td className={`px-3 py-3 text-right tabular-nums font-semibold ${skuPct < 50 ? 'text-rose-600' : 'text-emerald-600'}`}>{skuPct.toFixed(0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
