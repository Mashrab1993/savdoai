"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type TarixRow = {
  id: number
  sana: string
  turi?: string
  summa: number
  klient_ismi?: string
  izoh?: string
}
type TarixResp = { items: TarixRow[]; total: number }

export default function OplatyPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TarixResp>(isAuthenticated ? "/api/v1/kassa/tarix?limit=200" : null)
  const items = (data?.items ?? []).filter(i => (i.turi || "").toLowerCase() === "kirim")
  const total = items.reduce((s, i) => s + Number(i.summa || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klient to'lovlari</h1>
            <p className="text-base text-slate-500 mt-1">
              {items.length} ta to'lov · Jami: <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha to'lov yo'q</Card>
        )}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-emerald-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-left font-semibold">Izoh</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><DollarSign className="w-4 h-4 text-emerald-600" /></td>
                      <td className="px-4 py-2 text-slate-600 tabular-nums">
                        {new Date(i.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-2 font-medium">{i.klient_ismi || "—"}</td>
                      <td className="px-4 py-2 text-slate-600 truncate max-w-[200px]">{i.izoh || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(Number(i.summa))}</td>
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
