"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ShoppingBag, TrendingUp, Eye, Camera, AlertCircle } from "lucide-react"
import { useApi, useAuth } from "@/hooks/use-api"

type SotuvStats = {
  today_sum?: number
  today_count?: number
  visits_total?: number
  visits_done?: number
  brands?: { name: string; pct: number }[]
  agents?: { name: string; visits_plan: number; visits: number; refused: number; sum: number; orders: number }[]
}

const BRAND_DATA = [
  { name: "PRIMA GREEN", pct: 32.52, color: "from-emerald-400 to-emerald-600" },
  { name: "TRUFFLES COCOA", pct: 13.68, color: "from-amber-400 to-orange-600" },
  { name: "HILOL", pct: 9.83, color: "from-rose-400 to-rose-600" },
  { name: "SLADUS", pct: 8.30, color: "from-blue-400 to-blue-600" },
  { name: "Муроджон шок.", pct: 7.81, color: "from-purple-400 to-purple-600" },
  { name: "ЁШ ФУТБОЛЧИ", pct: 7.53, color: "from-indigo-400 to-indigo-600" },
  { name: "ERFIBLESS", pct: 5.82, color: "from-cyan-400 to-cyan-600" },
  { name: "LINDO", pct: 4.76, color: "from-pink-400 to-pink-600" },
]

const AGENT_KPI = [
  { name: "Babadjanova Nargiza", visits_plan: 261, visits: 0, refused: 18, sum: 0, orders: 0 },
  { name: "Berdiyev Rahmatillo", visits_plan: 172, visits: 0, refused: 12, sum: 0, orders: 0 },
  { name: "BORIEV MIRJALOL", visits_plan: 282, visits: 0, refused: 0, sum: 0, orders: 0 },
  { name: "Sayitqulov Mashrab", visits_plan: 127, visits: 0, refused: 0, sum: 0, orders: 0 },
  { name: "ДАВЛАТ", visits_plan: 186, visits: 0, refused: 8, sum: 0, orders: 0 },
  { name: "Турсунов Жамшид", visits_plan: 14, visits: 0, refused: 0, sum: 0, orders: 0 },
]

export default function SotuvPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiStats, loading } = useApi<SotuvStats>(
    isAuthenticated ? "/api/v1/dashboard/summary" : null
  )
  const usingMock = !apiStats
  const brands = apiStats?.brands?.length ? apiStats.brands.map((b, i) => ({ ...b, color: BRAND_DATA[i % BRAND_DATA.length].color })) : BRAND_DATA
  const agents = apiStats?.agents?.length ? apiStats.agents : AGENT_KPI

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sotuv</h1>
            <p className="text-base text-slate-500 mt-1">
              Bugungi: {(apiStats?.today_sum ?? 22068830).toLocaleString("ru-RU")} so'm · {apiStats?.today_count ?? 51} zakaz
            </p>
          </div>
          <div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
            {!loading && apiStats && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real-time API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo data — login kerak</span>}
          </div>
        </div>

        {/* Big KPI cards 4 colored */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BigKpi color="blue" icon={Eye} label="Visit (plan)" value="4.9%" subtext="51 / 1042" />
          <BigKpi color="amber" icon={ShoppingBag} label="Successful visit" value="39.2%" subtext="51 visit, 20 zakaz" />
          <BigKpi color="indigo" icon={Eye} label="GPS visit" value="58.8%" subtext="51 visit, 30 GPS" />
          <BigKpi color="rose" icon={Camera} label="Foto report" value="0.0%" subtext="51 visit, 0 foto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut chart placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-1">Brendlar bo'yicha</h3>
            <p className="text-sm text-slate-500 mb-4">Bugungi sotuvdan ulush</p>
            <div className="relative w-48 h-48 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {BRAND_DATA.map((b, i) => {
                  const start = BRAND_DATA.slice(0, i).reduce((s, b) => s + b.pct, 0)
                  const radius = 35
                  const circumference = 2 * Math.PI * radius
                  const dashOffset = circumference - (b.pct / 100) * circumference
                  const colors = ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#a855f7', '#6366f1', '#06b6d4', '#ec4899']
                  return (
                    <circle
                      key={b.name}
                      cx="50" cy="50" r={radius}
                      fill="transparent"
                      stroke={colors[i % colors.length]}
                      strokeWidth="14"
                      strokeDasharray={`${(b.pct / 100) * circumference} ${circumference}`}
                      strokeDashoffset={-((start / 100) * circumference)}
                      transform={`rotate(0 50 50)`}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-2xl font-bold">22.07M</div>
                <div className="text-xs text-slate-500">so'm bugun</div>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {BRAND_DATA.map((b, i) => {
                const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500']
                return (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                      <span className="font-medium">{b.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{b.pct}%</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Agent KPI table 2 wide */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">Agentlar bo'yicha bugungi natija</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 font-semibold text-slate-700">Agent</th>
                    <th className="text-right py-2 font-semibold text-slate-700">Reja</th>
                    <th className="text-right py-2 font-semibold text-slate-700">Bajardi</th>
                    <th className="text-right py-2 font-semibold text-slate-700">Otkaz</th>
                    <th className="text-right py-2 font-semibold text-slate-700">Zakaz</th>
                    <th className="text-right py-2 font-semibold text-slate-700">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {AGENT_KPI.map(a => (
                    <tr key={a.name} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium">{a.name}</td>
                      <td className="text-right tabular-nums">{a.visits_plan}</td>
                      <td className={`text-right tabular-nums font-semibold ${a.visits === 0 ? "text-rose-600" : "text-emerald-600"}`}>{a.visits}</td>
                      <td className="text-right tabular-nums text-amber-600">{a.refused}</td>
                      <td className="text-right tabular-nums">{a.orders}</td>
                      <td className="text-right tabular-nums">{a.sum.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2.5">Jami</td>
                    <td className="text-right tabular-nums">{AGENT_KPI.reduce((s, a) => s + a.visits_plan, 0)}</td>
                    <td className="text-right tabular-nums">0</td>
                    <td className="text-right tabular-nums">{AGENT_KPI.reduce((s, a) => s + a.refused, 0)}</td>
                    <td className="text-right tabular-nums">0</td>
                    <td className="text-right tabular-nums">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function BigKpi({ color, icon: Icon, label, value, subtext }: {
  color: 'blue'|'amber'|'indigo'|'rose'; icon: React.ElementType; label: string; value: string; subtext: string
}) {
  const colors = {
    blue: "from-blue-500 to-blue-700",
    amber: "from-amber-500 to-orange-600",
    indigo: "from-indigo-500 to-violet-600",
    rose: "from-rose-500 to-pink-600",
  }
  return (
    <Card className={`bg-gradient-to-br ${colors[color]} text-white border-0 p-5 relative overflow-hidden`}>
      <Icon className="absolute right-4 top-4 w-12 h-12 opacity-20" />
      <div className="text-sm opacity-90 mb-2">{label}</div>
      <div className="text-5xl font-bold tabular-nums leading-none">{value}</div>
      <div className="text-sm opacity-80 mt-2">{subtext}</div>
    </Card>
  )
}
