"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type QarzRow = {
  id: number
  klient_ismi?: string
  qolgan: number
  sana: string
  yopildi?: boolean
  muddat?: string
}
type QarzResp = { items: QarzRow[]; total: number }

export default function AgingPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<QarzResp>(isAuthenticated ? "/api/v1/qarzlar?limit=500" : null)
  const qarzlar = (data?.items ?? []).filter(q => !q.yopildi && Number(q.qolgan) > 0)

  const now = Date.now()
  const buckets = { "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0 }
  const counts = { "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0 }
  qarzlar.forEach(q => {
    const days = Math.floor((now - new Date(q.sana).getTime()) / 86400000)
    let key: keyof typeof buckets
    if (days <= 7) key = "0-7"
    else if (days <= 15) key = "8-15"
    else if (days <= 30) key = "16-30"
    else if (days <= 50) key = "31-50"
    else if (days <= 90) key = "51-90"
    else key = "90+"
    buckets[key] += Number(q.qolgan)
    counts[key]++
  })
  const total = qarzlar.reduce((s, q) => s + Number(q.qolgan), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aging analiz</h1>
            <p className="text-base text-slate-500 mt-1">
              Qarzlar yoshi bo'yicha — qancha vaqt to'lanmagan
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-5 bg-rose-50 border-rose-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-600" />
              <div>
                <div className="text-xs uppercase font-semibold text-rose-700">JAMI to'lanmagan qarz</div>
                <div className="text-3xl font-bold text-rose-800 tabular-nums">{formatCurrency(total)}</div>
                <div className="text-sm text-rose-600">{qarzlar.length} ta yozuv</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(buckets).map(([range, sum]) => {
            const cnt = counts[range as keyof typeof counts]
            const isOld = range === "31-50" || range === "51-90" || range === "90+"
            return (
              <Card key={range} className={`p-4 border-2 ${isOld ? "border-rose-200 bg-rose-50/40" : "border-emerald-200 bg-emerald-50/40"}`}>
                <div className={`text-xs uppercase font-semibold ${isOld ? "text-rose-700" : "text-emerald-700"} mb-1`}>{range} kun</div>
                <div className="text-xl font-bold tabular-nums">{formatCurrency(sum)}</div>
                <div className="text-xs text-slate-500 mt-1">{cnt} ta</div>
              </Card>
            )
          })}
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && qarzlar.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-right font-semibold">Yoshi (kun)</th>
                    <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {qarzlar.slice(0, 100).sort((a, b) => new Date(a.sana).getTime() - new Date(b.sana).getTime()).map(q => {
                    const days = Math.floor((now - new Date(q.sana).getTime()) / 86400000)
                    const isOld = days > 30
                    return (
                      <tr key={q.id} className={`hover:bg-slate-50 ${isOld ? "bg-rose-50/30" : ""}`}>
                        <td className="px-4 py-2 font-medium">{q.klient_ismi || "—"}</td>
                        <td className="px-4 py-2 text-slate-600">{new Date(q.sana).toLocaleDateString("uz-UZ")}</td>
                        <td className={`px-4 py-2 text-right tabular-nums font-bold ${isOld ? "text-rose-700" : "text-amber-700"}`}>
                          {days}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-700">{formatCurrency(Number(q.qolgan))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
