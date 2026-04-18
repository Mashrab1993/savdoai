"use client"

import { useState, useMemo, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Package, AlertTriangle, XCircle, CheckCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useLocale } from "@/lib/locale-context"
import { useApi } from "@/hooks/use-api"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const api = {
  get: async <T,>(url: string): Promise<T> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    const r = await fetch(`${base}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  },
}

// ── Types ────────────────────────────────────────────────────────────────────

interface StockForecastItem {
  id: number
  nomi: string
  kategoriya: string
  birlik: string
  qoldiq: number
  sotish_narxi: number
  olish_narxi: number
  jami_sotilgan: number
  sotuv_kunlari: number
  kunlik_sotuv: number
  necha_kunga_yetadi: number | null
  tavsiya_6_kun: number
  tavsiya_10_kun: number
  tavsiya_30_kun: number
  holat: "tugagan" | "kritik" | "kam" | "yetarli"
}

interface StockForecastResponse {
  items: StockForecastItem[]
  jami_tovar: number
  tugagan: number
  kritik: number
  kam: number
  yetarli: number
  kunlar: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const HOLAT_CONFIG: Record<string, { bg: string; text: string; label: { uz: string; ru: string }; rowBg: string }> = {
  tugagan: {
    bg: "bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    label: { uz: "Tugagan", ru: "Закончился" },
    rowBg: "bg-rose-500/5",
  },
  kritik: {
    bg: "bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    label: { uz: "Kritik", ru: "Критично" },
    rowBg: "bg-orange-500/5",
  },
  kam: {
    bg: "bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    label: { uz: "Kam", ru: "Мало" },
    rowBg: "bg-amber-500/5",
  },
  yetarli: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    label: { uz: "Yetarli", ru: "Достаточно" },
    rowBg: "",
  },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const PERIOD_OPTIONS = [7, 14, 30, 60, 90]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StockForecastPage() {
  const { locale } = useLocale()
  const [kunlar, setKunlar] = useState(30)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const fetcher = useCallback(
    () => api.get<StockForecastResponse>(`/api/v1/hisobot/tavsiya-qoldiq?kunlar=${kunlar}`),
    [kunlar],
  )
  const { data, loading, error, refetch } = useApi(fetcher, [kunlar])

  const items = data?.items ?? []

  // Kategoriyalar ro'yxati — dinamik
  const categories = useMemo(() => {
    const set = new Set(items.map((t) => t.kategoriya).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  // Filtrlangan ro'yxat
  const filtered = useMemo(() => {
    return items.filter((t) => {
      const matchSearch =
        t.nomi.toLowerCase().includes(search.toLowerCase()) ||
        t.kategoriya.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === "all" || t.kategoriya === categoryFilter
      return matchSearch && matchCategory
    })
  }, [items, search, categoryFilter])

  // Progress bar max kunlar
  const maxKunlar = Math.max(30, ...items.map((t) => t.necha_kunga_yetadi ?? 0))

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={Package}
          gradient="amber"
          title={locale === "uz" ? "Tavsiya qoldiq" : "Рекомендация остатков"}
          subtitle={
            locale === "uz"
              ? "Tovarlarning qoldiq holati va zakaz tavsiyalari"
              : "Состояние остатков и рекомендации по заказу"
          }
          action={
            <div className="flex gap-2 items-center">
              {PERIOD_OPTIONS.map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={kunlar === k ? "default" : "outline"}
                  onClick={() => setKunlar(k)}
                >
                  {k} {locale === "uz" ? "kun" : "дн"}
                </Button>
              ))}
            </div>
          }
        />

        {loading && <PageLoading />}
        {error && <PageError message="Tavsiya qoldiq yuklashda xato" onRetry={refetch} />}

        {!loading && !error && items.length > 0 && (
          <>
            {/* ── 4 Stat cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: locale === "uz" ? "Tugagan" : "Закончилось",
                  value: data?.tugagan ?? 0,
                  icon: XCircle,
                  tone: "rose" as const,
                },
                {
                  label: locale === "uz" ? "Kritik" : "Критично",
                  value: data?.kritik ?? 0,
                  icon: AlertTriangle,
                  tone: "orange" as const,
                },
                {
                  label: locale === "uz" ? "Kam" : "Мало",
                  value: data?.kam ?? 0,
                  icon: Package,
                  tone: "amber" as const,
                },
                {
                  label: locale === "uz" ? "Yetarli" : "Достаточно",
                  value: data?.yetarli ?? 0,
                  icon: CheckCircle,
                  tone: "emerald" as const,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "p-2 rounded-xl ring-1 shrink-0",
                      s.tone === "rose"
                        ? "bg-rose-500/15 text-rose-500 ring-rose-500/30"
                        : s.tone === "orange"
                          ? "bg-orange-500/15 text-orange-500 ring-orange-500/30"
                          : s.tone === "amber"
                            ? "bg-amber-500/15 text-amber-500 ring-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
                    )}
                  >
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">
                      {s.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Toolbar ───────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={locale === "uz" ? "Tovar qidirish..." : "Поиск товара..."}
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={locale === "uz" ? "Kategoriya" : "Категория"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {locale === "uz" ? "Barchasi" : "Все"}
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === "uz"
                  ? `${filtered.length} ta tovar / ${data?.jami_tovar ?? 0} jami`
                  : `${filtered.length} товаров / ${data?.jami_tovar ?? 0} всего`}
              </p>
            </div>

            {/* ── Table ─────────────────────────────────────────────── */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>{locale === "uz" ? "Tovar" : "Товар"}</TableHead>
                      <TableHead>{locale === "uz" ? "Kategoriya" : "Категория"}</TableHead>
                      <TableHead className="text-right">{locale === "uz" ? "Qoldiq" : "Остаток"}</TableHead>
                      <TableHead className="text-right">
                        {locale === "uz" ? "Kunlik sotuv" : "Дн. продажа"}
                      </TableHead>
                      <TableHead className="min-w-[160px]">
                        {locale === "uz" ? "Yetadi (kun)" : "Хватит (дн)"}
                      </TableHead>
                      <TableHead className="text-right">
                        {locale === "uz" ? "Tavsiya 6k" : "Рек. 6д"}
                      </TableHead>
                      <TableHead className="text-right">
                        {locale === "uz" ? "Tavsiya 10k" : "Рек. 10д"}
                      </TableHead>
                      <TableHead className="text-right">
                        {locale === "uz" ? "Tavsiya 30k" : "Рек. 30д"}
                      </TableHead>
                      <TableHead className="text-center">{locale === "uz" ? "Holat" : "Статус"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item, i) => {
                      const holat = HOLAT_CONFIG[item.holat] ?? HOLAT_CONFIG.yetarli
                      const progressPct = Math.min(100, ((item.necha_kunga_yetadi ?? 0) / maxKunlar) * 100)
                      const progressColor =
                        item.holat === "tugagan"
                          ? "bg-rose-500"
                          : item.holat === "kritik"
                            ? "bg-orange-500"
                            : item.holat === "kam"
                              ? "bg-amber-500"
                              : "bg-emerald-500"

                      return (
                        <TableRow key={item.id} className={cn(holat.rowBg, "transition-colors")}>
                          <TableCell className="text-muted-foreground text-xs tabular-nums">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-semibold text-foreground">{item.nomi}</p>
                            <p className="text-[11px] text-muted-foreground">{item.birlik}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.kategoriya}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {item.qoldiq}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.kunlik_sotuv.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all", progressColor)}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold tabular-nums min-w-[32px] text-right">
                                {item.necha_kunga_yetadi != null ? item.necha_kunga_yetadi.toFixed(1) : "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {item.tavsiya_6_kun > 0 ? (
                              <span className="text-orange-600 dark:text-orange-400">
                                +{item.tavsiya_6_kun}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {item.tavsiya_10_kun > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                +{item.tavsiya_10_kun}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {item.tavsiya_30_kun > 0 ? (
                              <span className="text-blue-600 dark:text-blue-400">
                                +{item.tavsiya_30_kun}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-[10px] font-bold border-0",
                                holat.bg,
                                holat.text,
                              )}
                            >
                              {holat.label[locale]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {/* ── Empty state ──────────────────────────────────────── */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-foreground">
              {locale === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "uz"
                ? "Tavsiya qoldiq hisoboti uchun sotuv ma'lumotlari kerak"
                : "Для отчёта рекомендации остатков нужны данные о продажах"}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
