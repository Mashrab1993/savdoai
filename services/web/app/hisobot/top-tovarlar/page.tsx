"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = { id: number; sana: string; klient_ismi?: string; jami: number }
type SavdoResp = { total: number; items: SotuvRow[] }

export default function TopTovarlarPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=100" : null)
  const items = data?.items ?? []
  const total = items.reduce((s, x) => s + Number(x.jami || 0), 0)
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Top tovarlar</h1>
            <p className="text-base text-slate-500 mt-1">Hisobot — Top tovarlar{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-blue-200 bg-blue-50/40"><div className="text-xs uppercase font-semibold text-blue-700">Sotuv soni</div><div className="text-3xl font-bold text-blue-800 tabular-nums">{items.length}</div></Card>
          <Card className="p-5 border-emerald-200 bg-emerald-50/40"><div className="text-xs uppercase font-semibold text-emerald-700">Jami summa</div><div className="text-3xl font-bold text-emerald-800 tabular-nums">{formatCurrency(total)}</div></Card>
        </div>
        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {items.length > 0 && (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left font-semibold">Sana</th><th className="px-4 py-3 text-left font-semibold">Klient</th><th className="px-4 py-3 text-right font-semibold">Summa</th></tr></thead>
              <tbody className="divide-y">
                {items.slice(0, 50).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 tabular-nums text-slate-600">{new Date(s.sana).toLocaleDateString("uz-UZ")}</td>
                    <td className="px-4 py-2 font-medium">{s.klient_ismi || "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(Number(s.jami))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
