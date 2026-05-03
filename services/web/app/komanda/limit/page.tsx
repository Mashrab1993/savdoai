"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type AgentRow = {
  agent_id?: number
  agent_ismi?: string
  vizitlar_soni?: number
  buyurtmalar_soni?: number
  jami_sotuv?: number
}

type AgentResp = { agentlar?: AgentRow[] } | AgentRow[]

export default function AgentLimitPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<AgentResp>(isAuthenticated ? "/api/v1/agentlar/bugungi-kpi" : null)

  const agents: AgentRow[] = Array.isArray(data) ? data : (data?.agentlar ?? [])

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent limitlari va KPI</h1>
            <p className="text-base text-slate-500 mt-1">
              Bugungi vizit va sotuv ko'rsatkichlari
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && agents.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Bugun hech kim faollik ko'rsatmagan
          </Card>
        )}

        {agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.agent_ismi || `Agent #${a.agent_id ?? i + 1}`}</div>
                    <div className="text-xs text-slate-500">Bugungi KPI</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vizitlar:</span>
                    <span className="font-bold tabular-nums">{a.vizitlar_soni ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zakazlar:</span>
                    <span className="font-bold tabular-nums">{a.buyurtmalar_soni ?? 0}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-slate-500">Sotuv:</span>
                    <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(Number(a.jami_sotuv ?? 0))}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
