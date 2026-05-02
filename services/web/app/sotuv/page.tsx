"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ShoppingBag, Eye, Camera, AlertCircle } from "lucide-react"
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
  { name: "PRIMA GREEN", pct: 32.52, color: "#10B981" },
  { name: "TRUFFLES COCOA", pct: 13.68, color: "#D97706" },
  { name: "HILOL", pct: 9.83, color: "#C75D3C" },
  { name: "SLADUS", pct: 8.30, color: "#3B82F6" },
  { name: "Муроджон шок.", pct: 7.81, color: "#8B5CF6" },
  { name: "ЁШ ФУТБОЛЧИ", pct: 7.53, color: "#6366F1" },
  { name: "ERFIBLESS", pct: 5.82, color: "#06B6D4" },
  { name: "LINDO", pct: 4.76, color: "#EC4899" },
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

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Sotuv <span className="italic text-[#C75D3C]">jurnali</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Bugungi: {(apiStats?.today_sum ?? 22068830).toLocaleString("ru-RU")} so'm · {apiStats?.today_count ?? 51} zakaz
              </p>
            </div>
            <div className="flex items-center gap-2">
              {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm">Yuklanmoqda...</span>}
              {!loading && apiStats && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real-time API</span>}
              {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo data</span>}
            </div>
          </div>

          {/* Big KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <BigKpi accent="#3B82F6" icon={Eye} label="Visit (plan)" value="4.9%" subtext="51 / 1042" />
            <BigKpi accent="#D97706" icon={ShoppingBag} label="Successful visit" value="39.2%" subtext="51 visit, 20 zakaz" />
            <BigKpi accent="#8B5CF6" icon={Eye} label="GPS visit" value="58.8%" subtext="51 visit, 30 GPS" />
            <BigKpi accent="#C75D3C" icon={Camera} label="Foto report" value="0.0%" subtext="51 visit, 0 foto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Donut chart */}
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">BREND BO'YICHA</div>
              <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Bugungi sotuvdan ulush
              </h3>
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {BRAND_DATA.map((b, i) => {
                    const start = BRAND_DATA.slice(0, i).reduce((s, b) => s + b.pct, 0)
                    const radius = 35
                    const circumference = 2 * Math.PI * radius
                    return (
                      <circle
                        key={b.name}
                        cx="50" cy="50" r={radius}
                        fill="transparent"
                        stroke={b.color}
                        strokeWidth="14"
                        strokeDasharray={`${(b.pct / 100) * circumference} ${circumference}`}
                        strokeDashoffset={-((start / 100) * circumference)}
                        transform={`rotate(0 50 50)`}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-3xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>22.07M</div>
                  <div className="text-xs text-[#9C8A6E]">so'm bugun</div>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {BRAND_DATA.map(b => (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                      <span className="font-medium text-[#1A1A1A]">{b.name}</span>
                    </div>
                    <span className="font-medium tabular-nums" style={{ color: b.color }}>{b.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Agent KPI table */}
            <Card className="lg:col-span-2 p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">AGENTLAR</div>
              <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Bugungi natija
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                      <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                      <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Reja</th>
                      <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bajardi</th>
                      <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Otkaz</th>
                      <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zakaz</th>
                      <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AGENT_KPI.map(a => (
                      <tr key={a.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{a.name}</td>
                        <td className="text-right tabular-nums text-[#6B5B4D]">{a.visits_plan}</td>
                        <td className={`text-right tabular-nums font-medium ${a.visits === 0 ? "text-[#C75D3C]" : "text-emerald-700"}`}>{a.visits}</td>
                        <td className="text-right tabular-nums text-[#D97706]">{a.refused}</td>
                        <td className="text-right tabular-nums text-[#1A1A1A]">{a.orders}</td>
                        <td className="text-right tabular-nums text-[#1A1A1A]">{a.sum.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#FAF7F2] font-medium">
                      <td className="py-3 px-2 text-xs uppercase tracking-wider text-[#9C8A6E]">Jami</td>
                      <td className="text-right tabular-nums text-[#1A1A1A]">{AGENT_KPI.reduce((s, a) => s + a.visits_plan, 0)}</td>
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
      </div>
    </AdminLayout>
  )
}

function BigKpi({ accent, icon: Icon, label, value, subtext }: {
  accent: string; icon: React.ElementType; label: string; value: string; subtext: string
}) {
  return (
    <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
      <Icon className="absolute right-4 top-4 w-12 h-12 opacity-10" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-5xl font-medium tabular-nums leading-none mt-3 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
        {value}
      </div>
      <div className="text-sm text-[#6B5B4D] mt-2">{subtext}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
