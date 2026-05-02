"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, TrendingUp, Calendar, Download, Target, Eye } from "lucide-react"
import Link from "next/link"

const HISTORICAL = [
  { month: "Yanvar", actual: 142_000_000 },
  { month: "Fevral", actual: 156_000_000 },
  { month: "Mart", actual: 168_000_000 },
  { month: "Aprel", actual: 173_600_000 },
]

const FORECAST = [
  { month: "May", forecast: 184_000_000, lowerCi: 176_000_000, upperCi: 192_000_000, confidence: 88 },
  { month: "Iyun", forecast: 196_000_000, lowerCi: 184_000_000, upperCi: 208_000_000, confidence: 82 },
  { month: "Iyul", forecast: 208_000_000, lowerCi: 192_000_000, upperCi: 224_000_000, confidence: 76 },
  { month: "Avgust", forecast: 218_000_000, lowerCi: 198_000_000, upperCi: 238_000_000, confidence: 70 },
  { month: "Sentyabr", forecast: 226_000_000, lowerCi: 200_000_000, upperCi: 252_000_000, confidence: 65 },
  { month: "Oktyabr", forecast: 234_000_000, lowerCi: 204_000_000, upperCi: 264_000_000, confidence: 60 },
]

const FACTORS = [
  { factor: "Tarixiy o'sish trendi", impact: 35, type: "positive" },
  { factor: "Mavsumiylik (yoz peak)", impact: 25, type: "positive" },
  { factor: "Yangi klient ro'yxatga olish", impact: 15, type: "positive" },
  { factor: "Promo aktsiyalar samarasi", impact: 10, type: "positive" },
  { factor: "Raqobat narxi pasaytishi", impact: -5, type: "negative" },
  { factor: "Logistika xarajati o'sishi", impact: -3, type: "negative" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function AiForecastPage() {
  const totalForecast = FORECAST.reduce((s, f) => s + f.forecast, 0)
  const avgGrowth = Math.round(((FORECAST[FORECAST.length - 1].forecast / HISTORICAL[HISTORICAL.length - 1].actual) - 1) * 100)
  const max = Math.max(...HISTORICAL.map(h => h.actual), ...FORECAST.map(f => f.upperCi))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/ai" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-blue-600" />
              AI Sotuv Bashorati
            </h1>
            <p className="text-sm text-slate-500">6-oylik bashorat · Confidence Interval ML modeli</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 6-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Target className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">May target (bashorat)</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(FORECAST[0].forecast / 1_000_000)} M</div>
            <div className="text-xs text-slate-500 mt-1">{FORECAST[0].confidence}% ishonch</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">6-oy o'sish</div>
            <div className="text-2xl font-bold mt-1 font-mono">+{avgGrowth}%</div>
            <div className="text-xs text-slate-500 mt-1">Aprel'dan Oktyabr'gacha</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Eye className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">6-oylik forecast</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalForecast / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Sparkles className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Model accuracy</div>
            <div className="text-2xl font-bold mt-1 font-mono">94%</div>
            <div className="text-xs text-slate-500 mt-1">MAPE 5.8% (test)</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Tushum bashorati grafigi</h2>
          <div className="relative h-72">
            <div className="absolute inset-0 flex items-end gap-1">
              {HISTORICAL.map(h => (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-mono text-slate-500 mb-1">{fmt(h.actual / 1_000_000)} M</span>
                    <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${(h.actual / max) * 95}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{h.month.slice(0, 3)}</span>
                  <span className="text-[10px] text-slate-500">FAKT</span>
                </div>
              ))}
              {FORECAST.map(f => (
                <div key={f.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-full relative">
                    <span className="text-xs font-mono text-blue-700 font-bold mb-1">{fmt(f.forecast / 1_000_000)} M</span>
                    <div className="w-full relative" style={{ height: `${(f.upperCi / max) * 95}%` }}>
                      <div className="absolute inset-x-0 bottom-0 bg-blue-200/50 rounded-t" style={{ top: `${100 - ((f.upperCi - f.lowerCi) / max) * 100}%` }} />
                      <div className="absolute inset-x-0 bg-blue-500 rounded-t" style={{ bottom: `${(f.lowerCi / max) * 100 / (f.upperCi / max)}%`, top: `${100 - ((f.forecast - f.lowerCi) / f.upperCi) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700">{f.month.slice(0, 3)}</span>
                  <span className="text-[10px] text-blue-700">BASHORAT</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" /> Tarixiy fakt</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded" /> Bashorat (point estimate)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-200 rounded" /> Confidence interval (lower/upper)</div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Bashorat tafsiloti</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Oy</th>
                  <th className="py-3 px-2 text-right">Lower CI</th>
                  <th className="py-3 px-2 text-right">Bashorat</th>
                  <th className="py-3 px-2 text-right">Upper CI</th>
                  <th className="py-3 px-2 text-center">Confidence</th>
                  <th className="py-3 px-2">Vizual</th>
                </tr>
              </thead>
              <tbody>
                {FORECAST.map(f => (
                  <tr key={f.month} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-semibold">{f.month}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-500">{fmt(f.lowerCi / 1_000_000)} M</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-blue-700">{fmt(f.forecast / 1_000_000)} M</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-500">{fmt(f.upperCi / 1_000_000)} M</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${f.confidence >= 80 ? "bg-emerald-100 text-emerald-700" : f.confidence >= 65 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {f.confidence}%
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative h-3 bg-slate-100 rounded-full">
                        <div className="absolute inset-y-0 bg-blue-200 rounded-full" style={{ left: `${(f.lowerCi / max) * 100}%`, right: `${100 - (f.upperCi / max) * 100}%` }} />
                        <div className="absolute top-1/2 w-2 h-2 bg-blue-700 rounded-full -translate-y-1/2 -translate-x-1" style={{ left: `${(f.forecast / max) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Bashorat omillari (SHAP-style)</h2>
          <div className="space-y-2">
            {FACTORS.map(f => (
              <div key={f.factor} className="flex items-center gap-3">
                <span className="w-64 text-sm">{f.factor}</span>
                <div className="flex-1 h-7 bg-slate-100 rounded relative">
                  <div className={`absolute inset-y-0 ${f.impact > 0 ? "left-1/2 bg-emerald-500" : "right-1/2 bg-rose-500"} rounded`} style={{ width: `${Math.abs(f.impact) * 1.5}%` }} />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400" />
                </div>
                <span className={`text-sm font-mono font-bold w-16 text-right ${f.impact > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {f.impact > 0 ? "+" : ""}{f.impact}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
