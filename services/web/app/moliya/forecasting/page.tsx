"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type FoydaResp = { tushum: number; yalpi_foyda: number; sof_foyda: number; xarajatlar: number }

export default function ForecastingPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<FoydaResp>(isAuthenticated ? "/api/v1/hisobot/foyda?kunlar=30" : null)
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/moliya" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moliyaviy bashorat</h1>
            <p className="text-base text-slate-500 mt-1">Moliya — Moliyaviy bashorat (oxirgi 30 kun){!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-emerald-200 bg-emerald-50/40"><div className="text-xs uppercase font-semibold text-emerald-700">Tushum</div><div className="text-2xl font-bold text-emerald-800 tabular-nums">{formatCurrency(data.tushum)}</div></Card>
            <Card className="p-5 border-blue-200 bg-blue-50/40"><div className="text-xs uppercase font-semibold text-blue-700">Yalpi foyda</div><div className="text-2xl font-bold text-blue-800 tabular-nums">{formatCurrency(data.yalpi_foyda)}</div></Card>
            <Card className="p-5 border-amber-200 bg-amber-50/40"><div className="text-xs uppercase font-semibold text-amber-700">Xarajatlar</div><div className="text-2xl font-bold text-amber-800 tabular-nums">{formatCurrency(data.xarajatlar)}</div></Card>
            <Card className={`p-5 border-2 ${data.sof_foyda >= 0 ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}`}><div className="text-xs uppercase font-semibold">Sof foyda</div><div className={`text-2xl font-bold tabular-nums ${data.sof_foyda >= 0 ? "text-emerald-800" : "text-rose-800"}`}>{formatCurrency(data.sof_foyda)}</div></Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
