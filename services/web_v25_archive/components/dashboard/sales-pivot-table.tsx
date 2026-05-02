"use client"

/**
 * SalesPivotTable — pivot-style sales breakdown by a chosen dimension
 * (kategoriya / brend / mijoz / agent / kun / oy).
 *
 * SalesDoc /report/customer equivalent. Shows totals + sparkline-like
 * horizontal bars for visual comparison, sortable columns, top-N
 * highlighting, and a grand total footer.
 */

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart3, ArrowUp, ArrowDown, Trophy, TrendingUp,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export type PivotDimension = "kategoriya" | "brend" | "mijoz" | "agent" | "kun" | "oy"

export interface PivotRow {
  key:        string              // the group label (e.g. "Kimyo", "Mashrab Saidqulov")
  jami:       number              // total sum (UZS)
  soni:       number              // number of orders / records
  miqdor:     number               // total quantity
  prev_jami?: number               // previous period sum (for delta)
}

interface Props {
  title?:     string
  subtitle?:  string
  dimension:  PivotDimension       // used only for the left-column header
  rows:       PivotRow[]
  onRowClick?: (key: string) => void
  className?:  string
}

type Lang = "uz" | "ru"
type SortKey = "jami" | "soni" | "miqdor" | "delta"
type SortDir = "asc" | "desc"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    dimension: {
      kategoriya: "Kategoriya",
      brend:      "Brend",
      mijoz:      "Mijoz",
      agent:      "Agent",
      kun:        "Kun",
      oy:         "Oy",
    },
    col_jami:   "Summa",
    col_soni:   "Zakazlar",
    col_miqdor: "Miqdor",
    col_delta:  "O'zgarish",
    col_share:  "Ulush",
    total:      "Jami",
    grand_total: "Jami hisob",
    empty:      "Ma'lumot yo'q",
  },
  ru: {
    dimension: {
      kategoriya: "Категория",
      brend:      "Бренд",
      mijoz:      "Клиент",
      agent:      "Агент",
      kun:        "День",
      oy:         "Месяц",
    },
    col_jami:   "Сумма",
    col_soni:   "Заказы",
    col_miqdor: "Кол-во",
    col_delta:  "Δ",
    col_share:  "Доля",
    total:      "Итого",
    grand_total: "Всего",
    empty:      "Нет данных",
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

function formatInt(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "uz-UZ").format(n)
}

function delta(curr: number, prev: number | undefined): number | null {
  if (prev === undefined || prev === 0) return null
  return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10
}

// ─── Column header ──────────────────────────────────────────

interface ColHeaderProps {
  label:    string
  sortKey:  SortKey
  active:   SortKey
  dir:      SortDir
  onClick:  (k: SortKey) => void
  align?:   "left" | "right"
}

function ColHeader({ label, sortKey, active, dir, onClick, align = "right" }: ColHeaderProps) {
  const isActive = active === sortKey
  return (
    <th
      className={cn(
        "py-2.5 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground transition-colors",
          isActive && "text-foreground",
        )}
      >
        {label}
        {isActive && (dir === "desc" ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />)}
      </button>
    </th>
  )
}

// ─── Main ───────────────────────────────────────────────────

export default function SalesPivotTable({
  title,
  subtitle,
  dimension,
  rows,
  onRowClick,
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [sortKey, setSortKey] = useState<SortKey>("jami")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const handleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(k)
      setSortDir("desc")
    }
  }

  const maxJami = useMemo(
    () => Math.max(1, ...rows.map(r => r.jami)),
    [rows],
  )

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let diff = 0
      if (sortKey === "delta") {
        const da = delta(a.jami, a.prev_jami) ?? -Infinity
        const db = delta(b.jami, b.prev_jami) ?? -Infinity
        diff = da - db
      } else {
        diff = (a[sortKey] as number) - (b[sortKey] as number)
      }
      return sortDir === "desc" ? -diff : diff
    })
    return copy
  }, [rows, sortKey, sortDir])

  const grandTotal = useMemo(
    () => rows.reduce((s, r) => s + r.jami, 0),
    [rows],
  )
  const grandCount = useMemo(
    () => rows.reduce((s, r) => s + r.soni, 0),
    [rows],
  )

  if (rows.length === 0) {
    return (
      <div className={cn(
        "rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center",
        className,
      )}>
        <div className="inline-flex p-4 rounded-2xl bg-muted mb-3">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">{L.empty}</p>
      </div>
    )
  }

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
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent"
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 p-5 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">
              {title ?? `Sotuv bo'yicha: ${L.dimension[dimension]}`}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {L.grand_total}
          </p>
          <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
            {formatUzs(grandTotal, lang)}
            <span className="text-[11px] text-muted-foreground font-normal ml-1">so'm</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="py-2.5 pl-5 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">
                #
              </th>
              <th className="py-2.5 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">
                {L.dimension[dimension]}
              </th>
              <ColHeader label={L.col_jami}   sortKey="jami"   active={sortKey} dir={sortDir} onClick={handleSort} />
              <ColHeader label={L.col_soni}   sortKey="soni"   active={sortKey} dir={sortDir} onClick={handleSort} />
              <ColHeader label={L.col_miqdor} sortKey="miqdor" active={sortKey} dir={sortDir} onClick={handleSort} />
              <ColHeader label={L.col_delta}  sortKey="delta"  active={sortKey} dir={sortDir} onClick={handleSort} />
              <th className="py-2.5 pl-3 pr-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                {L.col_share}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const share = grandTotal > 0 ? (row.jami / grandTotal) * 100 : 0
              const barPct = (row.jami / maxJami) * 100
              const dlt = delta(row.jami, row.prev_jami)
              const isTop3 = i < 3 && sortDir === "desc" && sortKey === "jami"
              return (
                <motion.tr
                  key={row.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  onClick={() => onRowClick?.(row.key)}
                  className={cn(
                    "border-b border-border/30 hover:bg-muted/50 transition-colors",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  <td className="py-2.5 pl-5 pr-3">
                    {isTop3 ? (
                      <Trophy
                        className={cn(
                          "w-3.5 h-3.5",
                          i === 0 && "text-amber-500",
                          i === 1 && "text-slate-400",
                          i === 2 && "text-orange-500",
                        )}
                      />
                    ) : (
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-sm font-semibold text-foreground truncate block max-w-[240px]">
                      {row.key}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatUzs(row.jami, lang)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatInt(row.soni, lang)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatInt(row.miqdor, lang)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {dlt !== null ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                          dlt >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        <TrendingUp className={cn("w-2.5 h-2.5", dlt < 0 && "rotate-180")} />
                        {dlt >= 0 ? "+" : ""}{dlt}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-3 pr-5">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500/80 to-blue-400/80"
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.02 + 0.15 }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0 w-10 text-right">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/40">
              <td className="py-3 pl-5 pr-3"></td>
              <td className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {L.total} ({rows.length})
              </td>
              <td className="py-3 px-3 text-right text-sm font-bold text-foreground tabular-nums">
                {formatUzs(grandTotal, lang)}
              </td>
              <td className="py-3 px-3 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                {formatInt(grandCount, lang)}
              </td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-3"></td>
              <td className="py-3 pl-3 pr-5 text-right text-xs font-semibold text-muted-foreground">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  )
}
