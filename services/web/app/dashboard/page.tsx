"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { TrendingUp, Users, Package, AlertTriangle, ShoppingBag, FileText, DollarSign, Eye, AlertCircle, Sparkles, ArrowUpRight, Zap, Crown } from "lucide-react"
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
    { name: "PRIMA GREEN", pct: 32.52 },
    { name: "TRUFFLES COCOA", pct: 13.68 },
    { name: "HILOL", pct: 9.83 },
    { name: "SLADUS", pct: 8.30 },
    { name: "Muroj. shokolad", pct: 7.81 },
    { name: "ЁШ ФУТБОЛЧИ", pct: 7.53 },
    { name: "ERFIBLESS", pct: 5.82 },
    { name: "LINDO", pct: 4.76 },
    { name: "ARIEL", pct: 1.76 },
    { name: "COLGATE", pct: 1.28 },
  ]

  const agentKpis = [
    { name: "Babadjanova Nargiza", visits: 261, done: 0, refused: 18, no_show: 243 },
    { name: "Berdiyev Rahmatillo", visits: 172, done: 0, refused: 12, no_show: 160 },
    { name: "BORIEV MIRJALOL", visits: 282, done: 0, refused: 0, no_show: 282 },
    { name: "Sayitqulov Mashrab", visits: 127, done: 0, refused: 0, no_show: 127 },
    { name: "ДАВЛАТ", visits: 186, done: 0, refused: 8, no_show: 178 },
    { name: "Турсунов Жамшид", visits: 14, done: 0, refused: 0, no_show: 14 },
  ]

  const aiInsights = [
    { type: "alert", text: "Bonjur 50g muddati 2 kunda tugaydi (216k riskda)", action: "Aktsiya" },
    { type: "opportunity", text: "Salom Magazin №1 — premium taklif (yutgan +25%)", action: "Tayyorla" },
    { type: "tip", text: "BORIEV M. eng samarali soat 14:00-16:00", action: "Optimallash" },
  ]

  return (
    <AdminLayout>
      {/* Anthropic-style warm cream background overlay */}
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1500px] mx-auto space-y-8">

          {/* Hero Header — Anthropic-style with serif */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">
                BIZNES PANELI · 02 MAY 2026
              </div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Xush kelibsiz, <span className="italic text-[#C75D3C]">Mashrab</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Bugungi savdo natijalari, AI tavsiyalar va komandadagi holat. Bir nigohda hammasi.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {loading && (
                <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] font-medium">
                  Yuklanmoqda...
                </div>
              )}
              {!loading && apiStats && (
                <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#1A1A1A] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  Real-time API
                </div>
              )}
              {!loading && usingMock && (
                <div className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Demo data
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-[#FCE9DD] border border-[#E5BFA0] rounded-xl text-sm text-[#9C4019] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>API xato: {error}. Demo ma'lumotlar ko'rsatilmoqda.</span>
            </div>
          )}

          {/* KPI cards — Anthropic clean style */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-4">
              Bugungi sotuv
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <PremiumKpi
                label="Bugungi sotuv"
                value={formatCurrency(stats.today_sum ?? 0)}
                subtext={`${stats.today_count ?? 0} ta zakaz`}
                trend="+12.3%"
                accent="positive"
              />
              <PremiumKpi
                label="Muddati o'tgan qarz"
                value={formatNumber(stats.overdue_amount ?? 0) + " so'm"}
                subtext={`${stats.overdue_count ?? 0} ta klient`}
                accent="negative"
              />
              <PremiumKpi
                label="Bugungi vizit"
                value={`${stats.visits_done ?? 0}/${stats.visits_total ?? 0}`}
                subtext={`${stats.visits_refused ?? 0} otkazilgan`}
                accent="neutral"
              />
              <PremiumKpi
                label="Foto hisobotlar"
                value={`${stats.photo_pct ?? 0}%`}
                subtext="Bugun yuborilgan"
                accent="neutral"
              />
            </div>
          </div>

          {/* AI Insights — premium hero card */}
          <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #C75D3C 0%, #E27B5C 100%)" }}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">AI INSIGHTS</div>
                <h3 className="text-xl font-medium text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  Bugungi 3 ta muhim holat
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D3]">
                  <div className={`w-2 h-2 rounded-full ${
                    insight.type === "alert" ? "bg-[#C75D3C]" :
                    insight.type === "opportunity" ? "bg-emerald-600" :
                    "bg-blue-600"
                  }`} />
                  <span className="flex-1 text-sm text-[#1A1A1A]">{insight.text}</span>
                  <button className="text-xs px-3 py-1.5 rounded-md bg-white border border-[#E8E0D3] text-[#1A1A1A] hover:border-[#C75D3C] hover:text-[#C75D3C] transition-colors font-medium">
                    {insight.action}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Two columns — Top products & Agent KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">BREND BO'YICHA</div>
                  <h3 className="text-xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    Bugungi sotuv
                  </h3>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#9C8A6E]" />
              </div>
              <div className="space-y-3.5">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1A1A1A]">{i + 1}. {p.name}</span>
                      <span className="font-semibold tabular-nums text-[#C75D3C]">{p.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F5F1EB] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, p.pct * 2.5)}%`, background: "linear-gradient(90deg, #C75D3C 0%, #E27B5C 100%)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">AGENTLAR</div>
                  <h3 className="text-xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    Vizit holati
                  </h3>
                </div>
                <span className="text-xs text-[#6B5B4D]">{stats.visits_total ?? 0} reja / {stats.visits_done ?? 0} bajarildi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E0D3]">
                      <th className="text-left py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Agent</th>
                      <th className="text-right py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Reja</th>
                      <th className="text-right py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Bajardi</th>
                      <th className="text-right py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Otkaz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentKpis.map((a) => (
                      <tr key={a.name} className="border-b border-[#F0EAE0]">
                        <td className="py-3 font-medium text-[#1A1A1A]">{a.name}</td>
                        <td className="text-right tabular-nums text-[#1A1A1A]">{a.visits}</td>
                        <td className="text-right tabular-nums">
                          <span className={a.done === 0 ? "text-[#C75D3C]" : "text-emerald-700 font-semibold"}>
                            {a.done}
                          </span>
                        </td>
                        <td className="text-right tabular-nums text-[#9C8A6E]">{a.refused}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#FAF7F2] font-semibold">
                      <td className="py-3 text-[#1A1A1A]">Jami</td>
                      <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.visits, 0)}</td>
                      <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.done, 0)}</td>
                      <td className="text-right tabular-nums">{agentKpis.reduce((s, a) => s + a.refused, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-4">
              Tez harakatlar
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <PremiumAction icon={ShoppingBag} label="Yangi zakaz" href="/sotuv/yangi" />
              <PremiumAction icon={Users} label="Yangi klient" href="/klientlar/yangi" />
              <PremiumAction icon={Package} label="Yangi tovar" href="/sklad/yangi" />
              <PremiumAction icon={Sparkles} label="AI Copilot" href="/ai/copilot" highlight />
            </div>
          </div>

          {/* Footer signature */}
          <div className="text-center pt-8 pb-4 text-xs text-[#9C8A6E] border-t border-[#E8E0D3]">
            SavdoAI Premium · Anthropic Design System · {new Date().toLocaleDateString("uz-UZ")}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function PremiumKpi({
  label, value, subtext, trend, accent,
}: {
  label: string; value: string; subtext?: string;
  trend?: string;
  accent: 'positive' | 'negative' | 'neutral';
}) {
  const accentColors = {
    positive: { bar: "#10B981", trend: "text-emerald-700 bg-emerald-50" },
    negative: { bar: "#C75D3C", trend: "text-[#C75D3C] bg-[#F5E5D6]" },
    neutral: { bar: "#9C8A6E", trend: "text-[#6B5B4D] bg-[#F5F1EB]" },
  }
  const c = accentColors[accent]
  return (
    <Card className="relative overflow-hidden bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-[0.15em] text-[#9C8A6E] font-medium">{label}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${c.trend}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-medium tabular-nums text-[#1A1A1A] leading-tight" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
        {value}
      </div>
      {subtext && <div className="text-xs text-[#6B5B4D] mt-1.5">{subtext}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: c.bar }} />
    </Card>
  )
}

function PremiumAction({ icon: Icon, label, href, highlight }: { icon: React.ElementType; label: string; href: string; highlight?: boolean }) {
  return (
    <a href={href} className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${highlight ? "border-[#C75D3C] bg-gradient-to-br from-[#FCE9DD] to-white" : "border-[#E8E0D3] bg-white hover:border-[#C75D3C]"}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${highlight ? "bg-[#C75D3C] text-white" : "bg-[#F5F1EB] text-[#6B5B4D] group-hover:bg-[#C75D3C] group-hover:text-white"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium text-[#1A1A1A]">{label}</span>
    </a>
  )
}
