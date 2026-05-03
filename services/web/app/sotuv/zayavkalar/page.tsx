"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = {
  id: number
  sana: string
  klient_ismi?: string
  jami: number
  holat?: string
  qarz?: number
}
type SavdoResp = { total: number; items: SotuvRow[] }

export default function ZayavkalarPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=200" : null)
  const items = data?.items ?? []
  // Pending orders = yangi/otgruzka holatdagilar
  const pending = items.filter(s => ["yangi", "otgruzka", "tasdiqlangan"].includes((s.holat || "").toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zayavkalar (kutayotgan)</h1>
            <p className="text-base text-slate-500 mt-1">
              Hali yetkazilmagan yoki to'lanmagan zakazlar
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && pending.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            ✅ Kutayotgan zayavka yo'q — barcha zakazlar yopilgan
          </Card>
        )}

        {pending.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">№</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-left font-semibold">Holat</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                    <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pending.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><Clock className="w-4 h-4 text-amber-600" /></td>
                      <td className="px-4 py-2 font-mono text-slate-500">#{s.id}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">
                        {new Date(s.sana).toLocaleDateString("uz-UZ")}
                      </td>
                      <td className="px-4 py-2 font-medium">{s.klient_ismi || "—"}</td>
                      <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{s.holat || "yangi"}</span></td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold">{formatCurrency(Number(s.jami))}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-rose-700">
                        {Number(s.qarz || 0) > 0 ? formatCurrency(Number(s.qarz)) : "—"}
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
