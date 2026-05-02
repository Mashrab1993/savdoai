"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, TrendingUp } from "lucide-react"
import Link from "next/link"

const TIERS = [
  { range: "<1 mln", clients: 93, orders: 127, products: 642, sum: 37_408_695, avg_check: 294_556, accent: "#9C8A6E" },
  { range: "1-2 mln", clients: 21, orders: 28, products: 321, sum: 30_565_250, avg_check: 1_091_616, accent: "#3B82F6" },
  { range: "2-3 mln", clients: 5, orders: 6, products: 155, sum: 12_916_270, avg_check: 2_152_711, accent: "#06B6D4" },
  { range: "3-5 mln", clients: 1, orders: 2, products: 56, sum: 4_332_000, avg_check: 2_166_000, accent: "#10B981" },
  { range: "5-10 mln", clients: 7, orders: 7, products: 635, sum: 48_073_650, avg_check: 6_867_664, accent: "#D97706" },
  { range: "10-20 mln", clients: 2, orders: 2, products: 270, sum: 21_874_500, avg_check: 10_937_250, accent: "#C75D3C" },
  { range: "20+ mln", clients: 0, orders: 0, products: 0, sum: 0, avg_check: 0, accent: "#7C3AED" },
]

const TOTAL_CLIENTS = TIERS.reduce((s, t) => s + t.clients, 0)
const TOTAL_ORDERS = TIERS.reduce((s, t) => s + t.orders, 0)
const TOTAL_SUM = TIERS.reduce((s, t) => s + t.sum, 0)

export default function KlassifikatsiyaPage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/hisobot" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> HISOBOTLAR
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klient <span className="italic text-[#C75D3C]">klassifikatsiyasi</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Monetary tier ABC analysis · 7 daraja · Joriy oy
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Filter className="w-4 h-4" /> Filter</Button>
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            </div>
          </div>

          {/* Visual hierarchy */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {TIERS.map(t => (
              <Card key={t.range} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-4 text-center relative overflow-hidden">
                <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: t.accent }}>{t.range}</div>
                <div className="text-3xl font-medium tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{t.clients}</div>
                <div className="text-xs text-[#9C8A6E] mt-1">klient</div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: t.accent }} />
              </Card>
            ))}
          </div>

          {/* Big table */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klassifikatsiya</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Umumiy summa</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rtacha chek</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">% Sotuvdan</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map(t => {
                    const pct = TOTAL_SUM > 0 ? (t.sum / TOTAL_SUM) * 100 : 0
                    return (
                      <tr key={t.range} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded" style={{ background: t.accent }} />
                            <span className="text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{t.range}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-base font-medium text-[#1A1A1A]">{t.clients}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#6B5B4D]">{t.orders}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#6B5B4D]">{t.products}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{t.sum.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">{t.avg_check.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex-1 h-2 bg-[#F0EAE0] rounded-full overflow-hidden max-w-[80px]">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.accent }} />
                            </div>
                            <span className="font-medium w-12 text-[#1A1A1A]">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                  <tr>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami</td>
                    <td className="px-4 py-3 text-right tabular-nums text-2xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{TOTAL_CLIENTS}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-lg font-medium text-[#1A1A1A]">{TOTAL_ORDERS}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-lg font-medium text-[#1A1A1A]">{TIERS.reduce((s, t) => s + t.products, 0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-2xl font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{TOTAL_SUM.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Insight */}
          <Card className="p-6 bg-white border border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-[#C75D3C]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-[#C75D3C] font-medium">INSIGHTS</div>
                <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Pareto qoidasi va tavsiyalar</h3>
                <ul className="text-sm text-[#6B5B4D] mt-3 space-y-1.5">
                  <li><span className="font-medium text-[#1A1A1A]">Pareto:</span> 7 ta VIP klient (5-10 mln) jami sotuvning {((TIERS[4].sum / TOTAL_SUM) * 100).toFixed(0)}%ini ta'minlaydi</li>
                  <li><span className="font-medium text-[#1A1A1A]">Quyi tier (&lt;1 mln):</span> {TIERS[0].clients} klient, lekin faqat {((TIERS[0].sum / TOTAL_SUM) * 100).toFixed(0)}% sotuv</li>
                  <li><span className="font-medium text-[#1A1A1A]">Tavsiya:</span> 5-20 mln klientlar bilan ko'proq vaqt sarflang — ROI yuqori</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
