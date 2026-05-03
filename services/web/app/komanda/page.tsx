"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Users, Truck, UserCheck, BarChart3, Calendar, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type AgentRow = {
  agent_id?: number
  agent_ismi?: string
  vizitlar_soni?: number
  buyurtmalar_soni?: number
  jami_sotuv?: number
  klient_soni?: number
}

type AgentResp = { agentlar?: AgentRow[]; jami?: { vizitlar?: number; buyurtmalar?: number; sotuv?: number } } | AgentRow[]

type EkspeditorResp = { items: Array<{ id: number; ism: string; telefon?: string; faol?: boolean }> }

const SECTIONS = [
  { slug: "limit", icon: BarChart3, title: "Agent limitlar", desc: "Kunlik/oylik limit" },
  { slug: "topshiriqlar", icon: UserCheck, title: "Vazifalar", desc: "To-do list" },
  { slug: "marshrut", icon: MapPin, title: "Marshrut", desc: "Agent yo'nalishi" },
  { slug: "kalendar", icon: Calendar, title: "Kalendar", desc: "Visit kalendari" },
]

export default function KomandaPage() {
  const { isAuthenticated } = useAuth()
  const { data: agentResp, loading: agentLoading } = useApi<AgentResp>(isAuthenticated ? "/api/v1/hisobot/agent" : null)
  const { data: ekspResp, loading: ekspLoading } = useApi<EkspeditorResp>(isAuthenticated ? "/api/v1/ekspeditorlar" : null)

  const agents: AgentRow[] = Array.isArray(agentResp) ? agentResp : (agentResp?.agentlar ?? [])
  const ekspeditors = ekspResp?.items ?? []

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Komanda</h1>
          <p className="text-base text-slate-500 mt-1">
            {agents.length} ta agent · {ekspeditors.length} ta ekspeditor
            {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Agents */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Agentlar ({agents.length})
              </h3>
              {agentLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {agents.length === 0 && !agentLoading && (
              <p className="text-sm text-slate-500 text-center py-6">Agent ma'lumoti yo'q</p>
            )}
            <div className="space-y-2">
              {agents.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{a.agent_ismi || `Agent #${a.agent_id ?? i + 1}`}</div>
                    <div className="text-xs text-slate-500">
                      {a.vizitlar_soni ?? 0} vizit · {a.buyurtmalar_soni ?? 0} zakaz
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(Number(a.jami_sotuv ?? 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Ekspeditors */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Ekspeditorlar ({ekspeditors.length})
              </h3>
              {ekspLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {ekspeditors.length === 0 && !ekspLoading && (
              <p className="text-sm text-slate-500 text-center py-6">Ekspeditor yo'q. Sozlamalardan qo'shing.</p>
            )}
            <div className="space-y-2">
              {ekspeditors.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{e.ism}</div>
                    {e.telefon && <div className="text-xs text-slate-500">{e.telefon}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${e.faol !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {e.faol !== false ? "Faol" : "Pas"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Boshqaruv</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <Link key={s.slug} href={`/komanda/${s.slug}`}>
                  <Card className="p-4 hover:shadow-md transition-all cursor-pointer h-full">
                    <Icon className="w-7 h-7 mb-2 text-slate-600" />
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="text-xs text-slate-500">{s.desc}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
