"use client"

import { useState, useMemo, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search, DollarSign, Clock, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Calendar, Eye, Download,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { useApi } from "@/hooks/use-api"
import { savdoService, reportService, type SavdoDto } from "@/lib/api/services"
import { getPublicApiBaseUrl } from "@/lib/api/base-url"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`
  return `${n.toLocaleString()} so'm`
}

type DatePreset = "today" | "week" | "month" | "all"

export default function InvoicesPage() {
  const { locale } = useLocale()
  const [search, setSearch] = useState("")
  const [datePreset, setDatePreset] = useState<DatePreset>("all")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [page, setPage] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<{
    id?: number; klient_ismi?: string; jami?: number; tolangan?: number; qarz?: number; sana?: string
    tovarlar: Array<{ tovar_nomi?: string; miqdor?: number; birlik?: string; sotish_narxi?: number; jami?: number }>
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const LIMIT = 20

  async function openDetail(id: number) {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const data = await savdoService.detail(id)
      setDetailData(data)
    } catch { setDetailData(null) }
    finally { setDetailLoading(false) }
  }

  const dateFilters = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    if (datePreset === "today") return { sana_dan: today }
    if (datePreset === "week") return { sana_dan: weekAgo }
    if (datePreset === "month") return { sana_dan: monthAgo }
    const f: Record<string, string> = {}
    if (customFrom) f.sana_dan = customFrom
    if (customTo) f.sana_gacha = customTo
    return f
  }, [datePreset, customFrom, customTo])

  const cacheKey = `${search}|${page}|${JSON.stringify(dateFilters)}`
  const fetchFn = useCallback(() => savdoService.list({
    limit: LIMIT, offset: page * LIMIT,
    klient: search.trim() || undefined, ...dateFilters,
  }), [cacheKey])

  const { data, loading, error, refetch } = useApi(fetchFn, [cacheKey])

  const items: SavdoDto[] = data?.items ?? []
  const total = data?.total ?? 0
  const stats = data?.stats ?? { bugun_tushum: 0, bugun_tolangan: 0, bugun_qarz: 0, bugun_soni: 0 }
  const totalPages = Math.ceil(total / LIMIT)

  const t = {
    title:      locale === "uz" ? "Savdolar" : "Продажи",
    tushum:     locale === "uz" ? "Bugungi tushum" : "Выручка сегодня",
    tolangan:   locale === "uz" ? "To'langan" : "Оплачено",
    qarzCol:    locale === "uz" ? "Qarz" : "Долг",
    soni:       locale === "uz" ? "Sotuvlar soni" : "Кол-во продаж",
    search:     locale === "uz" ? "Klient izlash..." : "Поиск клиента...",
    klient:     locale === "uz" ? "Klient" : "Клиент",
    jami:       locale === "uz" ? "Jami" : "Итого",
    sana:       locale === "uz" ? "Sana" : "Дата",
    tovarlar:   locale === "uz" ? "Tovarlar" : "Товары",
    noData:     locale === "uz" ? "Savdolar topilmadi" : "Продажи не найдены",
    jamiSavdo:  locale === "uz" ? `Jami ${total} ta savdo` : `Всего ${total} продаж`,
    today:      locale === "uz" ? "Bugun" : "Сегодня",
    week:       locale === "uz" ? "Hafta" : "Неделя",
    month:      locale === "uz" ? "Oy" : "Месяц",
    all:        locale === "uz" ? "Barchasi" : "Все",
  }

  const presets: { key: DatePreset; label: string }[] = [
    { key: "today", label: t.today },
    { key: "week",  label: t.week },
    { key: "month", label: t.month },
    { key: "all",   label: t.all },
  ]

  const kpiCards = [
    { label: t.tushum,   value: fmt(stats.bugun_tushum),   icon: DollarSign,   color: "text-primary",                              bg: "bg-primary/10" },
    { label: t.tolangan, value: fmt(stats.bugun_tolangan), icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400 dark:text-emerald-400",        bg: "bg-emerald-500/15 dark:bg-emerald-950/20" },
    { label: t.qarzCol,  value: fmt(stats.bugun_qarz),     icon: AlertTriangle,color: "text-destructive",                          bg: "bg-rose-500/15 dark:bg-rose-950/20" },
    { label: t.soni,     value: String(stats.bugun_soni),   icon: Clock,        color: "text-amber-600 dark:text-amber-400 dark:text-yellow-400",      bg: "bg-amber-500/15 dark:bg-amber-950/20" },
  ]

  return (
    <AdminLayout title={t.title}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(s => (
            <div key={s.label} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg shrink-0", s.bg, s.color)}><s.icon className="w-4 h-4" /></div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.search} className="pl-9" value={search}
                   onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>
          <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
            {presets.map(p => (
              <button key={p.key}
                onClick={() => { setDatePreset(p.key); setCustomFrom(""); setCustomTo(""); setPage(0) }}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  datePreset === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>{p.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <Input type="date" className="h-8 w-32 text-xs" value={customFrom}
                   onChange={e => { setCustomFrom(e.target.value); setDatePreset("all"); setPage(0) }} />
            <span className="text-muted-foreground text-xs">—</span>
            <Input type="date" className="h-8 w-32 text-xs" value={customTo}
                   onChange={e => { setCustomTo(e.target.value); setDatePreset("all"); setPage(0) }} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={async () => {
              try {
                const task = await reportService.requestExport({ tur: "kunlik", format: "excel" })
                let holat = task.holat ?? task.status ?? "kutilmoqda"
                let taskId = task.task_id
                let downloadUrl = task.download
                let attempts = 0
                while (holat !== "tayyor" && holat !== "xato" && attempts < 10) {
                  await new Promise(r => setTimeout(r, 1000))
                  const u = await reportService.exportStatus(taskId)
                  holat = u.holat ?? u.status ?? "kutilmoqda"
                  downloadUrl = u.download
                  attempts++
                }
                if (holat === "tayyor" && downloadUrl) {
                  window.open(`${getPublicApiBaseUrl()}${downloadUrl}`, "_blank")
                }
              } catch { /* silent */ }
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </Button>
        </div>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}
        {!loading && !error && (<>
          <PageHeader
            icon={DollarSign}
            gradient="amber"
            title={locale === "uz" ? "Sotuvlar tarixi" : "История продаж"}
            subtitle={locale === "uz" ? `${items.length} ta sotuv yozuvi` : `${items.length} записей`}
          />
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>{t.klient}</TableHead>
                <TableHead className="text-right">{t.jami}</TableHead>
                <TableHead className="text-right">{t.tolangan}</TableHead>
                <TableHead className="text-right">{t.qarzCol}</TableHead>
                <TableHead>{t.tovarlar}</TableHead>
                <TableHead>{t.sana}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">{t.noData}</TableCell></TableRow>
                ) : items.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/50 transition-colors hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => openDetail(s.id)}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{s.id}</TableCell>
                    <TableCell><span className="font-medium text-sm">{s.klient_ismi || "—"}</span></TableCell>
                    <TableCell className="text-right font-semibold text-sm">{fmt(s.jami ?? 0)}</TableCell>
                    <TableCell className="text-right text-sm text-emerald-600 dark:text-emerald-400 dark:text-emerald-400">{fmt(s.tolangan ?? 0)}</TableCell>
                    <TableCell className="text-right text-sm">
                      {(s.qarz ?? 0) > 0
                        ? <span className="text-destructive font-medium">{fmt(s.qarz ?? 0)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{s.tovar_soni ?? 0} ta</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.sana ? new Date(s.sana).toLocaleDateString("uz-UZ", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t.jamiSavdo}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page===0} onClick={() => setPage(p=>Math.max(0,p-1))}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-xs text-muted-foreground px-2">{page+1} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </>)}
      </div>

      {/* Sotuv tafsiloti modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {locale === "uz" ? "Sotuv tafsiloti" : "Детали продажи"}
              {detailData?.id && <span className="text-muted-foreground font-normal"> #{detailData.id}</span>}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{locale === "uz" ? "Klient" : "Клиент"}</p>
                  <p className="font-medium">{detailData.klient_ismi || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{locale === "uz" ? "Sana" : "Дата"}</p>
                  <p className="font-medium">{detailData.sana ? new Date(detailData.sana).toLocaleString("uz-UZ") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{locale === "uz" ? "Jami" : "Итого"}</p>
                  <p className="font-semibold">{fmt(detailData.jami ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{locale === "uz" ? "To'langan / Qarz" : "Оплачено / Долг"}</p>
                  <p className="font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400">{fmt(detailData.tolangan ?? 0)}</span>
                    {(detailData.qarz ?? 0) > 0 && <span className="text-destructive"> / {fmt(detailData.qarz ?? 0)}</span>}
                  </p>
                </div>
              </div>
              {detailData.tovarlar && detailData.tovarlar.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {locale === "uz" ? "Tovarlar" : "Товары"} ({detailData.tovarlar.length})
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">{locale === "uz" ? "Tovar" : "Товар"}</TableHead>
                          <TableHead className="text-xs text-right">{locale === "uz" ? "Miqdor" : "Кол-во"}</TableHead>
                          <TableHead className="text-xs text-right">{locale === "uz" ? "Narx" : "Цена"}</TableHead>
                          <TableHead className="text-xs text-right">{locale === "uz" ? "Jami" : "Итого"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(detailData.tovarlar || []).map((tv, i) => (
                          <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs font-medium">{tv.tovar_nomi || "—"}</TableCell>
                            <TableCell className="text-xs text-right">{tv.miqdor} {tv.birlik}</TableCell>
                            <TableCell className="text-xs text-right">{fmt(tv.sotish_narxi ?? 0)}</TableCell>
                            <TableCell className="text-xs text-right font-medium">{fmt(tv.jami ?? 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {locale === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены"}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
