"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  Wallet, FileText, ArrowRightLeft, Building2, Banknote,
  TrendingUp, AlertCircle, Receipt, Layers
} from "lucide-react"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KassaStats = {
  bugun_kirim: string
  bugun_chiqim: string
  bugun_balans: string
  jami_kirim: string
  jami_chiqim: string
  jami_balans: string
  naqd_balans: string
  karta_balans: string
  otkazma_balans: string
}

const SECTIONS = [
  {
    title: "Klientlar bilan hisob-kitoblar",
    color: "emerald",
    items: [
      { slug: "akt-sverki", icon: FileText, title: "Akt sverki", desc: "Klient bilan akt-sverki" },
      { slug: "oplaty", icon: Wallet, title: "Klient to'lovlari", desc: "To'lovlar tarixi" },
      { slug: "balansy-clientov", icon: Wallet, title: "Klient balanslari", desc: "Real-time balance" },
      { slug: "obroty", icon: TrendingUp, title: "Umumiy aylanma", desc: "Oborot" },
      { slug: "init-balans", icon: Wallet, title: "Boshlang'ich balans", desc: "Initial balance" },
      { slug: "saldo", icon: Banknote, title: "Saldo", desc: "Real-time balance" },
      { slug: "debt-by-shipment", icon: AlertCircle, title: "Zakaz bo'yicha qarz", desc: "Per-order debt" },
      { slug: "aging", icon: AlertCircle, title: "Aging analysis", desc: "0-7/8-15/16-30/31+" },
      { slug: "kassa-pivot", icon: Layers, title: "Kassa pivot", desc: "Pivot table" },
    ],
  },
  {
    title: "Postavshiklar bilan hisob-kitoblar",
    color: "blue",
    items: [
      { slug: "obroty-postavshik", icon: TrendingUp, title: "Postavshik aylanmasi", desc: "Total turnover" },
    ],
  },
  {
    title: "Boshqa moliyaviy operatsiyalar",
    color: "amber",
    items: [
      { slug: "xarajat", icon: Receipt, title: "Xarajatlar", desc: "Multi-currency, PNL flag" },
      { slug: "cashflow", icon: ArrowRightLeft, title: "Pul oqimi", desc: "Cash flow report" },
      { slug: "cashbox-balans", icon: Wallet, title: "Kassa balansi", desc: "Cash register" },
      { slug: "stati-fondy", icon: FileText, title: "Statyalar va Fondlar", desc: "Articles & Funds" },
    ],
  },
]

export default function KassaPage() {
  const { isAuthenticated } = useAuth()
  const { data: stats, loading } = useApi<KassaStats>(isAuthenticated ? "/api/v1/kassa/stats" : null)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kassa</h1>
          <p className="text-base text-slate-500 mt-1">
            Moliyaviy hisobotlar · Klient/Postavshik/Boshqa
            {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
          </p>
        </div>

        {/* Real-time KPI cards */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Bugungi kirim" value={loading ? "..." : formatCurrency(Number(stats?.bugun_kirim || 0))} accent="emerald" icon={TrendingUp} />
            <KpiCard label="Bugungi chiqim" value={loading ? "..." : formatCurrency(Number(stats?.bugun_chiqim || 0))} accent="rose" icon={ArrowRightLeft} />
            <KpiCard label="Bugungi balans" value={loading ? "..." : formatCurrency(Number(stats?.bugun_balans || 0))} accent="blue" icon={Wallet} />
            <KpiCard label="Naqd balans" value={loading ? "..." : formatCurrency(Number(stats?.naqd_balans || 0))} accent="amber" icon={Banknote} />
          </div>
        )}

        {/* Jami balans summary */}
        {isAuthenticated && stats && (
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Jami balans (barcha vaqt)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500">Naqd</div>
                <div className="text-2xl font-bold text-emerald-700 tabular-nums">{formatCurrency(Number(stats.naqd_balans || 0))}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Karta</div>
                <div className="text-2xl font-bold text-blue-700 tabular-nums">{formatCurrency(Number(stats.karta_balans || 0))}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">O'tkazma</div>
                <div className="text-2xl font-bold text-purple-700 tabular-nums">{formatCurrency(Number(stats.otkazma_balans || 0))}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-sm text-slate-600">JAMI balans:</span>
              <span className="text-3xl font-bold text-emerald-800 tabular-nums">{formatCurrency(Number(stats.jami_balans || 0))}</span>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          {SECTIONS.map(s => {
            const colors = {
              emerald: "border-emerald-300 bg-emerald-50/30",
              blue: "border-blue-300 bg-blue-50/30",
              amber: "border-amber-300 bg-amber-50/30",
            }[s.color]
            return (
              <div key={s.title}>
                <h2 className="text-lg font-semibold mb-3">{s.title} <span className="text-sm font-normal text-slate-400">({s.items.length})</span></h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {s.items.map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.slug} href={`/kassa/${item.slug}`}>
                        <Card className={`p-4 hover:shadow-md transition-all cursor-pointer h-full group border-2 ${colors}`}>
                          <Icon className="w-7 h-7 mb-2 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                          <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{item.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({
  label, value, accent, icon: Icon,
}: { label: string; value: string; accent: "emerald" | "rose" | "blue" | "amber"; icon: React.ElementType }) {
  const colors = {
    emerald: "border-emerald-200 text-emerald-700",
    rose: "border-rose-200 text-rose-700",
    blue: "border-blue-200 text-blue-700",
    amber: "border-amber-200 text-amber-700",
  }
  return (
    <Card className={`p-4 border-2 ${colors[accent]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</span>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  )
}
