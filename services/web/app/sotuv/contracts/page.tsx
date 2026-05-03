"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Klient = { id: number; ism: string; jami_sotib?: number; kredit_limit?: number }
type KlientResp = { total: number; items: Klient[] }

export default function ContractsPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=100" : null)
  // Treat klients with kredit_limit > 0 as "having contract"
  const contracted = (data?.items ?? []).filter(k => (k.kredit_limit ?? 0) > 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Shartnomalar</h1>
            <p className="text-base text-slate-500 mt-1">
              Kredit limitli klientlar (shartnoma asosida)
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && contracted.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Shartnomalik klient yo'q. Klientga kredit limit qo'ying — shartnoma deb hisoblanadi.
          </Card>
        )}

        {contracted.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right font-semibold">Kredit limit</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami xarid</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contracted.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><FileText className="w-4 h-4 text-blue-600" /></td>
                      <td className="px-4 py-2 font-medium">
                        <Link href={`/klientlar/${k.id}`} className="hover:text-emerald-700">{k.ism}</Link>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-blue-700">{formatCurrency(Number(k.kredit_limit))}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(k.jami_sotib || 0))}</td>
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
