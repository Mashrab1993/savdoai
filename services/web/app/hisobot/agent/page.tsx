"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type AgentRow = {
  agent_id?: number
  agent_ismi?: string
  vizitlar_soni?: number
  buyurtmalar_soni?: number
  jami_sotuv?: number
  jami_summa?: number
  yetkazilgan_summa?: number
  sotuv_soni?: number
  klient_soni?: number
}

type Resp = { agentlar?: AgentRow[]; jami?: { vizitlar?: number; buyurtmalar?: number; sotuv?: number } } | AgentRow[]

export default function HisobotAgentPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<Resp>(isAuthenticated ? "/api/v1/hisobot/agent" : null)

  const agents: AgentRow[] = Array.isArray(data) ? data : (data?.agentlar ?? [])
  const summary = !Array.isArray(data) ? data?.jami : null

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agentlar bo'yicha</h1>
            <p className="text-base text-slate-500 mt-1">
              Har agent KPI: vizitlar, buyurtmalar, sotuv summasi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5 border-blue-200 bg-blue-50/50">
              <div className="text-xs uppercase font-semibold text-blue-700">Jami vizitlar</div>
              <div className="text-3xl font-bold tabular-nums text-blue-800">{summary.vizitlar ?? 0}</div>
            </Card>
            <Card className="p-5 border-emerald-200 bg-emerald-50/50">
              <div className="text-xs uppercase font-semibold text-emerald-700">Buyurtmalar</div>
              <div className="text-3xl font-bold tabular-nums text-emerald-800">{summary.buyurtmalar ?? 0}</div>
            </Card>
            <Card className="p-5 border-amber-200 bg-amber-50/50">
              <div className="text-xs uppercase font-semibold text-amber-700">Sotuv summasi</div>
              <div className="text-3xl font-bold tabular-nums text-amber-800">{formatCurrency(summary.sotuv ?? 0)}</div>
            </Card>
          </div>
        )}

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && agents.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha agentlar faolligi yo'q. Kuni bo'yi sotuv qilingach paydo bo'ladi.
          </Card>
        )}

        {agents.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Agent</th>
                    <th className="px-4 py-3 text-right font-semibold">Vizitlar</th>
                    <th className="px-4 py-3 text-right font-semibold">Klientlar</th>
                    <th className="px-4 py-3 text-right font-semibold">Buyurtmalar</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami summa</th>
                    <th className="px-4 py-3 text-right font-semibold">Yetkazilgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agents.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        {a.agent_ismi || `Agent #${a.agent_id ?? i + 1}`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.vizitlar_soni ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.klient_soni ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{a.buyurtmalar_soni ?? a.sotuv_soni ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                        {formatCurrency(Number(a.jami_sotuv ?? a.jami_summa ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {a.yetkazilgan_summa != null ? formatCurrency(Number(a.yetkazilgan_summa)) : "—"}
                      </td>
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
