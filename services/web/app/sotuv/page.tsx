"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ShoppingBag, Plus, FileText, RotateCcw, Sparkles, ListTodo, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type DashboardStats = {
  today_sum?: number
  today_count?: number
  overdue_amount?: number
  overdue_count?: number
}

type FoydaResp = {
  tushum: number
  yalpi_foyda: number
  sof_foyda: number
  margin_foiz: number
  sotuv_soni?: number
}

const SECTIONS = [
  { slug: "yangi", icon: Plus, title: "Yangi sotuv", desc: "Yangi zakaz yaratish", featured: true },
  { slug: "dashboard", icon: ShoppingBag, title: "Sotuv dashboard", desc: "Bugungi va 30-kun" },
  { slug: "return", icon: RotateCcw, title: "Qaytarishlar", desc: "Bekor qilingan" },
  { slug: "contracts", icon: FileText, title: "Shartnomalar", desc: "Kredit limitli klientlar" },
  { slug: "discount-rules", icon: Sparkles, title: "Chegirma qoidalari", desc: "Auto-chegirma" },
  { slug: "lead-pipeline", icon: ListTodo, title: "Lead pipeline", desc: "Yangi klient" },
  { slug: "promotion-builder", icon: Sparkles, title: "Promo builder", desc: "Aksiya tuzish" },
  { slug: "quote-builder", icon: FileText, title: "Quote builder", desc: "Taklif" },
  { slug: "recurring", icon: Calendar, title: "Takroriy sotuv", desc: "Subscription" },
  { slug: "zayavkalar", icon: ListTodo, title: "Zayavkalar", desc: "Klient so'rovlari" },
]

export default function SotuvPage() {
  const { isAuthenticated } = useAuth()
  const { data: today, loading: tloading } = useApi<DashboardStats>(isAuthenticated ? "/api/v1/dashboard/summary" : null)
  const { data: foyda } = useApi<FoydaResp>(isAuthenticated ? "/api/v1/hisobot/foyda?kunlar=30" : null)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sotuv</h1>
          <p className="text-base text-slate-500 mt-1">
            Sotuv operatsiyalari, zakazlar, dashboard
            {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
          </p>
        </div>

        {/* Real-time KPI */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Bugungi sotuv" value={formatCurrency(today?.today_sum || 0)} sub={`${today?.today_count || 0} ta zakaz`} accent="emerald" loading={tloading} />
            <KpiCard label="30-kun tushum" value={formatCurrency(foyda?.tushum || 0)} sub={`${foyda?.sotuv_soni || 0} ta sotuv`} accent="blue" />
            <KpiCard label="Yalpi foyda" value={formatCurrency(foyda?.yalpi_foyda || 0)} sub={`Marja: ${foyda?.margin_foiz || 0}%`} accent="amber" />
            <KpiCard label="Muddati o'tgan qarz" value={formatCurrency(today?.overdue_amount || 0)} sub={`${today?.overdue_count || 0} ta klient`} accent="rose" />
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">Tez harakatlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <Link key={s.slug} href={`/sotuv/${s.slug}`}>
                  <Card className={`p-4 hover:shadow-md transition-all cursor-pointer h-full group ${s.featured ? "border-2 border-emerald-300 bg-emerald-50/50" : ""}`}>
                    <Icon className={`w-7 h-7 mb-2 ${s.featured ? "text-emerald-700" : "text-slate-600"} group-hover:text-emerald-600 transition-colors`} />
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="text-xs text-slate-500">{s.desc}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <Link href="/zakazlar">
          <Card className="p-5 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Barcha zakazlar →</h3>
                <p className="text-sm text-slate-600">Zakaz tarixi, status, Excel export, pechat</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-300" />
            </div>
          </Card>
        </Link>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ label, value, sub, accent, loading }: {
  label: string; value: string; sub?: string;
  accent: "emerald" | "blue" | "amber" | "rose";
  loading?: boolean
}) {
  const colors = {
    emerald: "border-emerald-200 text-emerald-700",
    blue: "border-blue-200 text-blue-700",
    amber: "border-amber-200 text-amber-700",
    rose: "border-rose-200 text-rose-700",
  }
  return (
    <Card className={`p-4 border-2 ${colors[accent]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase font-semibold text-slate-500">{label}</span>
        {loading && <Loader2 className="w-4 h-4 animate-spin opacity-50" />}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </Card>
  )
}
