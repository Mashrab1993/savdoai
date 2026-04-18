"use client"

import { useState, useMemo, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Grid3X3, Package, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

type MatritsaKalit = "AX" | "AY" | "AZ" | "BX" | "BY" | "BZ" | "CX" | "CY" | "CZ"

const MATRITSA_RANG: Record<MatritsaKalit, { bg: string; text: string; label: string }> = {
  AX: { bg: "bg-emerald-500/20",  text: "text-emerald-700 dark:text-emerald-300", label: "IDEAL" },
  AY: { bg: "bg-amber-500/20",    text: "text-amber-700 dark:text-amber-300",     label: "EHTIYOT" },
  AZ: { bg: "bg-rose-500/20",     text: "text-rose-700 dark:text-rose-300",       label: "XAVFLI" },
  BX: { bg: "bg-emerald-500/15",  text: "text-emerald-700 dark:text-emerald-300", label: "YAXSHI" },
  BY: { bg: "bg-muted",           text: "text-foreground",                         label: "ODDIY" },
  BZ: { bg: "bg-amber-500/15",    text: "text-amber-700 dark:text-amber-300",     label: "KAMAYTIRING" },
  CX: { bg: "bg-blue-500/15",     text: "text-blue-700 dark:text-blue-300",       label: "SAQLANG" },
  CY: { bg: "bg-muted/80",        text: "text-muted-foreground",                  label: "MINIMUM" },
  CZ: { bg: "bg-rose-500/15",     text: "text-rose-700 dark:text-rose-300",       label: "CHIQARING" },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function AbcXyzPage() {
  const { locale } = useLocale()
  const [kunlar, setKunlar] = useState(90)
  const [activeCell, setActiveCell] = useState<MatritsaKalit | null>(null)

  const fetcher = useCallback(
    () => api.get<any>(`/api/v1/analitika/abc-xyz?kunlar=${kunlar}`),
    [kunlar],
  )
  const { data, loading, error, refetch } = useApi(fetcher, [kunlar])

  const tovarlar = data?.tovarlar ?? []
  const stat = data?.matritsa_statistika ?? {}
  const umumiy = data?.umumiy_tahlil ?? {}

  const filtered = useMemo(
    () => activeCell ? tovarlar.filter((t: any) => t.matritsa === activeCell) : tovarlar,
    [tovarlar, activeCell],
  )

  const ABC = ["A", "B", "C"]
  const XYZ = ["X", "Y", "Z"]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={Grid3X3}
          gradient="violet"
          title={locale === "uz" ? "ABC-XYZ Matritsa" : "ABC-XYZ Матрица"}
          subtitle={locale === "uz"
            ? "Tovarlarni daromad va barqarorlik bo'yicha segmentatsiya"
            : "Сегментация товаров по доходу и стабильности"}
          action={
            <div className="flex gap-2 items-center">
              {[30, 60, 90].map(k => (
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
        {error && <PageError message="ABC-XYZ yuklashda xato" onRetry={refetch} />}

        {!loading && !error && tovarlar.length > 0 && (
          <>
            {/* Umumiy statistika */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: locale === "uz" ? "Jami tovar" : "Всего товаров", value: String(umumiy.jami_tovar ?? 0), icon: Package, tone: "emerald" },
                { label: "A tovarlar", value: `${umumiy.a_tovarlar_soni ?? 0} (${umumiy.a_tovarlar_foizi ?? 0}%)`, icon: TrendingUp, tone: "emerald" },
                { label: locale === "uz" ? "Barqaror (X)" : "Стабильные (X)", value: `${umumiy.barqaror_tovarlar_foizi ?? 0}%`, icon: TrendingUp, tone: "blue" },
                { label: locale === "uz" ? "Xavfli" : "Рискованные", value: String((umumiy.xavfli_tovarlar ?? []).length), icon: AlertTriangle, tone: "rose" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className={cn(
                    "p-2 rounded-xl ring-1 shrink-0",
                    s.tone === "emerald" ? "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30" :
                    s.tone === "blue"    ? "bg-blue-500/15 text-blue-500 ring-blue-500/30" :
                                           "bg-rose-500/15 text-rose-500 ring-rose-500/30",
                  )}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-base font-bold text-foreground mt-0.5 tabular-nums">{s.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 3×3 Matrix Grid */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {locale === "uz" ? "Matritsa (bosing — filtrlash)" : "Матрица (нажмите для фильтра)"}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {/* Header row */}
                <div />
                {XYZ.map(x => (
                  <div key={x} className="text-center text-xs font-bold text-muted-foreground py-1">
                    {x} {x === "X" ? "(barqaror)" : x === "Y" ? "(mavsumiy)" : "(tartibsiz)"}
                  </div>
                ))}
                {/* Rows */}
                {ABC.map(a => (
                  <>
                    <div key={`label-${a}`} className="flex items-center text-xs font-bold text-muted-foreground">
                      {a} {a === "A" ? "(top 20%)" : a === "B" ? "(o'rta 30%)" : "(past 50%)"}
                    </div>
                    {XYZ.map(x => {
                      const key = `${a}${x}` as MatritsaKalit
                      const meta = MATRITSA_RANG[key]
                      const count = stat[key] ?? 0
                      const isActive = activeCell === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveCell(isActive ? null : key)}
                          className={cn(
                            "rounded-xl p-3 text-center transition-all border-2",
                            meta.bg,
                            isActive
                              ? "border-primary shadow-lg scale-105"
                              : "border-transparent hover:border-border hover:shadow-md",
                          )}
                        >
                          <p className={cn("text-lg font-bold tabular-nums", meta.text)}>
                            {count}
                          </p>
                          <p className={cn("text-[10px] font-semibold", meta.text)}>
                            {meta.label}
                          </p>
                        </button>
                      )
                    })}
                  </>
                ))}
              </div>
              {activeCell && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activeCell}: {MATRITSA_RANG[activeCell].label} — {stat[activeCell] ?? 0} ta tovar
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setActiveCell(null)}>
                    Barchasini ko'rsatish
                  </Button>
                </div>
              )}
            </div>

            {/* Product list */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60">
                <p className="text-sm font-semibold text-foreground">
                  {activeCell
                    ? `${MATRITSA_RANG[activeCell].label} tovarlar (${filtered.length})`
                    : `Barcha tovarlar (${filtered.length})`}
                </p>
              </div>
              <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto">
                {filtered.slice(0, 50).map((t: any, i: number) => {
                  const mk = (t.matritsa || "BY") as MatritsaKalit
                  const meta = MATRITSA_RANG[mk] || MATRITSA_RANG.BY
                  return (
                    <motion.div
                      key={t.tovar_id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className={cn(
                        "inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold ring-1",
                        meta.bg, meta.text,
                        mk.startsWith("A") ? "ring-emerald-500/30" :
                        mk.startsWith("B") ? "ring-blue-500/30" :
                                              "ring-rose-500/30",
                      )}>
                        {mk}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.nomi}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                          <span>{t.abc} ({t.daromad_foizi}%)</span>
                          <span>CV: {t.cv}</span>
                          <span>{t.faol_hafta} hafta</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground tabular-nums">{fmt(Number(t.jami_summa))} so'm</p>
                        <p className="text-[11px] text-muted-foreground">{t.jami_miqdor} dona</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Tavsiyalar */}
            {(umumiy.ideal_tovarlar ?? []).length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                  🟢 IDEAL tovarlar ({(umumiy.ideal_tovarlar ?? []).length} ta) — doim qoldiqda bo'lsin
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(umumiy.ideal_tovarlar ?? []).slice(0, 10).map((t: any) => (
                    <Badge key={t.tovar_id} variant="secondary" className="text-[11px]">
                      {t.nomi}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(umumiy.xavfli_tovarlar ?? []).length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-2">
                  🔴 XAVFLI tovarlar ({(umumiy.xavfli_tovarlar ?? []).length} ta) — ortiqcha qoldiq saqlamang
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(umumiy.xavfli_tovarlar ?? []).slice(0, 10).map((t: any) => (
                    <Badge key={t.tovar_id} variant="secondary" className="text-[11px]">
                      {t.nomi}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !error && tovarlar.length === 0 && (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-12 text-center">
            <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-foreground">
              {locale === "uz" ? "Ma'lumot yetarli emas" : "Недостаточно данных"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "uz"
                ? "ABC-XYZ matritsa qurilishi uchun kamida 2 haftalik sotuv kerak"
                : "Для построения матрицы нужны данные минимум за 2 недели"}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
