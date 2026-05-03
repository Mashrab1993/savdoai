"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = { id: number; sana: string; jami: number; tolangan?: number; qarz?: number; izoh?: string }
type SavdoResp = { total: number; items: SotuvRow[] }
type Klient = { id: number; ism: string; jami_sotib?: number; qarz?: number }

export default function KlientCashboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const klientId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data: sotuvlar, loading } = useApi<SavdoResp>(
    isAuthenticated && klientId ? `/api/v1/savdolar?klient_id=${klientId}&limit=100` : null
  )
  const { data: klient } = useApi<Klient>(
    isAuthenticated && klientId ? `/api/v1/klient/${klientId}/profil` : null
  )
  const items = sotuvlar?.items ?? []
  const totalSold = items.reduce((s, x) => s + Number(x.jami || 0), 0)
  const totalPaid = items.reduce((s, x) => s + Number(x.tolangan || 0), 0)
  const totalDebt = items.reduce((s, x) => s + Number(x.qarz || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${klientId}`} className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kassa harakatlari</h1>
            <p className="text-base text-slate-500 mt-1">
              {klient?.ism || `Klient #${klientId}`}: to'lovlar va sotuvlar tarixi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Jami xarid</div>
            <div className="text-2xl font-bold text-blue-800 tabular-nums">{formatCurrency(totalSold)}</div>
          </Card>
          <Card className="p-4 border-emerald-200 bg-emerald-50/40">
            <div className="text-xs uppercase font-semibold text-emerald-700">To'langan</div>
            <div className="text-2xl font-bold text-emerald-800 tabular-nums">{formatCurrency(totalPaid)}</div>
          </Card>
          <Card className={`p-4 border-2 ${totalDebt > 0 ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-slate-50/40"}`}>
            <div className="text-xs uppercase font-semibold text-rose-700">Qarz</div>
            <div className={`text-2xl font-bold tabular-nums ${totalDebt > 0 ? "text-rose-800" : "text-slate-400"}`}>{formatCurrency(totalDebt)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami</th>
                    <th className="px-4 py-3 text-right font-semibold">To'landi</th>
                    <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><DollarSign className="w-4 h-4 text-slate-400" /></td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">{new Date(s.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(s.jami))}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(Number(s.tolangan || 0))}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-rose-700">{Number(s.qarz || 0) > 0 ? formatCurrency(Number(s.qarz)) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha sotuv yo'q</Card>
        )}
      </div>
    </AdminLayout>
  )
}
