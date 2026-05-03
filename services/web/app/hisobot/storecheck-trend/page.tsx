"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"

const WEEKS = ["W14", "W15", "W16", "W17", "W18"]

type BrandTrend = {
  brand: string;
  values: number[];
  color: string;
}

const TRENDS: BrandTrend[] = [
  { brand: "Choco-Boom", values: [62, 68, 71, 74, 78], color: "emerald" },
  { brand: "Coca-Cola", values: [82, 84, 85, 86, 88], color: "terracotta" },
  { brand: "Bonjur", values: [54, 58, 56, 60, 62], color: "violet" },
  { brand: "Sok Premium", values: [45, 48, 52, 56, 58], color: "amber" },
  { brand: "Pechenye Yubileynoye", values: [38, 36, 42, 44, 48], color: "blue" },
  { brand: "Biskvit Triton", values: [28, 32, 30, 34, 36], color: "cream" },
]

const colorHex: Record<string, string> = {
  emerald: "#10B981",
  terracotta: "#C75D3C",
  violet: "#7C3AED",
  amber: "#D97706",
  blue: "#3B82F6",
  cream: "#9C8A6E",
}

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function StorecheckTrendPage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Storecheck <span className="italic text-[#C75D3C]">dinamikasi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Brendlar bo'yicha mavjudlik va facing dinamikasi (5 hafta)</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 5 hafta</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={SERIF}>Mavjudlik trend (presence%)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-3 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Brend</th>
                    {WEEKS.map(w => (
                      <th key={w} className="py-3 px-3 text-center w-20 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">{w}</th>
                    ))}
                    <th className="py-3 px-3 text-center w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {TRENDS.map(t => {
                    const first = t.values[0]
                    const last = t.values[t.values.length - 1]
                    const delta = last - first
                    const accent = colorHex[t.color]
                    return (
                      <tr key={t.brand} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-3 font-medium text-[#1A1A1A]">
                          <span className="inline-block w-3 h-3 rounded mr-2" style={{ background: accent }} />
                          {t.brand}
                        </td>
                        {t.values.map((v, i) => (
                          <td key={i} className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-mono tabular-nums font-medium" style={{ color: accent }}>{v}%</span>
                              <div className="h-1 w-12 bg-[#F0EAE0] rounded-full overflow-hidden">
                                <div className="h-full" style={{ width: `${v}%`, background: accent }} />
                              </div>
                            </div>
                          </td>
                        ))}
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          {delta > 0 ? (
                            <span className="text-emerald-700 font-medium flex items-center justify-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +{delta}%</span>
                          ) : delta < 0 ? (
                            <span className="font-medium flex items-center justify-center gap-1" style={{ color: "#C75D3C" }}><TrendingDown className="w-3.5 h-3.5" /> {delta}%</span>
                          ) : (
                            <span className="text-[#9C8A6E] flex items-center justify-center gap-1"><Minus className="w-3.5 h-3.5" /> 0</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={SERIF}>Trend chiziqli grafik (sodda render)</h2>
            <div className="space-y-3">
              {TRENDS.map(t => {
                const accent = colorHex[t.color]
                return (
                  <div key={t.brand} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        <span className="inline-block w-3 h-3 rounded mr-2 align-middle" style={{ background: accent }} />
                        {t.brand}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-medium" style={{ color: accent }}>{t.values[t.values.length - 1]}%</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {t.values.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                          <div className="w-full rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${v}%`, background: accent }} title={`${WEEKS[i]}: ${v}%`} />
                          <span className="text-[9px] text-[#9C8A6E] font-mono tabular-nums">{WEEKS[i]}</span>
                        </div>
                      ))}
                    </div>
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
