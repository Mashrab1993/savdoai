"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Truck } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type EkspRow = {
  agent_id?: number
  agent_ismi?: string
  jami_summa?: number
  yetkazilgan_summa?: number
  jami_buyurtma?: number
  yetkazilgan?: number
  kutilmoqda?: number
}

type Resp = EkspRow[] | { items?: EkspRow[]; agentlar?: EkspRow[] }

export default function ExpeditorDebtPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<Resp>(isAuthenticated ? "/api/v1/hisobot/ekspeditor" : null)
  let items: EkspRow[] = []
  if (Array.isArray(data)) items = data
  else if (data?.items) items = data.items
  else if (data?.agentlar) items = data.agentlar

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ekspeditor qarz</h1>
            <p className="text-base text-slate-500 mt-1">
              Ekspeditorlarda qolgan summa (jami − yetkazilgan)
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha ekspeditor faolligi yo'q</Card>
        )}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ekspeditor</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami buyurtma</th>
                    <th className="px-4 py-3 text-right font-semibold">Yetkazilgan</th>
                    <th className="px-4 py-3 text-right font-semibold">Kutilmoqda</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami summa</th>
                    <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((e, i) => {
                    const debt = Number(e.jami_summa ?? 0) - Number(e.yetkazilgan_summa ?? 0)
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600" />
                          {e.agent_ismi || `Ekspeditor #${e.agent_id ?? i + 1}`}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{e.jami_buyurtma ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{e.yetkazilgan ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-amber-700">{e.kutilmoqda ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(e.jami_summa ?? 0))}</td>
                        <td className={`px-4 py-2 text-right tabular-nums font-bold ${debt > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                          {formatCurrency(debt)}
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
