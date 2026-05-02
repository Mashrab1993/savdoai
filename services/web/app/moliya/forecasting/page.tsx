"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download, Sparkles, AlertCircle, DollarSign } from "lucide-react"
import Link from "next/link"

const HISTORICAL = [
  { month: "Yanvar", income: 142, expense: 96, profit: 46 },
  { month: "Fevral", income: 156, expense: 102, profit: 54 },
  { month: "Mart", income: 168, expense: 108, profit: 60 },
  { month: "Aprel", income: 174, expense: 110, profit: 64 },
]

const FORECAST = [
  { month: "May", income: 184, expense: 116, profit: 68, ci: 8 },
  { month: "Iyun", income: 196, expense: 122, profit: 74, ci: 12 },
  { month: "Iyul", income: 208, expense: 128, profit: 80, ci: 16 },
]

const SCENARIOS = [
  { name: "Optimistic (+15% sotuv)", emoji: "🚀", profit3M: 282, color: "emerald", probability: 25 },
  { name: "Base (trend bo'yicha)", emoji: "📊", profit3M: 222, color: "blue", probability: 60 },
  { name: "Pessimistic (raqobat / -10%)", emoji: "⚠️", profit3M: 156, color: "amber", probability: 15 },
]

const RISKS = [
  { risk: "Logistika xarajati o'sishi (+12%)", impact: -8, probability: 65, mitigation: "Avto parkini optimallashtirish" },
  { risk: "Yangi raqobat tushishi", impact: -15, probability: 30, mitigation: "Loyalty programma kuchaytirish" },
  { risk: "May bayrami kamayishi", impact: -5, probability: 50, mitigation: "Aksiyalar bilan to'ldirish" },
]

const OPPORTUNITIES = [
  { opp: "Yangi 5 ta Champions klient", impact: 18, probability: 55, action: "Yangi klient strategiyasi" },
  { opp: "Yoz peak (yoz ichimliklari)", impact: 22, probability: 85, action: "Voda+Sok zaxirasini oshirish" },
  { opp: "Pro shartnoma (kanzert)", impact: 12, probability: 40, action: "Marketing budjet kerak" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function FinancialForecastingPage() {
  const all = [...HISTORICAL, ...FORECAST]
  const max = Math.max(...all.map(m => m.income))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/moliya" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-emerald-600" />
              Moliyaviy bashorat (3-oy)
            </h1>
            <p className="text-sm text-slate-500">AI moliyaviy modelirovka · 3 stsenariy bilan</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 3-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SCENARIOS.map((s, i) => (
            <Card key={i} className={`p-5 border-2 ${
              s.color === "emerald" ? "bg-emerald-50 border-emerald-300" :
              s.color === "blue" ? "bg-blue-50 border-blue-300" :
              "bg-amber-50 border-amber-300"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{s.emoji}</span>
                <div>
                  <div className="font-bold text-base">{s.name}</div>
                  <div className="text-xs text-slate-500">Ehtimol: {s.probability}%</div>
                </div>
              </div>
              <div className="text-3xl font-bold font-mono">{fmt(s.profit3M)} M</div>
              <div className="text-xs text-slate-500 mt-1">3-oylik sof foyda</div>
              <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full ${s.color === "emerald" ? "bg-emerald-500" : s.color === "blue" ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${s.probability}%` }} />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> P&amp;L trendi (M so'm)</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1 mb-1 text-xs text-emerald-700 font-bold">↑ Daromad</div>
              <div className="flex items-end gap-1 h-20">
                {all.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-mono">{m.income}</span>
                    <div className={`w-full rounded-t ${i < HISTORICAL.length ? "bg-emerald-500" : "bg-emerald-300 border-t-2 border-dashed border-emerald-700"}`} style={{ height: `${(m.income / max) * 90}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1 text-xs text-rose-700 font-bold">↓ Xarajat</div>
              <div className="flex items-end gap-1 h-12">
                {all.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-mono">{m.expense}</span>
                    <div className={`w-full rounded-t ${i < HISTORICAL.length ? "bg-rose-500" : "bg-rose-300 border-t-2 border-dashed border-rose-700"}`} style={{ height: `${(m.expense / max) * 80}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1 text-xs text-blue-700 font-bold">= Sof foyda</div>
              <div className="flex items-end gap-1 h-12">
                {all.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-mono font-bold">{m.profit}</span>
                    <div className={`w-full rounded-t ${i < HISTORICAL.length ? "bg-blue-500" : "bg-blue-300 border-t-2 border-dashed border-blue-700"}`} style={{ height: `${(m.profit / max) * 80}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-1 mt-1">
              {all.map((m, i) => (
                <div key={m.month} className="flex-1 text-center">
                  <span className={`text-xs font-bold ${i < HISTORICAL.length ? "text-slate-700" : "text-blue-700"}`}>{m.month.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-500 rounded" /> Solid = tarixiy fakt</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-300 border-t-2 border-dashed border-slate-700 rounded" /> Dashed = AI bashorat</div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-600" /> Risk faktorlar (3-oy)</h2>
          <div className="space-y-2">
            {RISKS.map(r => (
              <div key={r.risk} className="p-3 bg-rose-50 rounded-lg flex items-center gap-3 border border-rose-200">
                <div className="flex-1">
                  <div className="font-semibold">{r.risk}</div>
                  <div className="text-xs text-slate-500 mt-0.5">💡 {r.mitigation}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ta'sir</div>
                  <div className="text-base font-bold font-mono text-rose-700">{r.impact}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ehtimol</div>
                  <div className="text-base font-bold font-mono">{r.probability}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Imkoniyatlar</h2>
          <div className="space-y-2">
            {OPPORTUNITIES.map(o => (
              <div key={o.opp} className="p-3 bg-emerald-50 rounded-lg flex items-center gap-3 border border-emerald-200">
                <div className="flex-1">
                  <div className="font-semibold">{o.opp}</div>
                  <div className="text-xs text-slate-500 mt-0.5">🎯 {o.action}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ta'sir</div>
                  <div className="text-base font-bold font-mono text-emerald-700">+{o.impact}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ehtimol</div>
                  <div className="text-base font-bold font-mono">{o.probability}%</div>
                </div>
                <Button size="sm">Reja</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
