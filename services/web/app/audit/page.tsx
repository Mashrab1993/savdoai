"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Camera, ClipboardCheck, BarChart3, DollarSign, Layers, MapPin } from "lucide-react"
import Link from "next/link"

const AUDIT_MODULES = [
  {
    href: "/audit/dashboard",
    icon: BarChart3,
    title: "Kunlik dashboard",
    desc: "Mercendaiizer holati real-time",
    color: "from-emerald-500 to-teal-600",
    stats: { primary: "1042 reja", secondary: "0 bajarildi" },
  },
  {
    href: "/audit/audits",
    icon: ClipboardCheck,
    title: "Tekshirishlar",
    desc: "Audit yozuvlari (14 ta)",
    color: "from-blue-500 to-indigo-600",
    stats: { primary: "14 audit", secondary: "Bugun" },
  },
  {
    href: "/audit/facing",
    icon: Layers,
    title: "Doля polki",
    desc: "Shelf share % vs raqobatchilar",
    color: "from-amber-500 to-orange-600",
    stats: { primary: "—", secondary: "Filter kerak" },
  },
  {
    href: "/audit/sku",
    icon: Eye,
    title: "SKU присутствие",
    desc: "Out-of-stock detection",
    color: "from-purple-500 to-pink-600",
    stats: { primary: "—", secondary: "Foto kutilmoqda" },
  },
  {
    href: "/audit/price",
    icon: DollarSign,
    title: "Анализ цен",
    desc: "Raqobatchilar narxi tahlili",
    color: "from-rose-500 to-red-600",
    stats: { primary: "—", secondary: "Foto kerak" },
  },
  {
    href: "/audit/merchandising",
    icon: ClipboardCheck,
    title: "Merchandising",
    desc: "Display compliance opros",
    color: "from-cyan-500 to-blue-600",
    stats: { primary: "—", secondary: "Bugun" },
  },
  {
    href: "/audit/storecheck",
    icon: MapPin,
    title: "Storecheck",
    desc: "Magazinni to'liq tekshirish protokoli",
    color: "from-violet-500 to-purple-600",
    stats: { primary: "—", secondary: "Bugun" },
  },
  {
    href: "/audit/photo",
    icon: Camera,
    title: "Foto reyting",
    desc: "Foto reportlar baholash",
    color: "from-pink-500 to-rose-600",
    stats: { primary: "0%", secondary: "Bugun" },
  },
]

const AGENT_KPIS = [
  { name: "Babadjanova Nargiza", visits: 261, done: 0, refusal: 18, no_show: 243, sku: 0, facing: 0, photo: 0 },
  { name: "Berdiyev Rahmatillo", visits: 172, done: 0, refusal: 12, no_show: 160, sku: 0, facing: 0, photo: 0 },
  { name: "BORIEV MIRJALOL", visits: 282, done: 0, refusal: 0, no_show: 282, sku: 0, facing: 0, photo: 0 },
  { name: "Sayitqulov Mashrab", visits: 127, done: 0, refusal: 0, no_show: 127, sku: 0, facing: 0, photo: 0 },
  { name: "ДАВЛАТ", visits: 186, done: 0, refusal: 8, no_show: 178, sku: 0, facing: 0, photo: 0 },
  { name: "Турсунов Жамшид", visits: 14, done: 0, refusal: 0, no_show: 14, sku: 0, facing: 0, photo: 0 },
]

export default function AuditPage() {
  const totalVisits = AGENT_KPIS.reduce((s, a) => s + a.visits, 0)
  const totalDone = AGENT_KPIS.reduce((s, a) => s + a.done, 0)
  const totalRefusal = AGENT_KPIS.reduce((s, a) => s + a.refusal, 0)
  const totalNoShow = AGENT_KPIS.reduce((s, a) => s + a.no_show, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit / Merchandising</h1>
          <p className="text-base text-slate-500 mt-1">Магазин va polka tekshiruvi · Field marketing analytics</p>
        </div>

        {/* 6 KPI summary */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <KpiSquare label="Visit" value="0%" subtext={`0/${totalVisits}`} color="emerald" />
          <KpiSquare label="Не посещ." value="96%" subtext={`${totalNoShow}/${totalVisits}`} color="rose" />
          <KpiSquare label="SKU" value="0%" color="amber" />
          <KpiSquare label="Facing" value="0%" color="blue" />
          <KpiSquare label="Mercendaizing" value="0%" color="purple" />
          <KpiSquare label="Foto" value="0%" color="pink" />
        </div>

        {/* 8 module cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AUDIT_MODULES.map(m => {
            const Icon = m.icon
            return (
              <Link key={m.href} href={m.href}>
                <Card className={`relative overflow-hidden bg-gradient-to-br ${m.color} text-white border-0 p-5 hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer h-full`}>
                  <Icon className="w-8 h-8 opacity-80 mb-3" />
                  <div className="text-base font-bold mb-1">{m.title}</div>
                  <div className="text-xs opacity-90 mb-3">{m.desc}</div>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="text-xl font-bold tabular-nums">{m.stats.primary}</div>
                    <div className="text-xs opacity-75">{m.stats.secondary}</div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Merchandiser KPI table */}
        <Card>
          <div className="p-4 border-b border-slate-200 bg-amber-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-amber-600" /> Mercendaiizerlar — Bugungi holat
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">Plan vs Fact — har agent kunlik visit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Agent</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Reja</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Bajardi</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Otkaz</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Bormagan</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">SKU</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Facing</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AGENT_KPIS.map(a => (
                  <tr key={a.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-base font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.visits}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-600 font-semibold">{a.done}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-600">{a.refusal}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{a.no_show}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.sku}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.facing}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.photo}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="px-4 py-3">Jami</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalVisits}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalDone}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalRefusal}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{totalNoShow}</td>
                  <td className="px-4 py-3 text-right tabular-nums">0</td>
                  <td className="px-4 py-3 text-right tabular-nums">0</td>
                  <td className="px-4 py-3 text-right tabular-nums">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

function KpiSquare({ label, value, subtext, color }: { label: string; value: string; subtext?: string; color: 'emerald'|'rose'|'amber'|'blue'|'purple'|'pink' }) {
  const colors = {
    emerald: "from-emerald-500 to-teal-600",
    rose: "from-rose-500 to-pink-600",
    amber: "from-amber-500 to-orange-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-violet-600",
    pink: "from-pink-500 to-rose-600",
  }
  return (
    <Card className={`bg-gradient-to-br ${colors[color]} text-white border-0 p-4 text-center`}>
      <div className="text-xs opacity-90 mb-1">{label}</div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {subtext && <div className="text-xs opacity-75 mt-1">{subtext}</div>}
    </Card>
  )
}
