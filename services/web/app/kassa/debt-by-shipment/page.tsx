"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = { id: number; sana: string; klient_ismi?: string; jami: number; tolangan?: number; qarz?: number }
type SavdoResp = { total: number; items: SotuvRow[] }

export default function DebtByShipmentPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=500" : null)
  const items = data?.items ?? []
  const withDebt = items.filter(s => Number(s.qarz || 0) > 0).sort((a, b) => Number(b.qarz || 0) - Number(a.qarz || 0))
  const totalDebt = withDebt.reduce((s, x) => s + Number(x.qarz || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zakaz bo'yicha qarz</h1>
            <p className="text-base text-slate-500 mt-1">
              {withDebt.length} ta zakaz · Jami qarz: <span className="font-semibold text-rose-700 tabular-nums">{formatCurrency(totalDebt)}</span>
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && withDebt.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">✅ Qarz qolmagan zakaz yo'q</Card>
        )}

        {withDebt.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-rose-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">№</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami</th>
                    <th className="px-4 py-3 text-right font-semibold">To'langan</th>
                    <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withDebt.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><AlertCircle className="w-4 h-4 text-rose-600" /></td>
                      <td className="px-4 py-2 font-mono text-slate-500">#{s.id}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">{new Date(s.sana).toLocaleDateString("uz-UZ")}</td>
                      <td className="px-4 py-2 font-medium">{s.klient_ismi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(s.jami))}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(Number(s.tolangan || 0))}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-700">{formatCurrency(Number(s.qarz || 0))}</td>
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
