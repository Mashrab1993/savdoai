"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; qoldiq: number; sotish_narxi: number; olish_narxi?: number }
type TovarResp = { total: number; items: Tovar[] }

export default function QaytarishPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const items = data?.items ?? []
  // Tovarlar with high qoldiq might be returned to supplier
  const candidates = items.filter(t => t.qoldiq > 50).sort((a, b) => b.qoldiq - a.qoldiq).slice(0, 30)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Postavshikga qaytarish</h1>
            <p className="text-base text-slate-500 mt-1">
              Ortiqcha qoldiqdagi tovarlar — postavshikga qaytarish kandidatlari
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && candidates.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Ortiqcha qoldiq yo'q</Card>
        )}

        {candidates.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Tahminiy qiymat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {candidates.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><RotateCcw className="w-4 h-4 text-amber-600" /></td>
                      <td className="px-4 py-2 font-medium">{t.nomi}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-amber-700">{t.qoldiq}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
                        {formatCurrency(t.qoldiq * Number(t.olish_narxi || t.sotish_narxi || 0))}
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
