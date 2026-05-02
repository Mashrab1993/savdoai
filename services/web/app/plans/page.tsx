"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Rocket, Target, BarChart3, MapPin, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

export default function PlansPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🚀 Rejalashtirish</h1>
            <p className="text-base text-slate-500 mt-1">Plan setup · Outlet targeting · Product targets</p>
          </div>
          <Button size="lg"><Plus className="w-5 h-5" /> Yangi plan</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlanCard icon={Target} title="Asosiy plan" desc="Oylik visit + sotuv + KPI rejasi" href="/plans/main" stats={[
            { label: 'Qo\'yilgan', value: '0/6 agent' },
            { label: 'Faol', value: 'May 2026' },
          ]} color="emerald" />
          <PlanCard icon={MapPin} title="Outlet targeting" desc="Har klient uchun maxsus target" href="/plans/outlet" stats={[
            { label: 'Targetlangan', value: '0/129 klient' },
          ]} color="blue" />
          <PlanCard icon={BarChart3} title="Tovar bo'yicha plan" desc="Har brand × agent target" href="/plans/product" stats={[
            { label: 'Brendlar', value: '50+' },
          ]} color="purple" />
        </div>

        {/* Today's progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-600" /> Bugungi reja vs fakt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProgressBlock label="Visit" plan={1042} fact={0} />
            <ProgressBlock label="Sotuv" plan={155_170_315} fact={22_068_830} suffix=" so'm" />
            <ProgressBlock label="SKU" plan={6500} fact={0} />
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Eslatma:</strong> Plan o'rnatish — kompaniya rivojining muhim bosqichi. SalesDoc'dagi kabi har agent uchun alohida visit/sotuv/SKU targetlari ko'rsatish — bajarilish darajasini real-time tracking bilan kuzatish imkonini beradi.
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}

function PlanCard({ icon: Icon, title, desc, href, stats, color }: any) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
  }
  return (
    <Link href={href}>
      <Card className={`bg-gradient-to-br ${colors[color]} text-white border-0 p-5 hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer h-full`}>
        <Icon className="w-8 h-8 opacity-80 mb-3" />
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm opacity-90 mb-4">{desc}</p>
        <div className="space-y-1 border-t border-white/20 pt-3">
          {stats.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="opacity-75">{s.label}</span>
              <span className="font-semibold">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold mt-3">
          O'tish <ArrowRight className="w-4 h-4" />
        </div>
      </Card>
    </Link>
  )
}

function ProgressBlock({ label, plan, fact, suffix = "" }: { label: string; plan: number; fact: number; suffix?: string }) {
  const pct = plan > 0 ? Math.min((fact / plan) * 100, 100) : 0
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold tabular-nums">{fact.toLocaleString()}</span>
        <span className="text-sm text-slate-400">/ {plan.toLocaleString()}{suffix}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${pct < 30 ? 'bg-rose-500' : pct < 70 ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`text-xs mt-1 font-semibold ${pct < 30 ? 'text-rose-600' : pct < 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
        {pct.toFixed(1)}% bajarildi
      </div>
    </div>
  )
}
