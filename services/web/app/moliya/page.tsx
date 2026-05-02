"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, AlertCircle } from "lucide-react"
import { useApi, useAuth } from "@/hooks/use-api"

type KassaStats = {
  naqd_balans?: number
  bank_balans?: number
  jami_balans?: number
}

export default function MoliyaPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiKassa, loading } = useApi<KassaStats>(
    isAuthenticated ? "/api/v1/kassa/stats" : null
  )
  const usingMock = !apiKassa

  const balance = apiKassa ? {
    cash_total: apiKassa.naqd_balans ?? 0,
    bank_total: apiKassa.bank_balans ?? 0,
    usd_total: 0,
    transfers: 0,
    overall: apiKassa.jami_balans ?? 0,
    overall_with_prepay: apiKassa.jami_balans ?? 0,
    overall_full: apiKassa.jami_balans ?? 0,
  } : {
    cash_total: -4_806_407_358,
    bank_total: 2_883_346_590,
    usd_total: 0,
    transfers: 1_169_063_028,
    overall: -753_997_739,
    overall_with_prepay: -758_248_485,
    overall_full: -8_952_572_263,
  }

  const topCategories = [
    { name: "PRIMA GREEN", sum: 32_521_000, pct: 32.52, growth: 12.3 },
    { name: "TRUFFLES COCOA", sum: 13_682_000, pct: 13.68, growth: -2.1 },
    { name: "HILOL", sum: 9_834_000, pct: 9.83, growth: 5.6 },
    { name: "SLADUS", sum: 8_300_000, pct: 8.30, growth: 8.2 },
    { name: "Муроджон шок.", sum: 7_810_000, pct: 7.81, growth: 4.5 },
    { name: "ЁШ ФУТБОЛЧИ", sum: 7_530_000, pct: 7.53, growth: 11.0 },
  ]

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Moliya <span className="italic text-[#C75D3C]">jurnali</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Joriy oy: <span className="font-medium text-[#1A1A1A] tabular-nums">155,170,315</span> so'm sotuv
              </p>
            </div>
            <div className="flex items-center gap-2">
              {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
              {!loading && apiKassa && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real-time</span>}
              {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">May 2026 ▼</Button>
            </div>
          </div>

          {/* Balance row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <BalanceCard label="Naqd pul" value={balance.cash_total} icon={Wallet} accent={balance.cash_total < 0 ? "#C75D3C" : "#10B981"} />
            <BalanceCard label="Безналик (Bank)" value={balance.bank_total} icon={Wallet} accent="#10B981" />
            <BalanceCard label="USD" value={balance.usd_total} icon={Wallet} accent="#9C8A6E" dollar />
            <BalanceCard label="Перечисления" value={balance.transfers} icon={ArrowUpRight} accent="#3B82F6" />
          </div>

          {/* Critical balance alert */}
          <Card className="bg-white border-2 border-[#C75D3C]/30 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#C75D3C]" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.15em] text-[#9C8A6E] font-medium mb-1">Umumiy balans</div>
                <h3 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Postavshiklarga umumiy qarz holati</h3>
                <div className="grid grid-cols-3 gap-6 mt-5">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Joriy balans</div>
                    <div className="text-3xl font-medium tabular-nums mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif', color: balance.overall < 0 ? "#C75D3C" : "#10B981" }}>
                      {balance.overall.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9C8A6E] mt-1">so'm</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Predoplata bilan</div>
                    <div className="text-2xl font-medium tabular-nums mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif', color: balance.overall_with_prepay < 0 ? "#C75D3C" : "#10B981" }}>
                      {balance.overall_with_prepay.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9C8A6E] mt-1">so'm</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">To'liq balans</div>
                    <div className="text-2xl font-medium tabular-nums mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif', color: balance.overall_full < 0 ? "#C75D3C" : "#10B981" }}>
                      {balance.overall_full.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9C8A6E] mt-1">so'm</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Categories */}
            <Card className="lg:col-span-2 p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium">JORIY OY</div>
                  <h3 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Kategoriya bo'yicha sotuv</h3>
                </div>
              </div>
              <div className="space-y-4">
                {topCategories.map(c => (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1A1A1A]">{c.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          c.growth > 0 ? "bg-emerald-50 text-emerald-700" : "bg-[#F5E5D6] text-[#C75D3C]"
                        }`}>
                          {c.growth > 0 ? "↑" : "↓"} {Math.abs(c.growth)}%
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{c.sum.toLocaleString()}</div>
                        <div className="text-xs text-[#9C8A6E]">{c.pct}%</div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0EAE0] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.pct * 2}%`, background: "linear-gradient(90deg, #C75D3C 0%, #E27B5C 100%)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick metrics */}
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">PROGNOZ</div>
              <h3 className="text-xl font-light text-[#1A1A1A] mb-5" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Joriy oy</h3>
              <div className="space-y-3">
                <Metric label="Bugungi sotuv" value="22,068,830" unit="so'm" trend="+12.3%" up />
                <Metric label="Haftalik" value="156.5M" unit="so'm" trend="+5.4%" up />
                <Metric label="Oy boshidan" value="155.1M" unit="so'm" trend="+18.2%" up />
                <Metric label="Yillik prognoz" value="1.8B" unit="so'm" trend="+22.5%" up />
                <div className="pt-3 border-t border-[#F0EAE0]">
                  <Metric label="Tushum" value="2.05B" unit="so'm" trend="↗" up />
                  <Metric label="Xarajat" value="-895M" unit="so'm" trend="↘" />
                  <div className="mt-3 pt-3 border-t border-[#F0EAE0]">
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Sof foyda</div>
                    <div className="text-3xl font-medium text-emerald-700 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>+1.16B</div>
                    <div className="text-xs text-[#9C8A6E]">so'm</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function BalanceCard({ label, value, icon: Icon, accent, dollar }: {
  label: string; value: number; icon: React.ElementType; accent: string; dollar?: boolean
}) {
  return (
    <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
      <Icon className="w-6 h-6 mb-3" style={{ color: accent }} />
      <div className="text-2xl font-medium tabular-nums leading-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
        {dollar ? "$" : ""}{value.toLocaleString()}
      </div>
      <div className="text-sm text-[#6B5B4D] mt-1">{label}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}

function Metric({ label, value, unit, trend, up }: { label: string; value: string; unit: string; trend: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <div className="text-xs text-[#9C8A6E]">{label}</div>
        <div className="text-base font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
          {value} <span className="text-xs font-normal text-[#9C8A6E]">{unit}</span>
        </div>
      </div>
      <div className={`text-sm font-medium flex items-center gap-1 ${up ? "text-emerald-600" : "text-[#C75D3C]"}`}>
        {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {trend}
      </div>
    </div>
  )
}
