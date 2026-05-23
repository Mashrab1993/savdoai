"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Users, Package, AlertTriangle, ShoppingBag, AlertCircle, Sparkles, ArrowUpRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useApi, useAuth } from "@/hooks/use-api"
import { WelcomeBanner } from "@/components/shared/welcome-banner"
import { Suspense } from "react"

type Me = { id: number; ism?: string; to_liq_ism?: string; dokon_nomi?: string; username?: string }

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

type TopTovar = { nomi: string; jami_sotildi?: number; sotuv_summa?: number }
type AgentRow = { agent_ismi: string; vizitlar_soni?: number; buyurtmalar_soni?: number; jami_sotuv?: number }
type AgentResp = { agentlar?: AgentRow[]; jami?: { vizitlar?: number; buyurtmalar?: number; sotuv?: number } }

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const { data: me } = useApi<Me>(isAuthenticated ? "/api/v1/me" : null)
  const { data: stats, loading } = useApi<DashboardStats>(isAuthenticated ? "/api/v1/dashboard/summary" : null)
  const { data: topResp } = useApi<{ items?: TopTovar[] } | TopTovar[]>(isAuthenticated ? "/api/v1/hisobot/top-tovarlar?limit=8" : null)
  const { data: agentResp } = useApi<AgentResp>(isAuthenticated ? "/api/v1/hisobot/van-selling-kunlik" : null)

  const ism = me?.to_liq_ism || me?.ism || me?.dokon_nomi || me?.username || "Foydalanuvchi"
  const today = new Date().toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })

  const topProducts: TopTovar[] = Array.isArray(topResp)
    ? topResp
    : (topResp?.items ?? [])
  const maxSum = topProducts.reduce((m, p) => Math.max(m, Number(p.sotuv_summa ?? 0)), 0) || 1

  const agentRows: AgentRow[] = agentResp?.agentlar ?? []

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1500px] mx-auto space-y-8">

          <Suspense fallback={null}>
            <WelcomeBanner />
          </Suspense>

          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">
                BIZNES PANELI · {today.toUpperCase()}
              </div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Xush kelibsiz, <span className="italic text-[#C75D3C]">{ism}</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Bugungi savdo natijalari, AI tavsiyalar va komandadagi holat. Bir nigohda hammasi.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {!isAuthenticated && (
                <a href="/login" className="px-3 py-1.5 rounded-full bg-[#C75D3C] text-white font-medium">Kirish</a>
              )}
              {loading && (
                <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] font-medium">
                  Yuklanmoqda...
                </div>
              )}
              {!loading && isAuthenticated && stats && (
                <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#1A1A1A] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  Real-time
                </div>
              )}
            </div>
          </div>

          {!isAuthenticated && (
            <Card className="p-6 bg-white border border-[#E8E0D3] rounded-2xl text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-[#C75D3C] mb-3" />
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Tizimga kirmagansiz</h3>
              <p className="text-sm text-[#6B5B4D] mb-4">Statistikalarni ko'rish uchun login qiling.</p>
              <a href="/login" className="inline-block px-5 py-2 rounded-md bg-[#C75D3C] text-white font-medium">Login</a>
            </Card>
          )}

          {isAuthenticated && (
            <>
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-4">
                  Bugungi sotuv
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <PremiumKpi
                    label="Bugungi sotuv"
                    value={formatCurrency(stats?.today_sum ?? 0)}
                    subtext={`${stats?.today_count ?? 0} ta zakaz`}
                    accent="positive"
                  />
                  <PremiumKpi
                    label="Muddati o'tgan qarz"
                    value={formatCurrency(stats?.overdue_amount ?? 0)}
                    subtext={`${stats?.overdue_count ?? 0} ta klient`}
                    accent="negative"
                  />
                  <PremiumKpi
                    label="Bugungi vizit"
                    value={`${stats?.visits_done ?? 0}/${stats?.visits_total ?? 0}`}
                    subtext={`${stats?.visits_refused ?? 0} otkazilgan`}
                    accent="neutral"
                  />
                  <PremiumKpi
                    label="Foto hisobotlar"
                    value={`${stats?.photo_pct ?? 0}%`}
                    subtext="Bugun yuborilgan"
                    accent="neutral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">TOP MAHSULOTLAR</div>
                      <h3 className="text-xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                        Eng ko'p sotilgan
                      </h3>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[#9C8A6E]" />
                  </div>
                  {topProducts.length === 0 ? (
                    <div className="text-sm text-[#9C8A6E] py-8 text-center">
                      Hozircha sotuv yo'q. <a href="/sotuv/yangi" className="text-[#C75D3C] underline">Birinchi sotuvni qiling</a>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {topProducts.slice(0, 8).map((p, i) => {
                        const sum = Number(p.sotuv_summa ?? 0)
                        const pct = (sum / maxSum) * 100
                        return (
                          <div key={p.nomi || i} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-[#1A1A1A] truncate">{i + 1}. {p.nomi}</span>
                              <span className="font-semibold tabular-nums text-[#C75D3C]">{formatCurrency(sum)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#F5F1EB] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, pct)}%`, background: "linear-gradient(90deg, #C75D3C 0%, #E27B5C 100%)" }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>

                <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">AGENTLAR</div>
                      <h3 className="text-xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                        Bugungi faollik
                      </h3>
                    </div>
                  </div>
                  {agentRows.length === 0 ? (
                    <div className="text-sm text-[#9C8A6E] py-8 text-center">
                      Bugun hech kim sotuv qilmagan
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E8E0D3]">
                            <th className="text-left py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Agent</th>
                            <th className="text-right py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Vizit</th>
                            <th className="text-right py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Zakaz</th>
                            <th className="text-right py-2.5 font-medium text-[#9C8A6E] text-xs uppercase tracking-wider">Sotuv</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentRows.slice(0, 6).map((a) => (
                            <tr key={a.agent_ismi} className="border-b border-[#F0EAE0]">
                              <td className="py-3 font-medium text-[#1A1A1A] truncate max-w-[180px]">{a.agent_ismi}</td>
                              <td className="text-right tabular-nums text-[#1A1A1A]">{a.vizitlar_soni ?? 0}</td>
                              <td className="text-right tabular-nums text-[#1A1A1A]">{a.buyurtmalar_soni ?? 0}</td>
                              <td className="text-right tabular-nums text-[#C75D3C] font-medium">{formatCurrency(Number(a.jami_sotuv ?? 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

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

          <div className="text-center pt-8 pb-4 text-xs text-[#9C8A6E] border-t border-[#E8E0D3]">
            SavdoAI · {today}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function PremiumKpi({
  label, value, subtext, accent,
}: {
  label: string; value: string; subtext?: string;
  accent: 'positive' | 'negative' | 'neutral';
}) {
  const accentColors = {
    positive: { bar: "#10B981" },
    negative: { bar: "#C75D3C" },
    neutral: { bar: "#9C8A6E" },
  }
  const c = accentColors[accent]
  return (
    <Card className="relative overflow-hidden bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-[0.15em] text-[#9C8A6E] font-medium">{label}</span>
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
