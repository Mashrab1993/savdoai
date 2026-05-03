"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Target, Users, Box, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type DashboardStats = {
  today_sum?: number
  today_count?: number
}

type SavdoResp = { total: number }
type KlientResp = { total: number }
type TovarResp = { total: number }

export default function PlansSetupPage() {
  const { isAuthenticated } = useAuth()
  const { data: stats } = useApi<DashboardStats>(isAuthenticated ? "/api/v1/dashboard/summary" : null)
  const { data: savdoResp } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=1" : null)
  const { data: klientResp } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=1" : null)
  const { data: tovarResp } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=1" : null)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/plans" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plan setup</h1>
            <p className="text-base text-slate-500 mt-1">
              Asosiy reja: oylik sotuv, vizit, klient hududlari
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase font-semibold text-emerald-700">Bugungi sotuv</span>
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-800 tabular-nums">
                {formatCurrency(stats?.today_sum || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stats?.today_count || 0} ta zakaz</div>
            </Card>
            <Card className="p-5 border-blue-200 bg-blue-50/40">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase font-semibold text-blue-700">Jami sotuv</span>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-800 tabular-nums">{savdoResp?.total ?? "..."}</div>
            </Card>
            <Card className="p-5 border-amber-200 bg-amber-50/40">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase font-semibold text-amber-700">Klientlar</span>
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-800 tabular-nums">{klientResp?.total ?? "..."}</div>
            </Card>
            <Card className="p-5 border-purple-200 bg-purple-50/40">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase font-semibold text-purple-700">Tovarlar</span>
                <Box className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-800 tabular-nums">{tovarResp?.total ?? "..."}</div>
            </Card>
          </div>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Plan moduli</h3>
          <p className="text-sm text-slate-600 mb-4">
            Bu funksiya hali to'liq qurilmagan. Hozirgi statistika real ma'lumotlardan olinadi,
            lekin oylik plan/target sozlash tizimi rivojlantirilmoqda.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800">
            <strong>Kelajakda:</strong> Oylik sotuv targeti, agent-level KPI, klient-level visit reja.
            Hozir esa siz sotuv qila olasiz, statistika real-time ko'rsatiladi.
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
