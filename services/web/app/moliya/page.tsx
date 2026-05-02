"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react"
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
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moliya</h1>
            <p className="text-base text-slate-500 mt-1">Joriy oy: 155,170,315 so'm sotuv</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
            {!loading && apiKassa && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real-time API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo data — login kerak</span>}
            <Button variant="outline">Davr: May 2026 ▼</Button>
          </div>
        </div>

        {/* Balance row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BalanceCard label="Naqd pul" value={balance.cash_total} icon={Wallet} negative />
          <BalanceCard label="Безналик (Bank)" value={balance.bank_total} icon={Wallet} positive />
          <BalanceCard label="USD" value={balance.usd_total} icon={Wallet} dollar />
          <BalanceCard label="Перечисления" value={balance.transfers} icon={ArrowUpRight} positive />
        </div>

        {/* Critical balance alert */}
        <Card className="border-2 border-rose-300 bg-rose-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-rose-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-rose-900">Umumiy balans (сум)</h3>
              <p className="text-sm text-rose-700 mt-0.5">Postavshiklarga umumiy qarz holati</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-sm text-rose-600">Joriy balans</div>
                  <div className="text-3xl font-bold text-rose-900 tabular-nums">
                    {balance.overall.toLocaleString()} so'm
                  </div>
                </div>
                <div>
                  <div className="text-sm text-rose-600">Predoplata bilan</div>
                  <div className="text-2xl font-bold text-rose-800 tabular-nums">
                    {balance.overall_with_prepay.toLocaleString()} so'm
                  </div>
                </div>
                <div>
                  <div className="text-sm text-rose-600">To'liq balans</div>
                  <div className="text-2xl font-bold text-rose-800 tabular-nums">
                    {balance.overall_full.toLocaleString()} so'm
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Kategoriya bo'yicha sotuv</h3>
              <span className="text-sm text-slate-500">Joriy oy</span>
            </div>
            <div className="space-y-4">
              {topCategories.map(c => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.growth > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {c.growth > 0 ? "↑" : "↓"} {Math.abs(c.growth)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold tabular-nums">{c.sum.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">{c.pct}%</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                      style={{ width: `${c.pct * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Joriy oy</h3>
            <div className="space-y-4">
              <Metric label="Bugungi sotuv" value="22,068,830" unit="so'm" trend="+12.3%" up />
              <Metric label="Haftalik" value="156.5M" unit="so'm" trend="+5.4%" up />
              <Metric label="Oy boshidan" value="155.1M" unit="so'm" trend="+18.2%" up />
              <Metric label="Yillik prognoz" value="1.8B" unit="so'm" trend="+22.5%" up />
              <div className="pt-4 border-t border-slate-200">
                <Metric label="Tushum" value="2.05B" unit="so'm" trend="↗" up />
                <Metric label="Xarajat" value="-895M" unit="so'm" trend="↘" />
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-sm text-slate-500">Sof foyda</div>
                  <div className="text-2xl font-bold text-emerald-700 tabular-nums">+1.16B so'm</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function BalanceCard({ label, value, icon: Icon, negative, positive, dollar }: {
  label: string; value: number; icon: React.ElementType; negative?: boolean; positive?: boolean; dollar?: boolean
}) {
  const color = negative ? "from-rose-500 to-rose-700" : positive ? "from-emerald-500 to-teal-600" : "from-slate-500 to-slate-700"
  return (
    <Card className={`bg-gradient-to-br ${color} text-white border-0 p-5`}>
      <Icon className="w-6 h-6 opacity-80 mb-3" />
      <div className="text-2xl font-bold tabular-nums leading-tight">
        {dollar ? "$" : ""}{value.toLocaleString()}
      </div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </Card>
  )
}

function Metric({ label, value, unit, trend, up }: { label: string; value: string; unit: string; trend: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-lg font-bold tabular-nums">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></div>
      </div>
      <div className={`text-sm font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
        {up ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
        {trend}
      </div>
    </div>
  )
}
