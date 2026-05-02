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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/dashboard" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AI</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Sparkles className="w-8 h-8 text-[#3B82F6]" />
                AI Sotuv <span className="italic text-[#C75D3C]">Bashorati</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">6-oylik bashorat · Confidence Interval ML modeli</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 6-oy</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Target} accent="#10B981" label="May target" value={`${fmt(FORECAST[0].forecast / 1_000_000)} M`} sub={`${FORECAST[0].confidence}% ishonch`} />
            <KpiCard icon={TrendingUp} accent="#3B82F6" label="6-oy o'sish" value={`+${avgGrowth}%`} sub="Aprel→Oktyabr" />
            <KpiCard icon={Eye} accent="#8B5CF6" label="6-oylik forecast" value={`${fmt(totalForecast / 1_000_000)} M`} sub="jami" />
            <KpiCard icon={Sparkles} accent="#D97706" label="Model accuracy" value="94%" sub="MAPE 5.8% (test)" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}><TrendingUp className="w-5 h-5 text-[#3B82F6]" /> Tushum bashorati grafigi</h2>
            <div className="relative h-72">
              <div className="absolute inset-0 flex items-end gap-1">
                {HISTORICAL.map(h => (
                  <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <span className="text-xs font-mono text-[#6B5B4D] mb-1">{fmt(h.actual / 1_000_000)} M</span>
                      <div className="w-full rounded-t" style={{ height: `${(h.actual / max) * 95}%`, background: "#10B981" }} />
                    </div>
                    <span className="text-xs font-medium text-[#1A1A1A]">{h.month.slice(0, 3)}</span>
                    <span className="text-[10px] text-[#9C8A6E] uppercase tracking-wider">FAKT</span>
                  </div>
                ))}
                {FORECAST.map(f => (
                  <div key={f.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end h-full relative">
                      <span className="text-xs font-mono text-[#3B82F6] font-medium mb-1">{fmt(f.forecast / 1_000_000)} M</span>
                      <div className="w-full relative" style={{ height: `${(f.upperCi / max) * 95}%` }}>
                        <div className="absolute inset-x-0 bottom-0 rounded-t" style={{ top: `${100 - ((f.upperCi - f.lowerCi) / max) * 100}%`, background: "rgba(59, 130, 246, 0.3)" }} />
                        <div className="absolute inset-x-0 rounded-t" style={{ bottom: `${(f.lowerCi / max) * 100 / (f.upperCi / max)}%`, top: `${100 - ((f.forecast - f.lowerCi) / f.upperCi) * 100}%`, background: "#3B82F6" }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#3B82F6]">{f.month.slice(0, 3)}</span>
                    <span className="text-[10px] text-[#3B82F6] uppercase tracking-wider">BASHORAT</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8E0D3] flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" /> <span className="text-[#1A1A1A]">Tarixiy fakt</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded" /> <span className="text-[#1A1A1A]">Bashorat</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-200 rounded" /> <span className="text-[#1A1A1A]">Confidence interval</span></div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Bashorat tafsiloti</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Oy</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Lower CI</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bashorat</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Upper CI</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Confidence</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Vizual</th>
                  </tr>
                </thead>
                <tbody>
                  {FORECAST.map(f => (
                    <tr key={f.month} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{f.month}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#9C8A6E]">{fmt(f.lowerCi / 1_000_000)} M</td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#3B82F6]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(f.forecast / 1_000_000)} M</td>
                      <td className="py-3 px-2 text-right font-mono text-[#9C8A6E]">{fmt(f.upperCi / 1_000_000)} M</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-medium text-xs ${f.confidence >= 80 ? "bg-emerald-50 text-emerald-700" : f.confidence >= 65 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                          {f.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="relative h-3 bg-[#F0EAE0] rounded-full">
                          <div className="absolute inset-y-0 rounded-full" style={{ left: `${(f.lowerCi / max) * 100}%`, right: `${100 - (f.upperCi / max) * 100}%`, background: "rgba(59, 130, 246, 0.4)" }} />
                          <div className="absolute top-1/2 w-2 h-2 bg-blue-700 rounded-full -translate-y-1/2 -translate-x-1" style={{ left: `${(f.forecast / max) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Bashorat omillari (SHAP-style)</h2>
            <div className="space-y-2">
              {FACTORS.map(f => (
                <div key={f.factor} className="flex items-center gap-3">
                  <span className="w-64 text-sm text-[#1A1A1A]">{f.factor}</span>
                  <div className="flex-1 h-7 bg-[#F0EAE0] rounded relative">
                    <div className="absolute inset-y-0 rounded" style={{ left: f.impact > 0 ? '50%' : 'auto', right: f.impact > 0 ? 'auto' : '50%', width: `${Math.abs(f.impact) * 1.5}%`, background: f.impact > 0 ? "#10B981" : "#C75D3C" }} />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-[#9C8A6E]" />
                  </div>
                  <span className={`text-sm font-mono font-medium w-16 text-right ${f.impact > 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                    {f.impact > 0 ? "+" : ""}{f.impact}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
