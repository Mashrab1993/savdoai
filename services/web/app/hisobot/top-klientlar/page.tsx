"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Users, Trophy } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type TopKlient = {
  klient_ismi?: string
  ism?: string
  jami_sotib?: number
  summa?: number
  sotuv_soni?: number
}

type Resp = TopKlient[] | { items?: TopKlient[] }

export default function TopKlientlarPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<Resp>(isAuthenticated ? "/api/v1/hisobot/top-klientlar?limit=20" : null)

  const items: TopKlient[] = Array.isArray(data) ? data : (data?.items ?? [])
  const max = items.reduce((m, x) => Math.max(m, Number(x.jami_sotib ?? x.summa ?? 0)), 0) || 1

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Top Klientlar</h1>
            <p className="text-base text-slate-500 mt-1">
              Eng faol klientlar — sotib olish summasi bo'yicha
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha klientlar yo'q. <Link href="/sotuv/yangi" className="text-emerald-600 underline">Birinchi sotuvni qiling</Link>
          </Card>
        )}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Sotuvlar</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Jami summa</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/3">Hisob</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((k, i) => {
                    const sum = Number(k.jami_sotib ?? k.summa ?? 0)
                    const pct = (sum / max) * 100
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {i < 3 ? (
                            <Trophy className={`w-5 h-5 ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-orange-700"}`} />
                          ) : (
                            <span className="text-slate-500 font-medium">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {k.klient_ismi || k.ism || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-600">
                          {k.sotuv_soni ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                          {formatCurrency(sum)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
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
