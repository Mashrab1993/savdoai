"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Tovar = { id: number; nomi: string; qoldiq: number; brend?: string; kategoriya?: string }
type TovarResp = { total: number; items: Tovar[] }

export default function SkuAuditPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=200" : null)
  const items = data?.items ?? []

  const inStock = items.filter(t => t.qoldiq > 0)
  const outOfStock = items.filter(t => t.qoldiq <= 0)
  const coverage = items.length > 0 ? (inStock.length / items.length) * 100 : 0

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SKU audit</h1>
            <p className="text-base text-slate-500 mt-1">
              SKU coverage — mahsulot ro'yxatining to'liqligi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 border-emerald-200 bg-emerald-50/50">
            <div className="text-xs uppercase font-semibold text-emerald-700">SKU bor</div>
            <div className="text-3xl font-bold text-emerald-800 tabular-nums">{inStock.length}</div>
          </Card>
          <Card className="p-5 border-rose-200 bg-rose-50/50">
            <div className="text-xs uppercase font-semibold text-rose-700">SKU yo'q</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{outOfStock.length}</div>
          </Card>
          <Card className="p-5 border-blue-200 bg-blue-50/50">
            <div className="text-xs uppercase font-semibold text-blue-700">Coverage</div>
            <div className="text-3xl font-bold text-blue-800 tabular-nums">{coverage.toFixed(1)}%</div>
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
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-left font-semibold">Brend</th>
                    <th className="px-4 py-3 text-left font-semibold">Kategoriya</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.slice(0, 100).map(t => (
                    <tr key={t.id} className={`hover:bg-slate-50 ${t.qoldiq <= 0 ? "bg-rose-50/30" : ""}`}>
                      <td className="px-4 py-2">
                        {t.qoldiq > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                      </td>
                      <td className="px-4 py-2 font-medium">{t.nomi}</td>
                      <td className="px-4 py-2 text-slate-600">{t.brend || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{t.kategoriya || "—"}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-bold ${t.qoldiq > 0 ? "text-emerald-700" : "text-rose-700"}`}>{t.qoldiq}</td>
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
