"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Agent = { agent_id?: number; agent_ismi?: string; vizitlar_soni?: number; jami_sotuv?: number; buyurtmalar_soni?: number; klient_soni?: number }
type Resp = Agent[] | { agentlar?: Agent[] }

export default function KomandaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const agentId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data } = useApi<Resp>(isAuthenticated ? "/api/v1/hisobot/agent" : null)
  const agents: Agent[] = Array.isArray(data) ? data : (data?.agentlar ?? [])
  const agent = agents.find(a => a.agent_id === agentId)
  return (
    <AdminLayout>
      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agent?.agent_ismi || `Agent #${agentId}`}</h1>
            <p className="text-base text-slate-500 mt-1">Agent profili va KPI</p>
          </div>
        </div>
        {agent && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-blue-200 bg-blue-50/40"><div className="text-xs uppercase font-semibold text-blue-700">Vizitlar</div><div className="text-2xl font-bold text-blue-800 tabular-nums">{agent.vizitlar_soni ?? 0}</div></Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50/40"><div className="text-xs uppercase font-semibold text-emerald-700">Klientlar</div><div className="text-2xl font-bold text-emerald-800 tabular-nums">{agent.klient_soni ?? 0}</div></Card>
            <Card className="p-4 border-amber-200 bg-amber-50/40"><div className="text-xs uppercase font-semibold text-amber-700">Buyurtmalar</div><div className="text-2xl font-bold text-amber-800 tabular-nums">{agent.buyurtmalar_soni ?? 0}</div></Card>
            <Card className="p-4 border-purple-200 bg-purple-50/40"><div className="text-xs uppercase font-semibold text-purple-700">Sotuv</div><div className="text-2xl font-bold text-purple-800 tabular-nums">{formatCurrency(Number(agent.jami_sotuv ?? 0))}</div></Card>
          </div>
        )}
        {!agent && <Card className="p-8 text-center text-slate-500">Agent #{agentId} topilmadi</Card>}
      </div>
    </AdminLayout>
  )
}
