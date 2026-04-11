"use client"

/**
 * PnLReport — profit & loss statement, SalesDoc-inspired "finans" page.
 *
 * Pure Claude (no v0 round) — using the patterns established in the
 * previous 5 pipeline components. Maps directly onto SavdoAI's
 * financial_statements.foyda_zarar() backend helper.
 */

import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, DollarSign, Minus, Plus,
  ArrowDownRight, ArrowUpRight, PieChart, Receipt,
  type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface PnLData {
  davr_nomi?: string          // e.g. "Aprel 2026" / "Oxirgi 30 kun"
  tushum: number              // revenue
  tannarx: number             // COGS
  yalpi_foyda: number         // gross profit
  operatsion_xarajatlar: number
  sof_foyda: number           // net profit
  qaytarishlar?: number       // returns
  chegirmalar?: number        // discounts
  // Optional per-category breakdown
  xarajat_kategoriyalar?: Array<{ nomi: string; summa: number }>
  // Comparison vs previous period
  prev?: {
    tushum: number
    sof_foyda: number
  }
}

interface PnLReportProps {
  data: PnLData
  className?: string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:           "Foyda-Zarar Hisoboti (P&L)",
    tushum:          "Sotuv tushumi",
    tannarx:         "Tovar tannarxi (COGS)",
    yalpi:           "Yalpi foyda",
    yalpi_foiz:      "Yalpi marja",
    op_xarajatlar:   "Operatsion xarajatlar",
    sof_foyda:       "SOF FOYDA",
    sof_foiz:        "Sof marja",
    qaytarishlar:    "Qaytarishlar",
    chegirmalar:     "Chegirmalar",
    xar_kategoriya:  "Xarajat tuzilmasi",
    vs_prev:         "o'tgan davrga",
    none:            "Ma'lumot yo'q",
  },
  ru: {
    title:           "Отчёт о прибылях и убытках (P&L)",
    tushum:          "Выручка",
    tannarx:         "Себестоимость",
    yalpi:           "Валовая прибыль",
    yalpi_foiz:      "Валовая маржа",
    op_xarajatlar:   "Операционные расходы",
    sof_foyda:       "ЧИСТАЯ ПРИБЫЛЬ",
    sof_foiz:        "Чистая маржа",
    qaytarishlar:    "Возвраты",
    chegirmalar:     "Скидки",
    xar_kategoriya:  "Структура расходов",
    vs_prev:         "к прошлому периоду",
    none:            "Нет данных",
  },
}

// ─── Formatter ──────────────────────────────────────────────

function formatUzs(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt = new Intl.NumberFormat(intl, { maximumFractionDigits: 1 })
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (abs >= 1_000_000_000) return `${sign}${fmt.format(abs / 1_000_000_000)} mlrd so'm`
  if (abs >= 1_000_000)     return `${sign}${fmt.format(abs / 1_000_000)} mln so'm`
  if (abs >= 10_000)        return `${sign}${fmt.format(abs / 1_000)} ming so'm`
  return `${sign}${new Intl.NumberFormat(intl).format(abs)} so'm`
}

function pct(n: number, base: number): number {
  if (base <= 0) return 0
  return Math.round((n / base) * 1000) / 10
}

function delta(a: number, b: number): number {
  if (b === 0) return 0
  return Math.round(((a - b) / Math.abs(b)) * 1000) / 10
}

// ─── Line row ───────────────────────────────────────────────

interface LineRowProps {
  label:   string
  value:   number
  lang:    Lang
  icon?:   LucideIcon
  tone?:   "positive" | "negative" | "neutral" | "emphasis"
  indent?: boolean
  subline?: string
}

function LineRow({
  label, value, lang, icon: Icon, tone = "neutral", indent, subline,
}: LineRowProps) {
  const toneClass =
    tone === "positive" ? "text-emerald-600 dark:text-emerald-400" :
    tone === "negative" ? "text-rose-600 dark:text-rose-400" :
    tone === "emphasis" ? "text-foreground font-bold text-base" :
                          "text-foreground"
  return (
    <div className={cn(
      "flex items-center justify-between py-3 border-b border-border/40 last:border-0",
      indent && "pl-6",
      tone === "emphasis" && "bg-muted/30 rounded-xl px-4 border-border/60",
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <div className={cn(
            "p-1.5 rounded-lg ring-1 ring-border/60 shrink-0",
            tone === "positive" ? "bg-emerald-500/10 text-emerald-500" :
            tone === "negative" ? "bg-rose-500/10 text-rose-500" :
                                  "bg-muted text-muted-foreground",
          )}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="min-w-0">
          <p className={cn(
            "truncate",
            tone === "emphasis" ? "text-sm font-bold" : "text-sm font-medium text-foreground",
          )}>
            {label}
          </p>
          {subline && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subline}</p>
          )}
        </div>
      </div>
      <p className={cn("text-sm tabular-nums font-semibold shrink-0", toneClass)}>
        {formatUzs(value, lang)}
      </p>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────

export default function PnLReport({ data, className }: PnLReportProps) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const yalpiMarja = pct(data.yalpi_foyda, data.tushum)
  const sofMarja   = pct(data.sof_foyda, data.tushum)

  const revDelta   = data.prev ? delta(data.tushum, data.prev.tushum) : 0
  const profitDelta = data.prev ? delta(data.sof_foyda, data.prev.sof_foyda) : 0

  const isProfit = data.sof_foyda >= 0

  // Xarajat breakdown (optional)
  const totalOpX = data.operatsion_xarajatlar || 0
  const categories = data.xarajat_kategoriyalar ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm",
        className,
      )}
    >
      {/* Accent halo */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br",
          isProfit
            ? "from-emerald-500/30 via-emerald-500/5 to-transparent"
            : "from-rose-500/30 via-rose-500/5 to-transparent",
        )}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 p-5 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "p-2.5 rounded-xl ring-1",
            isProfit
              ? "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30"
              : "bg-rose-500/15 text-rose-500 ring-rose-500/30",
          )}>
            <PieChart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{L.title}</h2>
            {data.davr_nomi && (
              <p className="text-xs text-muted-foreground mt-0.5">{data.davr_nomi}</p>
            )}
          </div>
        </div>
        {data.prev && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.vs_prev}
            </p>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-bold mt-0.5",
              profitDelta >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}>
              {profitDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {profitDelta >= 0 ? "+" : ""}{profitDelta}%
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative p-5 space-y-1">
        <LineRow
          label={L.tushum}
          value={data.tushum}
          lang={lang}
          icon={Plus}
          tone="positive"
          subline={data.prev ? `${revDelta >= 0 ? "+" : ""}${revDelta}% ${L.vs_prev}` : undefined}
        />
        {!!data.qaytarishlar && (
          <LineRow
            label={L.qaytarishlar}
            value={-data.qaytarishlar}
            lang={lang}
            icon={ArrowDownRight}
            tone="negative"
            indent
          />
        )}
        {!!data.chegirmalar && (
          <LineRow
            label={L.chegirmalar}
            value={-data.chegirmalar}
            lang={lang}
            icon={Receipt}
            tone="negative"
            indent
          />
        )}
        <LineRow
          label={L.tannarx}
          value={-data.tannarx}
          lang={lang}
          icon={Minus}
          tone="negative"
        />
        <LineRow
          label={L.yalpi}
          value={data.yalpi_foyda}
          lang={lang}
          tone="emphasis"
          subline={`${L.yalpi_foiz}: ${yalpiMarja}%`}
        />
        <LineRow
          label={L.op_xarajatlar}
          value={-data.operatsion_xarajatlar}
          lang={lang}
          icon={ArrowUpRight}
          tone="negative"
        />

        {/* Category breakdown */}
        {categories.length > 0 && totalOpX > 0 && (
          <div className="mt-2 mb-3 pl-4 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.xar_kategoriya}
            </p>
            {categories.map((c, i) => {
              const p = pct(c.summa, totalOpX)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{c.nomi}</span>
                    <span className="tabular-nums text-foreground font-medium">
                      {formatUzs(c.summa, lang)} <span className="text-muted-foreground">({p}%)</span>
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500/80 to-rose-500/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${p}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <LineRow
          label={L.sof_foyda}
          value={data.sof_foyda}
          lang={lang}
          tone="emphasis"
          subline={`${L.sof_foiz}: ${sofMarja}%`}
        />
      </div>
    </motion.div>
  )
}
