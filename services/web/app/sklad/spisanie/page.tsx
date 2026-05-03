"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; qoldiq: number; min_qoldiq?: number; olish_narxi?: number; sotish_narxi: number }
type TovarResp = { total: number; items: Tovar[] }

export default function SpisaniePage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const items = data?.items ?? []

  // Items with negative qoldiq = write-off candidates
  const negative = items.filter(t => t.qoldiq < 0)
  const totalLoss = negative.reduce((s, t) => s + Math.abs(t.qoldiq) * Number(t.olish_narxi || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Spisaniya (Write-off)</h1>
            <p className="text-base text-slate-500 mt-1">
              Manfiy qoldiqdagi tovarlar — yozish kerak
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-rose-200 bg-rose-50/40">
            <div className="text-xs uppercase font-semibold text-rose-700">Manfiy qoldiq</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{negative.length}</div>
            <div className="text-sm text-slate-600 mt-1">tovar</div>
          </Card>
          <Card className="p-5 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">Yo'qotish (taxminiy)</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{formatCurrency(totalLoss)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && negative.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            ✅ Hech qanday manfiy qoldiq yo'q — sklad to'g'ri.
          </Card>
        )}

        {negative.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-rose-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Yo'qotish</th>
                    <th className="px-4 py-3 text-right font-semibold">Spisat (taxminiy)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {negative.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 bg-rose-50/30">
                      <td className="px-4 py-2"><AlertTriangle className="w-4 h-4 text-rose-600" /></td>
                      <td className="px-4 py-2 font-medium">{t.nomi}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-700">{t.qoldiq}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Math.abs(t.qoldiq)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-amber-700">
                        {formatCurrency(Math.abs(t.qoldiq) * Number(t.olish_narxi || 0))}
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
