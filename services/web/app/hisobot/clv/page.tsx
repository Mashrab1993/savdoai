"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Calendar, Download, Crown, Users } from "lucide-react"
import Link from "next/link"

type ClientCLV = {
  id: number; name: string; segment: string; firstOrder: string;
  monthsActive: number; totalOrders: number; totalSpent: number;
  avgOrderValue: number; orderFrequency: number;
  predictedClv: number; predictedMonths: number;
  retention: number;
}

const CLIENTS: ClientCLV[] = [
  { id: 1024, name: "Salom Magazin №1", segment: "Champions", firstOrder: "2024-08-12", monthsActive: 21, totalOrders: 168, totalSpent: 28_400_000, avgOrderValue: 169_000, orderFrequency: 8, predictedClv: 84_000_000, predictedMonths: 60, retention: 95 },
  { id: 1142, name: "Дастархон Сервис", segment: "Champions", firstOrder: "2024-09-10", monthsActive: 20, totalOrders: 142, totalSpent: 24_800_000, avgOrderValue: 175_000, orderFrequency: 7, predictedClv: 72_000_000, predictedMonths: 60, retention: 92 },
  { id: 1058, name: "Bona Магазин", segment: "Loyal", firstOrder: "2024-12-05", monthsActive: 17, totalOrders: 84, totalSpent: 18_200_000, avgOrderValue: 217_000, orderFrequency: 5, predictedClv: 54_400_000, predictedMonths: 48, retention: 88 },
  { id: 1224, name: "Гулямов Маркет", segment: "Loyal", firstOrder: "2025-02-01", monthsActive: 15, totalOrders: 64, totalSpent: 12_800_000, avgOrderValue: 200_000, orderFrequency: 4, predictedClv: 42_000_000, predictedMonths: 48, retention: 84 },
  { id: 1342, name: "Bona Maxsus Магазин", segment: "Potential", firstOrder: "2025-09-18", monthsActive: 8, totalOrders: 18, totalSpent: 4_240_000, avgOrderValue: 235_000, orderFrequency: 2, predictedClv: 18_400_000, predictedMonths: 36, retention: 76 },
  { id: 1456, name: "Yangi Magazin Чорсу", segment: "New", firstOrder: "2026-04-01", monthsActive: 1, totalOrders: 4, totalSpent: 720_000, avgOrderValue: 180_000, orderFrequency: 4, predictedClv: 12_400_000, predictedMonths: 36, retention: 0 },
  { id: 1389, name: "Ali Ake Магазин", segment: "At Risk", firstOrder: "2024-10-15", monthsActive: 19, totalOrders: 28, totalSpent: 6_800_000, avgOrderValue: 243_000, orderFrequency: 1.5, predictedClv: 8_400_000, predictedMonths: 12, retention: 42 },
  { id: 1402, name: "Гулямов Магазин Сирож", segment: "Hibernating", firstOrder: "2024-06-20", monthsActive: 23, totalOrders: 38, totalSpent: 8_400_000, avgOrderValue: 221_000, orderFrequency: 1, predictedClv: 4_200_000, predictedMonths: 6, retention: 18 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const SEGMENT_COLOR: Record<string, string> = {
  Champions: "bg-[#FCE9DD] text-[#D97706]",
  Loyal: "bg-emerald-50 text-emerald-700",
  Potential: "bg-blue-50 text-blue-700",
  New: "bg-purple-50 text-purple-700",
  "At Risk": "bg-[#F5E5D6] text-[#C75D3C]",
  Hibernating: "bg-[#F0EAE0] text-[#6B5B4D]",
}

export default function ClvPage() {
  const sorted = [...CLIENTS].sort((a, b) => b.predictedClv - a.predictedClv)
  const totalClv = CLIENTS.reduce((s, c) => s + c.predictedClv, 0)
  const avgClv = Math.round(totalClv / CLIENTS.length)
  const totalCurrent = CLIENTS.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klient hayot <span className="italic text-[#C75D3C]">qiymati (CLV)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Customer Lifetime Value bashorati · {CLIENTS.length} ta klient</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 12-oy</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Crown} accent="#10B981" label="Hozirgi tushum" value={`${fmt(totalCurrent / 1_000_000)} M`} />
            <KpiCard icon={TrendingUp} accent="#3B82F6" label="Bashorat CLV (jami)" value={`${fmt(totalClv / 1_000_000)} M`} />
            <KpiCard icon={Users} accent="#C75D3C" label="O'rtacha CLV" value={`${fmt(avgClv / 1_000_000)} M`} />
            <KpiCard icon={Crown} accent="#D97706" label="Top-1 klient CLV" value={`${fmt(sorted[0].predictedClv / 1_000_000)} M`} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>CLV jadvali (bashorat asosida)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Segment</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">1-xarid</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Aktivlik</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Hozirgi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz/oy</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Retention</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bashorat CLV</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, i) => (
                    <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-medium text-[#9C8A6E]">{i + 1}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">
                          {i < 3 && <span className="mr-1">{["🥇", "🥈", "🥉"][i]}</span>}
                          {c.name}
                        </div>
                        <div className="text-xs text-[#9C8A6E] font-mono">#{c.id}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEGMENT_COLOR[c.segment] ?? "bg-[#F0EAE0] text-[#6B5B4D]"}`}>{c.segment}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-xs text-[#9C8A6E]">{c.firstOrder}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{c.monthsActive}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-700 font-medium" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(c.totalSpent / 1_000_000)} M</td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(c.avgOrderValue)}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{c.orderFrequency.toFixed(1)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`px-2 py-0.5 rounded font-mono font-medium text-xs ${c.retention >= 80 ? "bg-emerald-50 text-emerald-700" : c.retention >= 60 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                          {c.retention}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(c.predictedClv / 1_000_000)} M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E0D3] text-xs text-[#9C8A6E]">
              💡 CLV formula: <span className="font-mono text-[#1A1A1A]">avgOrderValue × orderFrequency × predictedMonths × retention%</span>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C]">STRATEGIYA TAVSIYALARI</div>
                <ul className="text-sm text-[#1A1A1A] mt-2 space-y-1.5">
                  <li>• <span className="font-medium">Champions/Loyal</span> ({CLIENTS.filter(c => c.segment === "Champions" || c.segment === "Loyal").length}) — VIP xizmat, premium tovar, alohida menejer</li>
                  <li>• <span className="font-medium">Potential/New</span> ({CLIENTS.filter(c => c.segment === "Potential" || c.segment === "New").length}) — onboarding, chegirma, pastdan-yuqoriga strategiya</li>
                  <li>• <span className="font-medium">At Risk/Hibernating</span> ({CLIENTS.filter(c => c.segment === "At Risk" || c.segment === "Hibernating").length}) — reaktivatsiya kampaniya, agressiv promo, qo'ng'iroq</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
