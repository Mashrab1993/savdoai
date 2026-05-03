"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Wallet } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Klient = { id: number; ism: string; jami_sotib?: number; qarz?: number }
type KlientResp = { total: number; items: Klient[] }

export default function InitBalansPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=200" : null)
  const klients = data?.items ?? []

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boshlang'ich balans</h1>
            <p className="text-base text-slate-500 mt-1">
              Klientlarning boshlang'ich balansi (eski qarzlar va to'lovlar)
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Wallet className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Boshlang'ich balans</h3>
              <p className="text-sm text-blue-800 mt-1">
                Tizimni boshlash vaqtida har klient uchun mavjud qarz/avans summasi.
                Hozir har klient uchun jami xarid va qarz ko'rsatiladi.
              </p>
            </div>
          </div>
        </Card>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {klients.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami xarid</th>
                    <th className="px-4 py-3 text-right font-semibold">Joriy qarz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {klients.slice(0, 100).map(k => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">
                        <Link href={`/klientlar/${k.id}`} className="hover:text-emerald-700">{k.ism}</Link>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(k.jami_sotib || 0))}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-bold ${Number(k.qarz || 0) > 0 ? "text-rose-700" : "text-slate-400"}`}>
                        {Number(k.qarz || 0) > 0 ? formatCurrency(Number(k.qarz)) : "0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
