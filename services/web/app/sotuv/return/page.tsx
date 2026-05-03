"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Plus } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = {
  id: number
  sana: string
  klient_ismi?: string
  jami: number
  holat?: string
}
type SavdoResp = { total: number; items: SotuvRow[] }

export default function ReturnPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=200" : null)

  const items = data?.items ?? []
  const returns = items.filter(s => (s.holat || "").toLowerCase() === "bekor" || (s.holat || "").toLowerCase() === "qaytarildi")
  const totalReturned = returns.reduce((s, x) => s + Number(x.jami || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Qaytarishlar (Return)</h1>
            <p className="text-base text-slate-500 mt-1">
              Bekor qilingan yoki qaytarilgan sotuvlar
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
          <Link href="/sotuv/yangi" className="px-4 py-2 bg-emerald-600 text-white rounded flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi sotuv
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-rose-200 bg-rose-50/40">
            <div className="text-xs uppercase font-semibold text-rose-700">Qaytarilgan soni</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{returns.length}</div>
          </Card>
          <Card className="p-5 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">Qaytarilgan summa</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{formatCurrency(totalReturned)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && returns.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            ✅ Hech qanday qaytarish yo'q — barcha sotuvlar qabul qilingan
          </Card>
        )}

        {returns.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-rose-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                    <th className="px-4 py-3 text-left font-semibold">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {returns.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><RotateCcw className="w-4 h-4 text-rose-600" /></td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">
                        {new Date(r.sana).toLocaleDateString("uz-UZ")}
                      </td>
                      <td className="px-4 py-2 font-medium">{r.klient_ismi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-700">{formatCurrency(Number(r.jami))}</td>
                      <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded">{r.holat || "bekor"}</span></td>
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
