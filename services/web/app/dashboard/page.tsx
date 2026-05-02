"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { TrendingUp, Users, Package, AlertTriangle, ShoppingBag, FileText, DollarSign, Eye, AlertCircle } from "lucide-react"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { useApi, useAuth } from "@/hooks/use-api"

type DashboardStats = {
  today_sum?: number
  today_count?: number
  overdue_amount?: number
  overdue_count?: number
  visits_total?: number
  visits_done?: number
  visits_refused?: number
  photo_pct?: number
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiStats, loading, error } = useApi<DashboardStats>(
    isAuthenticated ? "/api/v1/dashboard/summary" : null
  )

  const mockStats = {
    today_sum: 22068830,
    today_count: 51,
    overdue_amount: -758248486,
    overdue_count: 23,
    visits_total: 1042,
    visits_done: 0,
    visits_refused: 38,
    photo_pct: 0,
  }

  const stats = apiStats || mockStats
  const usingMock = !apiStats

  const topProducts = [
    { name: "PRIMA GREEN", pct: 32.52, color: "bg-emerald-500" },
    { name: "TRUFFLES COCOA", pct: 13.68, color: "bg-amber-500" },
    { name: "HILOL", pct: 9.83, color: "bg-rose-500" },
    { name: "SLADUS", pct: 8.30, color: "bg-blue-500" },
    { name: "Muroj. shokolad", pct: 7.81, color: "bg-purple-500" },
    { name: "ЁШ ФУТБОЛЧИ", pct: 7.53, color: "bg-orange-500" },
    { name: "ERFIBLESS", pct: 5.82, color: "bg-cyan-500" },
    { name: "LINDO", pct: 4.76, color: "bg-pink-500" },
    { name: "ARIEL", pct: 1.76, color: "bg-indigo-500" },
    { name: "COLGATE", pct: 1.28, color: "bg-teal-500" },
  ]

  const agentKpis = [
    { name: "Babadjanova Nargiza", visits: 261, done: 0, refused: 18, no_show: 243 },
    { name: "Berdiyev Rahmatillo", visits: 172, done: 0, refused: 12, no_show: 160 },
    { name: "BORIEV MIRJALOL", visits: 282, done: 0, refused: 0, no_show: 282 },
    { name: "Sayitqulov Mashrab", visits: 127, done: 0, refused: 0, no_show: 127 },
    { name: "ДАВЛАТ", visits: 186, done: 0, refused: 8, no_show: 178 },
    { name: "Турсунов Жамшид", visits: 14, done: 0, refused: 0, no_show: 14 },
  ]

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boshqaruv paneli</h1>
            <p className="text-base text-slate-500 mt-1">Bugungi holat — 2 may, 2026</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {loading && (
              <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium animate-pulse">
                Yuklanmoqda...
              </div>
            )}
            {!loading && apiStats && (
              <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                ● Real-time API
              </div>
            )}
            {!loading && usingMock && (
              <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Demo data — login kerak
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>API xato: {error}. Demo ma'lumotlar ko'rsatilmoqda.</span>
          </div>
        )}

        {/* KPI cards row 1 — Sotuv */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Bugungi sotuv</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Bugungi sotuv"
              value={formatCurrency(stats.today_sum ?? 0)}
              subtext={`${stats.today_count ?? 0} ta zakaz`}
              icon={ShoppingBag}
              color="emerald"
              trend="+12.3%"
            />
            <KpiCard
              label="Muddati o'tgan qarz"
              value={formatNumber(stats.overdue_amount ?? 0) + " so'm"}
              subtext={`${stats.overdue_count ?? 0} ta klient`}
              icon={AlertTriangle}
              color="rose"
              alert
            />
            <KpiCard
              label="Bugungi visit"
              value={`${stats.visits_done ?? 0}/${stats.visits_total ?? 0}`}
              subtext={`${stats.visits_refused ?? 0} otkazilgan`}
              icon={Eye}
              color="amber"
            />
            <KpiCard
              label="Foto hisobotlar"
              value={`${stats.photo_pct ?? 0}%`}
              subtext="Bugun yuborilgan"
              icon={FileText}
              color="blue"
            />
          </div>
        </div>

        {/* Two columns — Top products & Agent KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top products */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Brendlar bo'yicha sotuv</h3>
              <span className="text-sm text-slate-500">Bugun</span>
            </div>
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="font-semibold tabular-nums">{p.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${p.color} rounded-full transition-all`}
                      style={{ width: `${p.pct * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Agent KPI table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Agentlar — Visit holati</h3>
              <span className="text-sm text-slate-500">{stats.visits_total ?? 0} reja / {stats.visits_done ?? 0} bajarildi</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-medium text-slate-600">Agent</th>
                    <th className="text-right py-2 font-medium text-slate-600">Reja</th>
                    <th className="text-right py-2 font-medium text-slate-600">Bajardi</th>
                    <th className="text-right py-2 font-medium text-slate-600">Otkazgan</th>
                    <th className="text-right py-2 font-medium text-slate-600">Bormagan</th>
                  </tr>
                </thead>
                <tbody>
                  {agentKpis.map((a) => (
                    <tr key={a.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-900">{a.name}</td>
                      <td className="text-right tabular-nums">{a.visits}</td>
                      <td className="text-right tabular-nums">
                        <span className={a.done === 0 ? "text-rose-600" : "text-emerald-600 font-semibold"}>
                          {a.done}
                        </span>
                      </td>
                      <td className="text-right tabular-nums text-amber-600">{a.refused}</td>
                      <td className="text-right tabular-nums text-slate-500">{a.no_show}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="py-2.5">Jami</td>
                    <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.visits, 0)}</td>
                    <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.done, 0)}</td>
                    <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.refused, 0)}</td>
                    <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.no_show, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tez harakatlar</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction icon={ShoppingBag} label="Yangi zakaz" href="/zakazlar/yangi" />
            <QuickAction icon={Users} label="Yangi klient" href="/klientlar/yangi" />
            <QuickAction icon={Package} label="Yangi tovar" href="/sklad/tovar/yangi" />
            <QuickAction icon={DollarSign} label="Xarajat qo'shish" href="/kassa/xarajat/yangi" />
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

function KpiCard({
  label, value, subtext, icon: Icon, color, alert, trend,
}: {
  label: string; value: string; subtext?: string;
  icon: React.ElementType; color: 'emerald'|'rose'|'amber'|'blue';
  alert?: boolean; trend?: string;
}) {
  const colors = {
    emerald: "from-emerald-500 to-teal-600 text-emerald-50",
    rose: "from-rose-500 to-rose-700 text-rose-50",
    amber: "from-amber-500 to-orange-600 text-amber-50",
    blue: "from-blue-500 to-indigo-600 text-blue-50",
  }
  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border-0 p-5`}>
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-7 h-7 opacity-80" />
        {trend && <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-md">{trend}</span>}
        {alert && <AlertTriangle className="w-5 h-5 animate-pulse" />}
      </div>
      <div className="text-3xl font-bold mb-1 tabular-nums leading-tight">{value}</div>
      <div className="text-sm opacity-90 mb-1">{label}</div>
      {subtext && <div className="text-xs opacity-75">{subtext}</div>}
    </Card>
  )
}

function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-emerald-100 transition-colors">
        <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-700" />
      </div>
      <span className="font-medium text-slate-700 group-hover:text-emerald-700">{label}</span>
    </a>
  )
}
