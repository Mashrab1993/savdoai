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
  { brand: "Coca-Cola", values: [82, 84, 85, 86, 88], color: "rose" },
  { brand: "Bonjur", values: [54, 58, 56, 60, 62], color: "violet" },
  { brand: "Sok Premium", values: [45, 48, 52, 56, 58], color: "amber" },
  { brand: "Pechenye Yubileynoye", values: [38, 36, 42, 44, 48], color: "blue" },
  { brand: "Biskvit Triton", values: [28, 32, 30, 34, 36], color: "slate" },
]

const colorBg: Record<string, string> = {
  emerald: "bg-emerald-500", rose: "bg-rose-500", violet: "bg-violet-500",
  amber: "bg-amber-500", blue: "bg-blue-500", slate: "bg-slate-500",
}
const colorText: Record<string, string> = {
  emerald: "text-emerald-700", rose: "text-rose-700", violet: "text-violet-700",
  amber: "text-amber-700", blue: "text-blue-700", slate: "text-slate-700",
}

export default function StorecheckTrendPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Storecheck dinamikasi</h1>
            <p className="text-sm text-slate-500">Brendlar bo'yicha mavjudlik va facing dinamikasi (5 hafta)</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 5 hafta</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Mavjudlik trend (presence%)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 text-left">Brend</th>
                  {WEEKS.map(w => (
                    <th key={w} className="border border-slate-300 py-2 px-3 text-center w-20">{w}</th>
                  ))}
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Δ</th>
                </tr>
              </thead>
              <tbody>
                {TRENDS.map(t => {
                  const first = t.values[0]
                  const last = t.values[t.values.length - 1]
                  const delta = last - first
                  return (
                    <tr key={t.brand} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-3 font-semibold">
                        <span className={`inline-block w-3 h-3 rounded ${colorBg[t.color]} mr-2`} />
                        {t.brand}
                      </td>
                      {t.values.map((v, i) => (
                        <td key={i} className="border border-slate-300 py-2 px-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`font-mono font-bold ${colorText[t.color]}`}>{v}%</span>
                            <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${colorBg[t.color]}`} style={{ width: `${v}%` }} />
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="border border-slate-300 py-2 px-3 text-center font-mono">
                        {delta > 0 ? (
                          <span className="text-emerald-700 font-bold flex items-center justify-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +{delta}%</span>
                        ) : delta < 0 ? (
                          <span className="text-rose-700 font-bold flex items-center justify-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> {delta}%</span>
                        ) : (
                          <span className="text-slate-500 flex items-center justify-center gap-1"><Minus className="w-3.5 h-3.5" /> 0</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Trend chiziqli grafik (sodda render)</h2>
          <div className="space-y-3">
            {TRENDS.map(t => (
              <div key={t.brand} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    <span className={`inline-block w-3 h-3 rounded ${colorBg[t.color]} mr-2 align-middle`} />
                    {t.brand}
                  </span>
                  <span className={`text-xs font-mono font-bold ${colorText[t.color]}`}>{t.values[t.values.length - 1]}%</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {t.values.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                      <div className={`w-full ${colorBg[t.color]} rounded-t opacity-80 hover:opacity-100 transition-opacity`} style={{ height: `${v}%` }} title={`${WEEKS[i]}: ${v}%`} />
                      <span className="text-[9px] text-slate-400 font-mono">{WEEKS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
