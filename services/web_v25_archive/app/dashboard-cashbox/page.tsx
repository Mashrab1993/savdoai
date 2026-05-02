"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { Landmark } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

const STATS = [
  { label: "Bugungi kirim", value: 0, icon: TrendingUp, color: "emerald" },
  { label: "Bugungi chiqim", value: 0, icon: TrendingDown, color: "red" },
  { label: "Sof daromad", value: 0, icon: Wallet, color: "blue" },
  { label: "Joriy balans", value: 0, icon: Wallet, color: "purple" },
]

export default function CashboxDashboardPage() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={Landmark}
          gradient="cyan"
          title="Kassa dashboard"
          subtitle="Pul oqimi va kassa holati"
        />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className={`bg-${s.color}-50 dark:bg-${s.color}-900/20 rounded-xl border border-${s.color}-200 p-4`}>
              <div className={`text-sm text-${s.color}-600 flex items-center gap-1`}>
                <s.icon className="w-3 h-3" /> {s.label}
              </div>
              <div className={`text-2xl font-bold mt-1 text-${s.color}-700`}>{formatCurrency(s.value)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6">
            <h2 className="font-bold mb-4">To'lov turlari bo'yicha</h2>
            <div className="space-y-3">
              {[
                { label: "Naqd", value: 0, color: "emerald" },
                { label: "Karta", value: 0, color: "blue" },
                { label: "Click", value: 0, color: "purple" },
                { label: "Payme", value: 0, color: "orange" },
                { label: "Bank o'tkazma", value: 0, color: "red" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${p.color}-500`} />
                    <span className="text-sm">{p.label}</span>
                  </div>
                  <span className="font-mono font-bold">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6">
            <h2 className="font-bold mb-4">Kassalar holati</h2>
            <div className="space-y-3">
              {[
                { name: "Asosiy kassa", balans: 5500000 },
                { name: "Karta kassa", balans: 12300000 },
                { name: "Bank hisob", balans: 45700000 },
                { name: "Click hisobi", balans: 850000 },
              ].map((k, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                  <span className="text-sm">{k.name}</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(k.balans)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
