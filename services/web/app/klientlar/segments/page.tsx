"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Crown, Star, AlertCircle, Snowflake, Download, Filter } from "lucide-react"
import Link from "next/link"

type Segment = {
  id: string; name: string; emoji: string; description: string;
  color: string; bgColor: string;
  count: number; revenue: number; avgOrder: number;
  recencyDays: number; frequencyOrders: number; monetary: number;
  recommendation: string;
}

const SEGMENTS: Segment[] = [
  {
    id: "champion", name: "Champions", emoji: "👑", description: "Eng faol va daromadli klientlar",
    color: "text-amber-700", bgColor: "bg-amber-50 border-amber-300",
    count: 42, revenue: 184_000_000, avgOrder: 720_000,
    recencyDays: 3, frequencyOrders: 24, monetary: 4_400_000,
    recommendation: "VIP xizmat — birinchi navbatda yetkazib berish, alohida promokod"
  },
  {
    id: "loyal", name: "Loyal", emoji: "⭐", description: "Doimiy va izchil sotib oluvchilar",
    color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-300",
    count: 86, revenue: 168_000_000, avgOrder: 380_000,
    recencyDays: 8, frequencyOrders: 14, monetary: 1_960_000,
    recommendation: "Loyalty programmaga kiritish, premium tovar taklif qilish"
  },
  {
    id: "potential", name: "Potential Loyalist", emoji: "🌱", description: "O'sib bormoqda — kelajakda VIP bo'lishi mumkin",
    color: "text-blue-700", bgColor: "bg-blue-50 border-blue-300",
    count: 124, revenue: 96_000_000, avgOrder: 240_000,
    recencyDays: 12, frequencyOrders: 6, monetary: 780_000,
    recommendation: "Stimul: chegirma, promo, mahsulot diversifikatsiyasi"
  },
  {
    id: "at_risk", name: "At Risk", emoji: "⚠️", description: "Avval faol edi, hozir kamaymoqda",
    color: "text-rose-700", bgColor: "bg-rose-50 border-rose-300",
    count: 68, revenue: 42_000_000, avgOrder: 320_000,
    recencyDays: 28, frequencyOrders: 8, monetary: 620_000,
    recommendation: "URGENT: SMS, qo'ng'iroq, yo'qotmaslik aktsiyasi"
  },
  {
    id: "new", name: "New Customers", emoji: "🆕", description: "Yangi kelgan, hali xulosa qilish erta",
    color: "text-violet-700", bgColor: "bg-violet-50 border-violet-300",
    count: 96, revenue: 18_000_000, avgOrder: 180_000,
    recencyDays: 6, frequencyOrders: 1, monetary: 180_000,
    recommendation: "Onboarding: yaxshi narx, yetkazib berish kafolati"
  },
  {
    id: "hibernating", name: "Hibernating", emoji: "❄️", description: "Uzoq vaqt sotib olmagan",
    color: "text-slate-700", bgColor: "bg-slate-50 border-slate-300",
    count: 184, revenue: 24_000_000, avgOrder: 220_000,
    recencyDays: 84, frequencyOrders: 4, monetary: 880_000,
    recommendation: "Reaktivatsiya: katta promo, yangi katalog yuborish"
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Klient segmentatsiyasi (RFM)</h1>
            <p className="text-sm text-slate-500">{fmt(totalClients)} klient · {fmt(totalRevenue / 1_000_000)} M so'm tushum · 6 ta segment</p>
          </div>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filtr</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {SEGMENTS.map(s => {
            const pct = Math.round((s.count / totalClients) * 100)
            const revPct = Math.round((s.revenue / totalRevenue) * 100)
            return (
              <Card
                key={s.id}
                onClick={() => setActiveSegment(s.id)}
                className={`p-4 cursor-pointer transition-all ${activeSegment === s.id ? `border-2 ${s.bgColor} shadow-md` : "border hover:border-slate-300"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className={`text-xs font-bold ${s.color}`}>{revPct}%</span>
                </div>
                <div className={`text-xs font-bold ${s.color}`}>{s.name}</div>
                <div className="text-xl font-bold mt-1 font-mono">{s.count}</div>
                <div className="text-xs text-slate-500">{pct}% klient</div>
              </Card>
            )
          })}
        </div>

        {segment && (
          <Card className={`p-6 border-2 ${segment.bgColor}`}>
            <div className="flex items-start gap-4">
              <span className="text-6xl">{segment.emoji}</span>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${segment.color}`}>{segment.name}</h2>
                <p className="text-sm text-slate-600 mt-1">{segment.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Klient soni</div>
                    <div className="text-xl font-bold font-mono">{segment.count}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Tushum</div>
                    <div className="text-xl font-bold font-mono">{fmt(segment.revenue / 1_000_000)} M</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">O'rta zakaz</div>
                    <div className="text-xl font-bold font-mono">{fmt(segment.avgOrder)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Recency (oxirgi xarid)</div>
                    <div className="text-xl font-bold font-mono">{segment.recencyDays} kun</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Frequency (zakaz/oy)</div>
                    <div className="text-xl font-bold font-mono">{segment.frequencyOrders}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Monetary (12-oy)</div>
                    <div className="text-xl font-bold font-mono">{fmt(segment.monetary / 1000)}k</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-emerald-500">
                  <div className="text-xs font-bold text-emerald-700 mb-1">💡 Tavsiya</div>
                  <p className="text-sm">{segment.recommendation}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Segmentlar bo'yicha taqsimot (revenue)</h2>
          <div className="space-y-2">
            {SEGMENTS.map(s => {
              const revPct = Math.round((s.revenue / totalRevenue) * 100)
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-2xl w-8">{s.emoji}</span>
                  <span className="w-32 text-sm font-semibold">{s.name}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded relative">
                    <div className={`absolute inset-y-0 left-0 rounded flex items-center justify-end pr-2 ${
                      s.id === "champion" ? "bg-amber-500" :
                      s.id === "loyal" ? "bg-emerald-500" :
                      s.id === "potential" ? "bg-blue-500" :
                      s.id === "at_risk" ? "bg-rose-500" :
                      s.id === "new" ? "bg-violet-500" :
                      "bg-slate-500"
                    }`} style={{ width: `${revPct}%` }}>
                      <span className="text-xs text-white font-bold">{fmt(s.revenue / 1_000_000)} M</span>
                    </div>
                  </div>
                  <span className="text-sm w-20 text-right font-mono">{revPct}%</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
