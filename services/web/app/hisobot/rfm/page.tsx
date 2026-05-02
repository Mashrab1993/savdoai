"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Crown, AlertTriangle, Heart, UserX, UserCheck, Star } from "lucide-react"
import Link from "next/link"

const SEGMENTS = [
  { id: 'champions', label: 'Champions', icon: Crown, count: 18, sum: 56_320_000, accent: "#10B981", desc: "Eng yaxshi klientlar — VIP" },
  { id: 'loyal', label: 'Sodiq klientlar', icon: Heart, count: 32, sum: 38_450_000, accent: "#3B82F6", desc: "Tez-tez xarid qiladigan" },
  { id: 'potential', label: 'Yangi yulduzlar', icon: Star, count: 12, sum: 18_900_000, accent: "#8B5CF6", desc: "Yangi, lekin yaxshi sotuv" },
  { id: 'risk', label: 'Risk ostida', icon: AlertTriangle, count: 24, sum: 12_300_000, accent: "#D97706", desc: "Sotuv tushyapti" },
  { id: 'sleep', label: 'Uxlovchi', icon: UserCheck, count: 38, sum: 8_500_000, accent: "#9C8A6E", desc: "60+ kun harakat yo'q" },
  { id: 'lost', label: "Yo'qotilgan", icon: UserX, count: 5, sum: 1_200_000, accent: "#C75D3C", desc: "180+ kun harakat yo'q" },
]

export default function RFMPage() {
  const total = SEGMENTS.reduce((s, x) => s + x.count, 0)
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
                RFM <span className="italic text-[#C75D3C]">segmentatsiya</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Recency × Frequency × Monetary · 6 segment · {total} klient
              </p>
            </div>
            <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          {/* 6 segment cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {SEGMENTS.map(s => {
              const Icon = s.icon
              return (
                <Card key={s.id} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
                  <Icon className="absolute right-4 top-4 w-12 h-12 opacity-15" style={{ color: s.accent }} />
                  <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: s.accent }}>{s.label}</div>
                  <div className="text-4xl font-medium tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.count}</div>
                  <div className="text-xs text-[#9C8A6E]">klient ({((s.count / total) * 100).toFixed(1)}%)</div>
                  <div className="text-base font-medium mt-3 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{(s.sum / 1_000_000).toFixed(1)}M so'm</div>
                  <div className="text-xs text-[#6B5B4D] mt-3 border-t border-[#F0EAE0] pt-2">{s.desc}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: s.accent }} />
                </Card>
              )
            })}
          </div>

          {/* RFM matrix */}
          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">5×5 GRID</div>
            <h3 className="text-2xl font-light text-[#1A1A1A] mb-5" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>RFM Matritsasi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Recency / Frequency</th>
                    <th className="text-center px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">F1 (Kam)</th>
                    <th className="text-center px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">F2</th>
                    <th className="text-center px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">F3</th>
                    <th className="text-center px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">F4</th>
                    <th className="text-center px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">F5 (Ko'p)</th>
                  </tr>
                </thead>
                <tbody>
                  {[5, 4, 3, 2, 1].map(r => (
                    <tr key={r}>
                      <td className="px-3 py-2.5 bg-[#FAF7F2] border border-[#E8E0D3] font-medium text-[#1A1A1A]">R{r} {r === 5 ? '(Yangi)' : r === 1 ? '(Eski)' : ''}</td>
                      {[1, 2, 3, 4, 5].map(f => {
                        const score = r * 10 + f
                        let bg = "bg-[#FAF7F2]"
                        let textColor = "text-[#9C8A6E]"
                        let label = ""
                        if (score >= 54) { bg = "bg-emerald-100"; textColor = "text-emerald-800"; label = "VIP" }
                        else if (score >= 44) { bg = "bg-emerald-50"; textColor = "text-emerald-700"; label = "Loyal" }
                        else if (score >= 33) { bg = "bg-blue-50"; textColor = "text-blue-700"; label = "Potential" }
                        else if (score >= 22) { bg = "bg-[#FCE9DD]"; textColor = "text-[#D97706]"; label = "Risk" }
                        else { bg = "bg-[#F5E5D6]"; textColor = "text-[#C75D3C]"; label = "Lost" }
                        const count = ((r * 7 + f * 3) % 15) + 1
                        return (
                          <td key={f} className={`text-center px-3 py-4 border border-[#E8E0D3] ${bg}`}>
                            <div className={`text-xs font-medium ${textColor}`}>{label}</div>
                            <div className="text-xl font-medium tabular-nums text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{count}</div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Strategy hints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6 bg-white border border-emerald-200 shadow-sm rounded-2xl">
              <h3 className="text-xl font-light flex items-center gap-2 mb-3 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Crown className="w-5 h-5 text-emerald-700" /> Champions strategiyasi
              </h3>
              <ul className="text-sm text-[#6B5B4D] space-y-1.5">
                <li>• VIP loyalty programa taklif qiling</li>
                <li>• Yangi mahsulotlarni birinchi ko'rsating</li>
                <li>• Personal manager biriktiring</li>
                <li>• Maxsus chegirmalar yuboring</li>
              </ul>
            </Card>
            <Card className="p-6 bg-white border-2 border-[#C75D3C]/30 shadow-sm rounded-2xl">
              <h3 className="text-xl font-light flex items-center gap-2 mb-3 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <AlertTriangle className="w-5 h-5 text-[#C75D3C]" /> Risk ostidagilar uchun
              </h3>
              <ul className="text-sm text-[#6B5B4D] space-y-1.5">
                <li>• Qaytarish kompaniyasi</li>
                <li>• Maxsus chegirma 15-20% taklif qiling</li>
                <li>• Sabab so'rab so'rovnoma yuboring</li>
                <li>• Agent qo'ng'iroq qilsin</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
