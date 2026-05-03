"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ShoppingBag, TrendingUp, Users, Box } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type DashboardStats = {
  today_sum?: number
  today_count?: number
}
type FoydaResp = {
  tushum: number
  yalpi_foyda: number
  sof_foyda: number
  margin_foiz: number
  sotuv_soni?: number
}
type SavdoResp = { total: number; items: Array<{ id: number; sana: string; klient_ismi?: string; jami: number; holat?: string }> }

export default function SotuvDashboardPage() {
  const { isAuthenticated } = useAuth()
  const { data: today } = useApi<DashboardStats>(isAuthenticated ? "/api/v1/dashboard/summary" : null)
  const { data: foyda } = useApi<FoydaResp>(isAuthenticated ? "/api/v1/hisobot/foyda?kunlar=30" : null)
  const { data: recent } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=10" : null)

  const last10 = recent?.items ?? []

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sotuv dashboard</h1>
            <p className="text-base text-slate-500 mt-1">
              Bugungi va 30-kunlik sotuv ko'rsatkichlari
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Bugungi sotuv" value={formatCurrency(today?.today_sum || 0)} sub={`${today?.today_count || 0} ta zakaz`} icon={ShoppingBag} accent="emerald" />
          <KpiCard label="30-kun tushum" value={formatCurrency(foyda?.tushum || 0)} sub={`${foyda?.sotuv_soni || 0} ta sotuv`} icon={TrendingUp} accent="blue" />
          <KpiCard label="Yalpi foyda" value={formatCurrency(foyda?.yalpi_foyda || 0)} sub="30 kun" icon={TrendingUp} accent="amber" />
          <KpiCard label="Sof foyda" value={formatCurrency(foyda?.sof_foyda || 0)} sub={`Marja: ${foyda?.margin_foiz || 0}%`} icon={TrendingUp} accent={foyda && foyda.sof_foyda >= 0 ? "emerald" : "rose"} />
        </div>

        <Card>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Oxirgi 10 sotuv</h3>
            <Link href="/zakazlar" className="text-sm text-emerald-700 hover:underline">Hammasi →</Link>
          </div>
          {last10.length === 0 ? (
            <p className="p-6 text-center text-slate-500">Hozircha sotuv yo'q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">№</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {last10.map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">
                        {new Date(s.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-2 font-medium">{s.klient_ismi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(Number(s.jami))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent: "emerald" | "blue" | "amber" | "rose"
}) {
  const colors = {
    emerald: "border-emerald-200 text-emerald-700",
    blue: "border-blue-200 text-blue-700",
    amber: "border-amber-200 text-amber-700",
    rose: "border-rose-200 text-rose-700",
  }
  return (
    <Card className={`p-4 border-2 ${colors[accent]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase font-semibold text-slate-500">{label}</span>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </Card>
  )
}
