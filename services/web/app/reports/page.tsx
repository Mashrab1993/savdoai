"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { monthlyRevenue, revenueByCategory, salesByClient, invoices, clients, products } from "@/lib/mock-data"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Download, TrendingUp, Users, DollarSign, Package } from "lucide-react"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

export default function ReportsPage() {
  const { locale } = useLocale()
  const L = translations.reports

  const [dateRange, setDateRange] = useState("last-8-months")

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0)
  const activeClients = clients.filter(c => c.status === "active").length
  const totalProducts = products.length
  const paidInvoices = invoices.filter(i => i.status === "paid")
  const avgOrderValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0

  const kpiCards = [
    { label: L.totalRevenue[locale],  value: fmt(totalRevenue),          icon: DollarSign,  color: "text-primary" },
    { label: L.activeClients[locale], value: String(activeClients),      icon: Users,       color: "text-blue-500" },
    { label: L.totalProducts[locale], value: String(totalProducts),      icon: Package,     color: "text-yellow-500" },
    { label: L.avgOrder[locale],      value: fmt(avgOrderValue),         icon: TrendingUp,  color: "text-green-500" },
  ]

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-8-months">{L.last8months[locale]}</SelectItem>
              <SelectItem value="last-year">{L.lastYear[locale]}</SelectItem>
              <SelectItem value="ytd">{L.ytd[locale]}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> {L.exportReport[locale]}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={`p-2 rounded-lg bg-secondary ${s.color} shrink-0`}><s.icon className="w-4 h-4" /></div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Monthly Revenue Bar */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{L.monthlyRevenue[locale]}</h3>
                <p className="text-xs text-muted-foreground">{L.revenuePerMonth[locale]}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Download className="w-3 h-3" /> CSV
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => fmtShort(v)}
                />
                <Tooltip
                  formatter={(v: number) => [fmt(v), ""]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name={L.revenue[locale]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue vs Expenses Line */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{L.revenueVsExp[locale]}</h3>
                <p className="text-xs text-muted-foreground">{L.profitTrend[locale]}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Download className="w-3 h-3" /> CSV
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => fmtShort(v)}
                />
                <Tooltip
                  formatter={(v: number) => [fmt(v), ""]}
                  contentStyle={tooltipStyle}
                />
                <Line type="monotone" dataKey="revenue"  stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name={L.revenue[locale]} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name={L.expenses[locale]} strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top clients horizontal bar */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{L.topClients[locale]}</h3>
                <p className="text-xs text-muted-foreground">{L.topClientsSub[locale]}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Download className="w-3 h-3" /> CSV
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByClient} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => fmtShort(v)}
                />
                <YAxis
                  type="category" dataKey="client"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [fmt(v), L.sales[locale]]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by category pie */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground text-sm">{L.byCategory[locale]}</h3>
              <p className="text-xs text-muted-foreground">{L.categoryDist[locale]}</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={revenueByCategory} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}>
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v}%`, ""]}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {revenueByCategory.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
