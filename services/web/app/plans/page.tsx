"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Target, MapPin, BarChart3, Plus } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type DashboardStats = { today_sum?: number; today_count?: number }

export default function PlansPage() {
  const { isAuthenticated } = useAuth()
  const { data: stats } = useApi<DashboardStats>(isAuthenticated ? "/api/v1/dashboard/summary" : null)
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Planlar</h1>
            <p className="text-base text-slate-500 mt-1">Sotuv reja, agent target, klient hudud{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        {stats && (
          <Card className="p-5 bg-emerald-50 border-emerald-200">
            <div className="text-xs uppercase font-semibold text-emerald-700">Bugungi sotuv (real)</div>
            <div className="text-3xl font-bold text-emerald-800 tabular-nums">{formatCurrency(stats.today_sum || 0)}</div>
            <div className="text-sm text-slate-600">{stats.today_count || 0} ta zakaz</div>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/plans/setup"><Card className="p-5 hover:shadow-md cursor-pointer"><Target className="w-7 h-7 mb-2 text-emerald-600" /><h3 className="font-semibold">Asosiy plan</h3><p className="text-sm text-slate-500">Oylik visit + sotuv + KPI</p></Card></Link>
          <Link href="/plans/setup"><Card className="p-5 hover:shadow-md cursor-pointer"><MapPin className="w-7 h-7 mb-2 text-blue-600" /><h3 className="font-semibold">Outlet targeting</h3><p className="text-sm text-slate-500">Klient bo'yicha target</p></Card></Link>
          <Link href="/plans/setup"><Card className="p-5 hover:shadow-md cursor-pointer"><BarChart3 className="w-7 h-7 mb-2 text-purple-600" /><h3 className="font-semibold">Tovar plan</h3><p className="text-sm text-slate-500">Brand × agent</p></Card></Link>
        </div>
      </div>
    </AdminLayout>
  )
}
