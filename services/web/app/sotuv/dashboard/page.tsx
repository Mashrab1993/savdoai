"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download, Target, Zap, Users, DollarSign, Package } from "lucide-react"
import Link from "next/link"

const TODAY_KPIS = [
  { label: "Bugungi tushum", value: 12_840_000, target: 15_000_000, change: 8.4, icon: DollarSign, color: "emerald" },
  { label: "Bugungi zakazlar", value: 38, target: 42, change: -4.2, icon: Package, color: "blue" },
  { label: "Yangi klientlar", value: 4, target: 5, change: 33.3, icon: Users, color: "violet" },
  { label: "Konversiya %", value: 78, target: 80, change: 2.1, icon: Target, color: "amber" },
]

const HOURLY = [
  { hour: "08", sales: 240_000 },
  { hour: "09", sales: 580_000 },
  { hour: "10", sales: 1_240_000 },
  { hour: "11", sales: 1_860_000 },
  { hour: "12", sales: 2_140_000 },
  { hour: "13", sales: 980_000 },
  { hour: "14", sales: 1_680_000 },
  { hour: "15", sales: 1_840_000 },
  { hour: "16", sales: 1_280_000 },
  { hour: "17", sales: 880_000 },
  { hour: "18", sales: 120_000 },
]

const TOP_AGENTS = [
  { name: "BORIEV M.", sales: 3_840_000, orders: 12 },
  { name: "ДАВЛАТ", sales: 2_960_000, orders: 9 },
  { name: "Babadjanova N.", sales: 2_480_000, orders: 8 },
  { name: "Berdiyev R.", sales: 1_840_000, orders: 6 },
  { name: "Sayitqulov M.", sales: 1_220_000, orders: 3 },
]

const TOP_PRODUCTS = [
  { name: "Choco-Boom 75g", qty: 482, revenue: 1_220_000 },
  { name: "Coca-Cola 1.5L", qty: 380, revenue: 1_840_000 },
  { name: "Bonjur Молочный 50g", qty: 320, revenue: 720_000 },
  { name: "Sok Apelsin 1L", qty: 240, revenue: 960_000 },
  { name: "Pechenye Yubileynoye", qty: 180, revenue: 540_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const COLOR_BG: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200", blue: "bg-blue-50 border-blue-200",
  violet: "bg-violet-50 border-violet-200", amber: "bg-amber-50 border-amber-200",
}
const COLOR_ICON: Record<string, string> = {
  emerald: "text-emerald-600", blue: "text-blue-600",
  violet: "text-violet-600", amber: "text-amber-600",
}

export default function SotuvDashboardPage() {
  const maxHourly = Math.max(...HOURLY.map(h => h.sales))
  const todayTotal = HOURLY.reduce((s, h) => s + h.sales, 0)
  const peakHour = HOURLY.reduce((peak, h) => h.sales > peak.sales ? h : peak, HOURLY[0])

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Sotuv dashboard</h1>
            <p className="text-sm text-slate-500">Bugungi savdo holatining real-time tahlili · 02.05.2026</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Bugun</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TODAY_KPIS.map((k, i) => {
            const Icon = k.icon
            const pct = Math.round((k.value / k.target) * 100)
            return (
              <Card key={i} className={`p-5 border-2 ${COLOR_BG[k.color]}`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-6 h-6 ${COLOR_ICON[k.color]}`} />
                  <span className={`text-xs font-bold flex items-center gap-1 ${k.change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {k.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {k.change >= 0 ? "+" : ""}{k.change}%
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-600 mb-1">{k.label}</div>
                <div className="text-2xl font-bold font-mono">
                  {typeof k.value === "number" && k.value > 1000 ? fmt(k.value) : k.value}
                  {k.label.includes("%") ? "%" : ""}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                    <div className={`h-full ${pct >= 100 ? "bg-emerald-500" : pct >= 85 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{pct}% target</span>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" /> Soatlar bo'yicha tushum
            </h2>
            <div className="text-sm">
              <span className="text-slate-500">Peak: </span>
              <span className="font-bold">{peakHour.hour}:00 · {fmt(peakHour.sales)} so'm</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-48">
            {HOURLY.map(h => {
              const heightPct = (h.sales / maxHourly) * 100
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{fmt(h.sales / 1000)}k</span>
                    <div className={`w-full rounded-t transition-all ${h === peakHour ? "bg-amber-500" : "bg-emerald-500"} hover:opacity-80`} style={{ height: `${heightPct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-slate-400">{h.hour}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 text-center">
            <span className="text-sm text-slate-500">Bugungi jami: </span>
            <span className="text-lg font-bold font-mono text-emerald-700">{fmt(todayTotal)} so'm</span>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Top agentlar (bugun)
            </h2>
            <div className="space-y-2">
              {TOP_AGENTS.map((a, i) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-lg font-bold w-8 text-slate-400">{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.orders} ta zakaz</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-700">{fmt(a.sales)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-600" /> Top tovarlar (bugun)
            </h2>
            <div className="space-y-2">
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-lg font-bold w-8 text-slate-400">{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.qty} dona</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-violet-700">{fmt(p.revenue)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
