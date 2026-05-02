"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Sparkles, Crown, AlertTriangle, Heart, UserX, UserCheck, Star } from "lucide-react"
import Link from "next/link"

const SEGMENTS = [
  { id: 'champions', label: 'Champions', icon: Crown, count: 18, sum: 56_320_000, color: "from-emerald-500 to-teal-600", desc: "Eng yaxshi klientlar — VIP" },
  { id: 'loyal', label: 'Sodiq klientlar', icon: Heart, count: 32, sum: 38_450_000, color: "from-blue-500 to-indigo-600", desc: "Tez-tez xarid qiladigan" },
  { id: 'potential', label: 'Yangi yulduzlar', icon: Star, count: 12, sum: 18_900_000, color: "from-purple-500 to-pink-600", desc: "Yangi, lekin yaxshi sotuv" },
  { id: 'risk', label: 'Risk ostida', icon: AlertTriangle, count: 24, sum: 12_300_000, color: "from-amber-500 to-orange-600", desc: "Sotuv tushyapti" },
  { id: 'sleep', label: 'Uxlovchi', icon: UserCheck, count: 38, sum: 8_500_000, color: "from-slate-400 to-slate-500", desc: "60+ kun harakat yo'q" },
  { id: 'lost', label: "Yo'qotilgan", icon: UserX, count: 5, sum: 1_200_000, color: "from-rose-500 to-pink-600", desc: "180+ kun harakat yo'q" },
]

export default function RFMPage() {
  const total = SEGMENTS.reduce((s, x) => s + x.count, 0)
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/hisobot" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Hisobotlar
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">✨ RFM Segmentatsiya</h1>
            <p className="text-base text-slate-500 mt-1">Recency × Frequency × Monetary · 6 segment · {total} klient</p>
          </div>
          <Button variant="outline"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        {/* 6 segment cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {SEGMENTS.map(s => {
            const Icon = s.icon
            return (
              <Card key={s.id} className={`bg-gradient-to-br ${s.color} text-white border-0 p-5 relative overflow-hidden`}>
                <Icon className="absolute right-3 top-3 w-12 h-12 opacity-20" />
                <div className="text-sm opacity-90 mb-1">{s.label}</div>
                <div className="text-4xl font-bold tabular-nums">{s.count}</div>
                <div className="text-xs opacity-75 mb-3">klient ({((s.count / total) * 100).toFixed(1)}%)</div>
                <div className="text-base font-semibold">{(s.sum / 1_000_000).toFixed(1)}M so'm</div>
                <div className="text-xs opacity-80 mt-3 border-t border-white/20 pt-2">{s.desc}</div>
              </Card>
            )
          })}
        </div>

        {/* RFM matrix */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">RFM Matritsasi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 bg-slate-50 border border-slate-200">Recency / Frequency</th>
                  <th className="text-center px-3 py-2 bg-slate-50 border border-slate-200">F1 (Kam)</th>
                  <th className="text-center px-3 py-2 bg-slate-50 border border-slate-200">F2</th>
                  <th className="text-center px-3 py-2 bg-slate-50 border border-slate-200">F3</th>
                  <th className="text-center px-3 py-2 bg-slate-50 border border-slate-200">F4</th>
                  <th className="text-center px-3 py-2 bg-slate-50 border border-slate-200">F5 (Ko'p)</th>
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map(r => (
                  <tr key={r}>
                    <td className="px-3 py-2 bg-slate-50 border border-slate-200 font-semibold">R{r} {r === 5 ? '(Yangi)' : r === 1 ? '(Eski)' : ''}</td>
                    {[1, 2, 3, 4, 5].map(f => {
                      const score = r * 10 + f
                      let color = "bg-slate-50"
                      let label = ""
                      if (score >= 54) { color = "bg-emerald-200"; label = "VIP" }
                      else if (score >= 44) { color = "bg-emerald-100"; label = "Loyal" }
                      else if (score >= 33) { color = "bg-blue-100"; label = "Potential" }
                      else if (score >= 22) { color = "bg-amber-100"; label = "Risk" }
                      else { color = "bg-rose-100"; label = "Lost" }
                      const count = Math.floor(Math.random() * 15)
                      return (
                        <td key={f} className={`text-center px-3 py-3 border border-slate-200 ${color}`}>
                          <div className="text-xs font-semibold">{label}</div>
                          <div className="text-lg font-bold tabular-nums">{count}</div>
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
          <Card className="p-5 bg-emerald-50 border-emerald-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-emerald-700" /> Champions strategiyasi
            </h3>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>• VIP loyalty programa taklif qiling</li>
              <li>• Yangi mahsulotlarni birinchi ko'rsating</li>
              <li>• Personal manager biriktiring</li>
              <li>• Maxsus chegirmalar yuboring</li>
            </ul>
          </Card>
          <Card className="p-5 bg-rose-50 border-rose-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-700" /> Risk ostidagilar uchun
            </h3>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>• Ag'dar ovoz — qaytarish kompaniyasi</li>
              <li>• Maxsus chegirma 15-20% taklif qiling</li>
              <li>• Sabab so'rab so'rovnoma yuboring</li>
              <li>• Agent qo'ng'iroq qilsin</li>
            </ul>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
