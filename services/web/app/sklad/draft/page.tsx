"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = {
  id: number
  nomi: string
  qoldiq: number
  min_qoldiq?: number
  birlik?: string
  sotish_narxi: number
  olish_narxi?: number
}

type TovarResp = { total: number; items: Tovar[] }

export default function DraftPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)

  const items = data?.items ?? []
  // Draft = "shoshilinch yangilash kerak" tovarlar (kam qoldiq yoki tugagan)
  const drafts = items.filter(t => t.qoldiq <= (t.min_qoldiq || 0)).sort((a, b) => a.qoldiq - b.qoldiq)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Draft (kerak qilish)</h1>
            <p className="text-base text-slate-500 mt-1">
              Kam qoldiqli tovarlar — shoshilinch ravishda kirim qilish kerak
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && drafts.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            ✅ Hech qanday kam qoldiq yo'q — barcha tovar yetarli
          </Card>
        )}

        {drafts.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Min</th>
                    <th className="px-4 py-3 text-right font-semibold">Kerak</th>
                    <th className="px-4 py-3 text-right font-semibold">Tahminiy summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drafts.slice(0, 100).map(t => {
                    const need = Math.max(0, (t.min_qoldiq || 0) * 2 - t.qoldiq)  // double the min
                    return (
                      <tr key={t.id} className={`hover:bg-slate-50 ${t.qoldiq < 0 ? "bg-rose-50" : t.qoldiq === 0 ? "bg-rose-50/50" : "bg-amber-50/30"}`}>
                        <td className="px-4 py-2 font-medium flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${t.qoldiq < 0 ? "text-rose-700" : t.qoldiq === 0 ? "text-rose-500" : "text-amber-600"}`} />
                          {t.nomi}
                        </td>
                        <td className={`px-4 py-2 text-right tabular-nums font-bold ${t.qoldiq < 0 ? "text-rose-700" : t.qoldiq === 0 ? "text-rose-600" : "text-amber-700"}`}>
                          {t.qoldiq} {t.birlik || ""}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">{t.min_qoldiq ?? 0}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{need} {t.birlik || ""}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                          {formatCurrency(need * Number(t.olish_narxi || t.sotish_narxi || 0))}
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
