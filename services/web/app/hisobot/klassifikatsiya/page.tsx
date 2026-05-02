"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, TrendingUp } from "lucide-react"
import Link from "next/link"

const TIERS = [
  { range: "<1 mln", clients: 93, orders: 127, products: 642, sum: 37_408_695, avg_check: 294_556, color: "from-slate-300 to-slate-400" },
  { range: "1-2 mln", clients: 21, orders: 28, products: 321, sum: 30_565_250, avg_check: 1_091_616, color: "from-blue-400 to-blue-500" },
  { range: "2-3 mln", clients: 5, orders: 6, products: 155, sum: 12_916_270, avg_check: 2_152_711, color: "from-cyan-400 to-cyan-500" },
  { range: "3-5 mln", clients: 1, orders: 2, products: 56, sum: 4_332_000, avg_check: 2_166_000, color: "from-emerald-400 to-emerald-500" },
  { range: "5-10 mln", clients: 7, orders: 7, products: 635, sum: 48_073_650, avg_check: 6_867_664, color: "from-amber-400 to-amber-500" },
  { range: "10-20 mln", clients: 2, orders: 2, products: 270, sum: 21_874_500, avg_check: 10_937_250, color: "from-orange-400 to-orange-500" },
  { range: "20+ mln", clients: 0, orders: 0, products: 0, sum: 0, avg_check: 0, color: "from-rose-400 to-rose-500" },
]

const TOTAL_CLIENTS = TIERS.reduce((s, t) => s + t.clients, 0)
const TOTAL_ORDERS = TIERS.reduce((s, t) => s + t.orders, 0)
const TOTAL_SUM = TIERS.reduce((s, t) => s + t.sum, 0)

export default function KlassifikatsiyaPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/hisobot" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Hisobotlar
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">📊 Klient klassifikatsiyasi</h1>
            <p className="text-base text-slate-500 mt-1">Monetary tier ABC analysis · 7 daraja · Joriy oy</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Filter className="w-4 h-4" /> Filter</Button>
            <Button variant="outline"><Download className="w-4 h-4" /> Excel</Button>
          </div>
        </div>

        {/* Visual hierarchy */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {TIERS.map(t => (
            <Card key={t.range} className={`bg-gradient-to-br ${t.color} text-white border-0 p-4 text-center`}>
              <div className="text-xs opacity-90 mb-1">{t.range}</div>
              <div className="text-3xl font-bold tabular-nums">{t.clients}</div>
              <div className="text-xs opacity-75 mt-1">klient</div>
            </Card>
          ))}
        </div>

        {/* Big table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Klassifikatsiya</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Klient soni</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Zakaz soni</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Tovar soni</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Umumiy summa</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">O'rtacha chek</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">% Sotuvdan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TIERS.map(t => {
                  const pct = TOTAL_SUM > 0 ? (t.sum / TOTAL_SUM) * 100 : 0
                  return (
                    <tr key={t.range} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-8 rounded bg-gradient-to-b ${t.color}`} />
                          <span className="text-base font-semibold">{t.range}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-base font-semibold">{t.clients}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.orders}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.products}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-base font-semibold">{t.sum.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-semibold">{t.avg_check.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-[80px]">
                            <div className={`h-full bg-gradient-to-r ${t.color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-semibold w-12">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-emerald-50">
                <tr>
                  <td className="px-4 py-3 text-base font-bold">Jami</td>
                  <td className="px-4 py-3 text-right tabular-nums text-2xl font-bold">{TOTAL_CLIENTS}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-lg font-bold">{TOTAL_ORDERS}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-lg font-bold">{TIERS.reduce((s, t) => s + t.products, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-2xl font-bold text-emerald-700">{TOTAL_SUM.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Insight */}
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Insights</h3>
              <ul className="text-sm text-emerald-800 mt-2 space-y-1">
                <li>• <strong>Pareto:</strong> 7 ta VIP klient (5-10 mln) jami sotuvning {((TIERS[4].sum / TOTAL_SUM) * 100).toFixed(0)}%ini ta'minlaydi</li>
                <li>• <strong>Quyi tier (&lt;1 mln):</strong> {TIERS[0].clients} klient, lekin faqat {((TIERS[0].sum / TOTAL_SUM) * 100).toFixed(0)}% sotuv</li>
                <li>• <strong>Tavsiya:</strong> 5-20 mln klientlar bilan ko'proq vaqt sarflang — ROI yuqori</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
