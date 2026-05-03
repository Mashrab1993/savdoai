"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; qoldiq: number; min_qoldiq?: number; olish_narxi?: number }
type TovarResp = { total: number; items: Tovar[] }

export default function KorrektirovkaPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const items = data?.items ?? []
  // Items needing correction: negative or > 5x average
  const avg = items.reduce((s, t) => s + t.qoldiq, 0) / Math.max(1, items.length)
  const suspicious = items.filter(t => t.qoldiq < 0 || t.qoldiq > avg * 5)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Korrektirovka</h1>
            <p className="text-base text-slate-500 mt-1">
              Qoldiq qo'lda tuzatish — manfiy yoki shubhali yuqori qoldiq
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Jami tovar</div>
            <div className="text-3xl font-bold text-blue-800 tabular-nums">{items.length}</div>
          </Card>
          <Card className="p-4 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">O'rtacha qoldiq</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{Math.round(avg)}</div>
          </Card>
          <Card className="p-4 border-rose-200 bg-rose-50/40">
            <div className="text-xs uppercase font-semibold text-rose-700">Shubhali</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{suspicious.length}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && suspicious.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">✅ Korrektirovka kerak emas</Card>
        )}

        {suspicious.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-rose-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Min</th>
                    <th className="px-4 py-3 text-right font-semibold">Qiymati</th>
                    <th className="px-4 py-3 text-left font-semibold">Sabab</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {suspicious.map(t => {
                    const reason = t.qoldiq < 0 ? "Manfiy" : "Juda yuqori"
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 bg-rose-50/30">
                        <td className="px-4 py-2"><AlertTriangle className="w-4 h-4 text-rose-600" /></td>
                        <td className="px-4 py-2 font-medium">{t.nomi}</td>
                        <td className={`px-4 py-2 text-right tabular-nums font-bold ${t.qoldiq < 0 ? "text-rose-700" : "text-amber-700"}`}>{t.qoldiq}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">{t.min_qoldiq ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(t.qoldiq * Number(t.olish_narxi || 0))}</td>
                        <td className="px-4 py-2 text-xs">
                          <span className={`px-2 py-0.5 rounded ${t.qoldiq < 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{reason}</span>
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
