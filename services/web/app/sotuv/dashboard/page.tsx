"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download, Target, Zap, Users, DollarSign, Package } from "lucide-react"
import Link from "next/link"

const TODAY_KPIS = [
  { label: "Bugungi tushum", value: 12_840_000, target: 15_000_000, change: 8.4, accent: "positive" as const },
  { label: "Bugungi zakazlar", value: 38, target: 42, change: -4.2, accent: "negative" as const },
  { label: "Yangi klientlar", value: 4, target: 5, change: 33.3, accent: "positive" as const },
  { label: "Konversiya %", value: 78, target: 80, change: 2.1, accent: "neutral" as const },
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

export default function SotuvDashboardPage() {
  const maxHourly = Math.max(...HOURLY.map(h => h.sales))
  const todayTotal = HOURLY.reduce((s, h) => s + h.sales, 0)
  const peakHour = HOURLY.reduce((peak, h) => h.sales > peak.sales ? h : peak, HOURLY[0])

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1500px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/sotuv" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> SOTUV
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Sotuv <span className="italic text-[#C75D3C]">Dashboard</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Bugungi savdo holatining real-time tahlili — 02 may 2026
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Bugun
              </button>
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TODAY_KPIS.map((k, i) => {
              const pct = Math.round((k.value / k.target) * 100)
              const accentBar = k.accent === "positive" ? "#10B981" : k.accent === "negative" ? "#C75D3C" : "#9C8A6E"
              const trendBg = k.change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-[#F5E5D6] text-[#C75D3C]"
              return (
                <Card key={i} className="relative overflow-hidden bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs uppercase tracking-[0.15em] text-[#9C8A6E] font-medium">{k.label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${trendBg}`}>
                      {k.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {k.change >= 0 ? "+" : ""}{k.change}%
                    </span>
                  </div>
                  <div className="text-3xl font-medium tabular-nums text-[#1A1A1A] leading-tight" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {typeof k.value === "number" && k.value > 1000 ? fmt(k.value) : k.value}
                    {k.label.includes("%") ? "%" : ""}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[#F5F1EB] rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: accentBar }} />
                    </div>
                    <span className="text-xs text-[#9C8A6E]">{pct}% target</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accentBar }} />
                </Card>
              )
            })}
          </div>

          {/* Hourly chart */}
          <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">SOATLAR DINAMIKASI</div>
                <h2 className="text-2xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  Bugungi tushum
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9C8A6E]">Peak</div>
                <div className="font-medium text-[#1A1A1A]">{peakHour.hour}:00 · {fmt(peakHour.sales)}</div>
              </div>
            </div>
            <div className="flex items-end gap-2 h-48">
              {HOURLY.map(h => {
                const heightPct = (h.sales / maxHourly) * 100
                const isPeak = h === peakHour
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <span className="text-xs font-mono text-[#9C8A6E] mb-1 opacity-0 group-hover:opacity-100">{fmt(h.sales / 1000)}k</span>
                      <div className="w-full rounded-t transition-all hover:opacity-80" style={{ height: `${heightPct}%`, background: isPeak ? "linear-gradient(180deg, #C75D3C 0%, #E27B5C 100%)" : "linear-gradient(180deg, #D4B896 0%, #C9A87E 100%)" }} />
                    </div>
                    <span className="text-xs text-[#6B5B4D]">{h.hour}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8E0D3] text-center">
              <span className="text-xs text-[#9C8A6E]">Bugungi jami: </span>
              <span className="text-xl font-medium tabular-nums text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(todayTotal)} so'm</span>
            </div>
          </Card>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">AGENTLAR</div>
              <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Bugungi top
              </h3>
              <div className="space-y-2.5">
                {TOP_AGENTS.map((a, i) => (
                  <div key={a.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF7F2]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: i === 0 ? "#D97706" : i === 1 ? "#9C8A6E" : i === 2 ? "#A8702A" : "#E8E0D3", color: i < 3 ? "white" : "#6B5B4D" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#1A1A1A]">{a.name}</div>
                      <div className="text-xs text-[#9C8A6E]">{a.orders} ta zakaz</div>
                    </div>
                    <div className="text-sm font-medium tabular-nums text-[#C75D3C]">{fmt(a.sales)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">TOVARLAR</div>
              <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Bugungi top
              </h3>
              <div className="space-y-2.5">
                {TOP_PRODUCTS.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF7F2]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-[#FAF7F2] text-[#9C8A6E] border border-[#E8E0D3]">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#1A1A1A]">{p.name}</div>
                      <div className="text-xs text-[#9C8A6E]">{p.qty} dona</div>
                    </div>
                    <div className="text-sm font-medium tabular-nums text-[#1A1A1A]">{fmt(p.revenue)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
