"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Users, Crown, Star, AlertCircle, Snowflake, Download, Filter } from "lucide-react"
import Link from "next/link"

type Segment = {
  id: string; name: string; emoji: string; description: string;
  count: number; revenue: number; avgOrder: number;
  recencyDays: number; frequencyOrders: number; monetary: number;
  recommendation: string;
  color: string;
}

const SEGMENTS: Segment[] = [
  {
    id: "champion", name: "Champions", emoji: "👑", description: "Eng faol va daromadli klientlar",
    count: 42, revenue: 184_000_000, avgOrder: 720_000,
    recencyDays: 3, frequencyOrders: 24, monetary: 4_400_000,
    recommendation: "VIP xizmat — birinchi navbatda yetkazib berish, alohida promokod",
    color: "#D97706",
  },
  {
    id: "loyal", name: "Loyal", emoji: "⭐", description: "Doimiy va izchil sotib oluvchilar",
    count: 86, revenue: 168_000_000, avgOrder: 380_000,
    recencyDays: 8, frequencyOrders: 14, monetary: 1_960_000,
    recommendation: "Loyalty programmaga kiritish, premium tovar taklif qilish",
    color: "#10B981",
  },
  {
    id: "potential", name: "Potential", emoji: "🌱", description: "O'sib bormoqda — kelajakda VIP bo'lishi mumkin",
    count: 124, revenue: 96_000_000, avgOrder: 240_000,
    recencyDays: 12, frequencyOrders: 6, monetary: 780_000,
    recommendation: "Stimul: chegirma, promo, mahsulot diversifikatsiyasi",
    color: "#3B82F6",
  },
  {
    id: "at_risk", name: "At Risk", emoji: "⚠️", description: "Avval faol edi, hozir kamaymoqda",
    count: 68, revenue: 42_000_000, avgOrder: 320_000,
    recencyDays: 28, frequencyOrders: 8, monetary: 620_000,
    recommendation: "URGENT: SMS, qo'ng'iroq, yo'qotmaslik aktsiyasi",
    color: "#C75D3C",
  },
  {
    id: "new", name: "New Customers", emoji: "🆕", description: "Yangi kelgan, hali xulosa qilish erta",
    count: 96, revenue: 18_000_000, avgOrder: 180_000,
    recencyDays: 6, frequencyOrders: 1, monetary: 180_000,
    recommendation: "Onboarding: yaxshi narx, yetkazib berish kafolati",
    color: "#8B5CF6",
  },
  {
    id: "hibernating", name: "Hibernating", emoji: "❄️", description: "Uzoq vaqt sotib olmagan",
    count: 184, revenue: 24_000_000, avgOrder: 220_000,
    recencyDays: 84, frequencyOrders: 4, monetary: 880_000,
    recommendation: "Reaktivatsiya: katta promo, yangi katalog yuborish",
    color: "#9C8A6E",
  },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientSegmentsPage() {
  const [activeSegment, setActiveSegment] = useState<string>("champion")
  const segment = SEGMENTS.find(s => s.id === activeSegment)!

  const totalClients = SEGMENTS.reduce((s, x) => s + x.count, 0)
  const totalRevenue = SEGMENTS.reduce((s, x) => s + x.revenue, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1500px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/klientlar" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> KLIENTLAR
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klient <span className="italic text-[#C75D3C]">segmentatsiya</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                {fmt(totalClients)} klient · {fmt(totalRevenue / 1_000_000)} M so'm tushum · RFM tahlili (Recency / Frequency / Monetary)
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm text-[#1A1A1A] hover:border-[#C75D3C] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filtr
              </button>
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm text-[#1A1A1A] hover:border-[#C75D3C] flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </div>

          {/* Segment cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SEGMENTS.map(s => {
              const pct = Math.round((s.count / totalClients) * 100)
              const revPct = Math.round((s.revenue / totalRevenue) * 100)
              const isActive = activeSegment === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSegment(s.id)}
                  className={`text-left p-4 rounded-2xl border bg-white transition-all ${isActive ? "shadow-md ring-2" : "border-[#E8E0D3] hover:border-[#C75D3C]"}`}
                  style={isActive ? { borderColor: s.color, ringColor: s.color, boxShadow: `0 0 0 2px ${s.color}33` } as any : {}}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{revPct}%</span>
                  </div>
                  <div className="text-xs uppercase tracking-wider font-medium" style={{ color: s.color }}>{s.name}</div>
                  <div className="text-2xl font-medium mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.count}</div>
                  <div className="text-xs text-[#9C8A6E]">{pct}% klient</div>
                </button>
              )
            })}
          </div>

          {/* Active segment detail */}
          {segment && (
            <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${segment.color}15`, border: `2px solid ${segment.color}` }}>
                  <span className="text-5xl">{segment.emoji}</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: segment.color }}>{segment.name}</div>
                  <h2 className="text-3xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {segment.description}
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
                    {[
                      { label: "Klient", value: segment.count.toString() },
                      { label: "Tushum", value: `${fmt(segment.revenue / 1_000_000)} M` },
                      { label: "O'rta zakaz", value: fmt(segment.avgOrder) },
                      { label: "Recency", value: `${segment.recencyDays} kun` },
                      { label: "Frequency", value: `${segment.frequencyOrders}/oy` },
                      { label: "Monetary", value: `${fmt(segment.monetary / 1000)}k` },
                    ].map(stat => (
                      <div key={stat.label} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D3]">
                        <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1">{stat.label}</div>
                        <div className="text-xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 p-4 rounded-xl border-l-2 bg-[#FAF7F2]" style={{ borderLeftColor: segment.color }}>
                    <div className="text-xs uppercase tracking-[0.15em] font-medium mb-1" style={{ color: segment.color }}>💡 TAVSIYA</div>
                    <p className="text-sm text-[#1A1A1A]">{segment.recommendation}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Revenue distribution */}
          <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">REVENUE</div>
            <h2 className="text-2xl font-light text-[#1A1A1A] mb-5" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              Segment bo'yicha tushum taqsimot
            </h2>
            <div className="space-y-3">
              {SEGMENTS.map(s => {
                const revPct = Math.round((s.revenue / totalRevenue) * 100)
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-2xl w-10">{s.emoji}</span>
                    <span className="w-32 text-sm font-medium text-[#1A1A1A]">{s.name}</span>
                    <div className="flex-1 h-7 bg-[#FAF7F2] rounded-md relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-3 transition-all"
                        style={{ width: `${revPct}%`, background: s.color }}
                      >
                        <span className="text-xs text-white font-bold">{fmt(s.revenue / 1_000_000)} M</span>
                      </div>
                    </div>
                    <span className="text-sm w-16 text-right tabular-nums font-medium" style={{ color: s.color }}>{revPct}%</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
