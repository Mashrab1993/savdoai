"use client"

/**
 * SalesHeatmap — 7×24 activity heatmap showing sales density per
 * hour of each day of the week. Pure CSS grid, no chart library.
 *
 * SalesDoc equivalent: sales activity chart in the analytics pages.
 * Helps answer "when are we busiest" and "when should agents be
 * active" at a glance.
 */

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Flame, type LucideIcon } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

/**
 * 2D array: [dayOfWeek][hour] → number of sales OR total summa.
 * dayOfWeek: 0=Mon, 1=Tue, ..., 6=Sun
 * hour:      0..23
 */
export type HeatmapMatrix = number[][]

interface Props {
  matrix:  HeatmapMatrix        // [7][24]
  metric?: "soni" | "summa"     // what the value represents
  className?: string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:      "Sotuv faolligi",
    subtitle:   "Hafta kuni × soat",
    days:       ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
    full_days:  ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"],
    hours_lbl:  "soat",
    peak:       "Eng faol vaqt",
    quiet:      "Eng bo'sh vaqt",
    legend_less: "kam",
    legend_more: "ko'p",
    soni:       "zakaz",
    summa:      "so'm",
  },
  ru: {
    title:      "Активность продаж",
    subtitle:   "День недели × час",
    days:       ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    full_days:  ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
    hours_lbl:  "час",
    peak:       "Пиковое время",
    quiet:      "Тихое время",
    legend_less: "мало",
    legend_more: "много",
    soni:       "заказов",
    summa:      "сум",
  },
}

// ─── Formatters ─────────────────────────────────────────────

function formatUzs(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt = new Intl.NumberFormat(intl, { maximumFractionDigits: 1 })
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${fmt.format(amount / 1_000_000_000)} mlrd`
  if (abs >= 1_000_000)     return `${fmt.format(amount / 1_000_000)} mln`
  if (abs >= 10_000)        return `${fmt.format(amount / 1_000)} ming`
  return new Intl.NumberFormat(intl).format(amount)
}

// Map [0..1] normalized value → tailwind bg class (no JIT arbitrary
// values to stay Tailwind-v4-safe; we use discrete buckets)
function cellClass(intensity: number): string {
  if (intensity === 0)    return "bg-muted/40"
  if (intensity < 0.15)   return "bg-emerald-500/10"
  if (intensity < 0.30)   return "bg-emerald-500/20"
  if (intensity < 0.45)   return "bg-emerald-500/35"
  if (intensity < 0.60)   return "bg-emerald-500/50"
  if (intensity < 0.75)   return "bg-emerald-500/65"
  if (intensity < 0.90)   return "bg-emerald-500/80"
  return "bg-emerald-500"
}

function cellTextTone(intensity: number): string {
  return intensity > 0.6
    ? "text-white"
    : intensity > 0.3
      ? "text-emerald-900 dark:text-emerald-100"
      : "text-muted-foreground"
}

// ─── Main ───────────────────────────────────────────────────

export default function SalesHeatmap({
  matrix,
  metric = "soni",
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  // Validate shape
  const rows = matrix.length === 7 ? matrix : Array(7).fill(Array(24).fill(0))

  const { max, total, peak, quiet } = useMemo(() => {
    let m = 0, t = 0
    let px = { day: 0, hour: 0, v: 0 }
    let qx = { day: 0, hour: 0, v: Infinity }
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const v = rows[d]?.[h] ?? 0
        if (v > m) m = v
        t += v
        if (v > px.v) px = { day: d, hour: h, v }
        if (v > 0 && v < qx.v) qx = { day: d, hour: h, v }
      }
    }
    if (qx.v === Infinity) qx.v = 0
    return { max: m, total: t, peak: px, quiet: qx }
  }, [rows])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl",
        className,
      )}
    >
      {/* Halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl bg-gradient-to-br from-emerald-500/25 via-emerald-500/5 to-transparent"
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 p-5 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">{L.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
          </div>
        </div>
        {total > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.peak}
            </p>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {L.full_days[peak.day]} · {String(peak.hour).padStart(2, "0")}:00
            </p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="relative p-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels (top) */}
          <div className="flex items-center pl-8">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex-1 min-w-[22px] text-center text-[9px] font-medium text-muted-foreground"
              >
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1 mt-1">
            {rows.map((row, d) => (
              <motion.div
                key={d}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: d * 0.04 }}
                className="flex items-center gap-1"
              >
                <div className="w-8 text-[10px] font-semibold text-muted-foreground text-right pr-1 shrink-0">
                  {L.days[d]}
                </div>
                <div className="flex-1 flex gap-0.5">
                  {Array.from({ length: 24 }, (_, h) => {
                    const v = row[h] ?? 0
                    const intensity = max > 0 ? v / max : 0
                    const fmt = metric === "summa" ? formatUzs(v, lang) : String(v)
                    return (
                      <div
                        key={h}
                        className={cn(
                          "flex-1 min-w-[22px] aspect-square rounded-[4px] flex items-center justify-center text-[8px] font-bold tabular-nums transition-transform hover:scale-110",
                          cellClass(intensity),
                          cellTextTone(intensity),
                        )}
                        title={`${L.full_days[d]} ${String(h).padStart(2, "0")}:00 — ${fmt} ${metric === "summa" ? L.summa : L.soni}`}
                      >
                        {v > 0 && intensity > 0.2 ? (metric === "summa" ? "" : v) : ""}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="relative px-5 pb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{L.legend_less}</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-[3px] bg-muted/40" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500/20" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500/35" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500/50" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500/65" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500/80" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500" />
          </div>
          <span>{L.legend_more}</span>
        </div>
        {total > 0 && (
          <div className="text-[10px] text-muted-foreground">
            {metric === "summa" ? formatUzs(total, lang) + " " + L.summa : total + " " + L.soni}
          </div>
        )}
      </div>
    </motion.div>
  )
}
