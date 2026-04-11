"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { LayoutDashboard, BarChart3, Shield, TrendingUp, Users, Truck, ShoppingCart, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"

const DASHBOARDS = [
  { href: "/dashboard",            label: "Bosh dashboard",          desc: "Asosiy ko'rsatkichlar va statistika",       icon: LayoutDashboard, color: "emerald" },
  { href: "/supervisor-dashboard", label: "Supervisor dashboard",    desc: "Sotuv tahlili va kategoriyalar",            icon: Shield,          color: "purple" },
  { href: "/audit-dashboard",      label: "Audit dashboard",         desc: "Kunlik agent faoliyati auditi",             icon: BarChart3,       color: "blue" },
  { href: "/ai-dashboard",         label: "AI dashboard",            desc: "AI tahlil va prognozlar",                   icon: TrendingUp,      color: "orange" },
  { href: "/kpi",                  label: "KPI dashboard",           desc: "Xodimlar va sotuv KPI",                     icon: TrendingUp,      color: "red" },
  { href: "/leaderboard",          label: "Leaderboard",             desc: "Eng yaxshi xodimlar va mijozlar reytingi",  icon: Users,           color: "yellow" },
  { href: "/agent-monitor",        label: "Agent Monitor",           desc: "Agent monitoring real-time",                icon: MapPin,          color: "indigo" },
  { href: "/live",                 label: "🔴 LIVE feed",            desc: "Real-time tranzaksiyalar",                  icon: TrendingUp,      color: "red" },
  { href: "/pro-analitika",        label: "Pro analitika",           desc: "Chuqur tahlil va ABC-XYZ",                  icon: BarChart3,       color: "purple" },
]

export default function DashboardsPage() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-emerald-600" />
            Dashboardlar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Barcha dashboardlar va tahlil bo'limlari</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DASHBOARDS.map(d => (
            <Link key={d.href} href={d.href} className="bg-white dark:bg-gray-900 rounded-xl border p-6 hover:shadow-md hover:border-emerald-300 transition group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${d.color}-50 rounded-xl`}>
                  <d.icon className={`w-7 h-7 text-${d.color}-600`} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition" />
              </div>
              <div className="font-bold text-lg">{d.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{d.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
