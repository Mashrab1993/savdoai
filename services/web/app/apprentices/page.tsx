"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatusBadge } from "@/components/ui/status-badge"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  GraduationCap, Search, Plus, ChevronRight, Pencil, Trash2,
  Wallet, TrendingUp, Users,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import AgentKpiBoard from "@/components/dashboard/agent-kpi-board"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { apprenticeService } from "@/lib/api/services"
import { normalizeApprentice, type ApprenticeVM } from "@/lib/api/normalizers"
import { PageLoading, PageError } from "@/components/shared/page-states"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}


export default function ApprenticesPage() {
  const { locale } = useLocale()
  const L = translations.apprentices

  const { data: rawApprentices, loading, error, refetch } = useApi(apprenticeService.list)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<ApprenticeVM | null>(null)

  const apprentices: ApprenticeVM[] = (rawApprentices ?? []).map(normalizeApprentice)

  const filtered = apprentices.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.specialty.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? a.active : !a.active)
    return matchSearch && matchStatus
  })

  const totalMonthlySales = apprentices.reduce((s, a) => s + a.monthlySales, 0)
  const totalTodaySales = apprentices.reduce((s, a) => s + a.todaySales, 0)
  const activeCount = apprentices.filter(a => a.active).length

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-5">
        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && <>
        <PageHeader
          icon={GraduationCap}
          gradient="emerald"
          title={L.title[locale]}
          subtitle={locale === "uz" ? `${activeCount} faol / ${apprentices.length} jami` : `${activeCount} активных / ${apprentices.length} всего`}
        />

        {/* Agent leaderboard (premium) */}
        {apprentices.length > 0 && (
          <AgentKpiBoard
            agents={apprentices.map(a => ({
              id:           a.id,
              ism:          a.name,
              reja:         0,
              tashrif_soni: 0,
              rejali_summa: a.todaySales ?? 0,
              rejali_soni:  0,
              ofplan_summa: 0,
              ofplan_soni:  0,
              qaytarish:    0,
            }))}
          />
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: L.totalStaff[locale],   value: String(apprentices.length), icon: Users,       color: "text-primary",    bg: "bg-secondary" },
            { label: L.activeStaff[locale],  value: String(activeCount),         icon: GraduationCap, color: "text-green-500", bg: "bg-emerald-500/15 dark:bg-green-900/20" },
            { label: L.monthlyBudget[locale], value: fmt(totalMonthlySales),    icon: Wallet,      color: "text-purple-500", bg: "bg-secondary" },
            { label: L.todayExpenses[locale], value: fmt(totalTodaySales),       icon: TrendingUp,  color: "text-yellow-500", bg: "bg-amber-500/15 dark:bg-yellow-900/20" },
          ].map(s => (
            <div key={s.label} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3 hover:border-border/70 transition-colors">
              <div className={cn("p-2 rounded-lg shrink-0", s.bg, s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={L.searchPlaceholder[locale]}
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={L.allStatus[locale]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
                <SelectItem value="active">{translations.status.active[locale]}</SelectItem>
                <SelectItem value="inactive">{translations.status.inactive[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled className="gap-2 shrink-0" title={locale === "uz" ? "Tez orada" : "Скоро"}>
            <Plus className="w-4 h-4" /> {L.addApprentice[locale]}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.staffMember[locale]}</TableHead>
                <TableHead>{translations.fields.status[locale]}</TableHead>
                <TableHead>{locale === "uz" ? "Bugungi savdo" : "Продажи сегодня"}</TableHead>
                <TableHead>{locale === "uz" ? "Oylik maosh" : "Зарплата"}</TableHead>
                <TableHead>{locale === "uz" ? "Oylik savdo" : "Продажи в месяц"}</TableHead>
                <TableHead className="text-right">{translations.fields.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {L.noStaff[locale]}
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => {
                const activeStatus = a.active ? "active" : "inactive"
                return (
                  <TableRow
                    key={a.id}
                    className="border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {a.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.specialty}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={activeStatus} /></TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{fmt(a.todaySales)}</span>
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <span className="text-sm font-medium text-foreground">{fmt(a.salary)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{fmt(a.monthlySales)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          disabled title={locale === "uz" ? "Tez orada" : "Скоро"}
                          onClick={e => e.stopPropagation()}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled title={locale === "uz" ? "Tez orada" : "Скоро"}
                          onClick={e => e.stopPropagation()}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        </>}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{L.details[locale]}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                {/* Profile card */}
                <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selected.name}</p>
                    <p className="text-sm text-muted-foreground">{selected.specialty}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{selected.phone}</p>
                  </div>
                  <div className="ml-auto"><StatusBadge status={selected.active ? "active" : "inactive"} /></div>
                </div>

                {/* Stats overview */}
                <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 space-y-3">
                  {[
                    { label: locale === "uz" ? "Bugungi savdo" : "Продажи сегодня", value: fmt(selected.todaySales) },
                    { label: locale === "uz" ? "Oylik savdo" : "Продажи в месяц", value: fmt(selected.monthlySales) },
                    { label: locale === "uz" ? "Oylik maosh" : "Зарплата", value: fmt(selected.salary) },
                    { label: locale === "uz" ? "Daraja" : "Уровень", value: selected.level || "—" },
                    { label: locale === "uz" ? "Qo'shilgan sana" : "Дата вступления", value: selected.joinedAt },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full gap-2" disabled title={locale === "uz" ? "Tez orada" : "Скоро"}>
                  <Pencil className="w-4 h-4" /> {translations.actions.edit[locale]}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
