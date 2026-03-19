"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { KpiCard } from "@/components/ui/kpi-card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  DollarSign, Users, Package, CreditCard, FileText,
  TrendingUp, ArrowRight, AlertCircle, Clock, CheckCircle2,
  Landmark, GraduationCap, Hourglass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  monthlyRevenue, revenueByCategory, recentActivity,
  invoices, debts, clients, expenses, cashTransactions, apprentices,
} from "@/lib/mock-data"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

const activityIcon: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-4 h-4 text-primary" />,
  payment: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  client:  <Users className="w-4 h-4 text-purple-500" />,
  product: <Package className="w-4 h-4 text-yellow-500" />,
  alert:   <AlertCircle className="w-4 h-4 text-destructive" />,
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function DashboardPage() {
  const { locale } = useLocale()
  const d = translations.dashboard

  const paidInvoices = invoices.filter(i => i.status === "paid")
  const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0)
  const totalDebt = debts.filter(d => d.status !== "paid").reduce((s, d) => s + (d.amount - d.paid), 0)
  const overdueCount = debts.filter(d => d.status === "overdue").length
  const activeClients = clients.filter(c => c.status === "active").length
  const pendingExpenses = expenses.filter(e => e.status === "pending").length
  const todayCashIncome = cashTransactions.filter(t => t.type === "income" && t.date === "2025-03-19").reduce((s, t) => s + t.amount, 0)
  const activeApprentices = apprentices.filter(a => a.status === "active").length

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  }

  const title = d.title[locale]

  return (
    <AdminLayout title={title}>
      <div className="space-y-5">

        {/* KPI Row — top 4 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={d.totalRevenue[locale]}
            value={`${fmt(totalRevenue)} so'm`}
            change={12.4}
            changeLabel={d.vsLastMonth[locale]}
            icon={DollarSign}
            iconColor="text-primary"
          />
          <KpiCard
            title={d.activeClients[locale]}
            value={String(activeClients)}
            change={5}
            changeLabel={d.vsLastMonth[locale]}
            icon={Users}
            iconColor="text-purple-500"
          />
          <KpiCard
            title={d.totalDebt[locale]}
            value={`${fmt(totalDebt)} so'm`}
            change={-8.2}
            changeLabel={d.vsLastMonth[locale]}
            icon={CreditCard}
            iconColor="text-yellow-500"
          />
          <KpiCard
            title={d.overdueCount[locale]}
            value={String(overdueCount)}
            change={overdueCount > 2 ? 20 : -10}
            changeLabel={d.vsLastMonth[locale]}
            icon={AlertCircle}
            iconColor="text-destructive"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: locale === "uz" ? "Bugungi kassa kirimi" : "Приход кассы сегодня",
              value: `${fmt(todayCashIncome)} so'm`,
              icon: Landmark,
              color: "text-green-500",
            },
            {
              label: locale === "uz" ? "Faol shogirdlar" : "Активных сотрудников",
              value: String(activeApprentices),
              icon: GraduationCap,
              color: "text-blue-500",
            },
            {
              label: locale === "uz" ? "Kutilayotgan tasdiqlar" : "Ожидают подтверждения",
              value: String(pendingExpenses),
              icon: Hourglass,
              color: "text-orange-500",
            },
            {
              label: locale === "uz" ? "Jami hisob-fakturalar" : "Всего счетов",
              value: String(invoices.length),
              icon: FileText,
              color: "text-primary",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={`p-2 rounded-lg bg-secondary shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-lg font-bold text-foreground leading-tight truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{d.revenueChart[locale]}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{d.last8Months[locale]}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${fmt(v)}`} />
                <Tooltip
                  formatter={(v: number) => [`${fmt(v)} so'm`, ""]}
                  contentStyle={tooltipStyle}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#revGrad)" strokeWidth={2} name={d.revenue[locale]} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" fill="url(#expGrad)" strokeWidth={2} name={d.expenses[locale]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by category */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-1">{d.byCategory[locale]}</h3>
            <p className="text-xs text-muted-foreground mb-4">{d.categoryBreak[locale]}</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  dataKey="value"
                  paddingAngle={3}
                >
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
            <div className="space-y-1.5 mt-2">
              {revenueByCategory.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">{d.recentActivity[locale]}</h3>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {recentActivity.map(item => {
                const message = locale === "uz" ? item.messageUz : item.messageRu
                const timestamp = locale === "uz" ? item.timeKeyUz : item.timeKeyRu
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-md bg-secondary shrink-0">
                      {activityIcon[item.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{message}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">{timestamp}</span>
                        {item.meta && <span className="text-xs font-semibold text-primary">{item.meta}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions + Recent Invoices */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">{d.quickActions[locale]}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: d.createInvoice[locale],  href: "/invoices",    icon: FileText },
                  { label: d.addClient[locale],       href: "/clients",     icon: Users },
                  { label: d.addProduct[locale],      href: "/products",    icon: Package },
                  { label: d.viewReports[locale],     href: "/reports",     icon: TrendingUp },
                ].map(({ label, href, icon: Icon }) => (
                  <Link key={label} href={href}>
                    <Button variant="outline" className="w-full h-10 justify-start gap-2 text-xs">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">{d.recentInvoices[locale]}</h3>
                <Link href="/invoices" className="text-xs text-primary hover:underline flex items-center gap-1">
                  {translations.actions.viewAll[locale]} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {invoices.slice(0, 4).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.clientName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{fmt(inv.total)} so'm</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
