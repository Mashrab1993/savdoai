"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; qoldiq: number; olish_narxi?: number; brend?: string }
type TovarResp = { total: number; items: Tovar[] }

export default function DailyRemainderPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const items = data?.items ?? []
  const sorted = items.slice().sort((a, b) => b.qoldiq - a.qoldiq)
  const totalQty = items.reduce((s, t) => s + Math.max(0, t.qoldiq), 0)
  const totalValue = items.reduce((s, t) => s + Math.max(0, t.qoldiq) * Number(t.olish_narxi || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kunlik qoldiq</h1>
            <p className="text-base text-slate-500 mt-1">
              Bugungi to'liq qoldiq snapshot
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Jami SKU</div>
            <div className="text-3xl font-bold text-blue-800 tabular-nums">{items.length}</div>
          </Card>
          <Card className="p-4 border-emerald-200 bg-emerald-50/40">
            <div className="text-xs uppercase font-semibold text-emerald-700">Jami qoldiq</div>
            <div className="text-3xl font-bold text-emerald-800 tabular-nums">{totalQty.toLocaleString("ru-RU")}</div>
          </Card>
          <Card className="p-4 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">Ombor qiymati</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{formatCurrency(totalValue)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {sorted.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b">
              <h3 className="font-semibold">Tovarlar (qoldiq bo'yicha kamayuvchi)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-left font-semibold">Brend</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Qiymati</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sorted.slice(0, 100).map((t, i) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 font-medium">{t.nomi}</td>
                      <td className="px-4 py-2 text-slate-600">{t.brend || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold">{t.qoldiq}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(t.qoldiq * Number(t.olish_narxi || 0))}</td>
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
