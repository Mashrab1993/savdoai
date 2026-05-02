"use client"

/**
 * Premium KPI grid — SalesDoc-inspired layout.
 *
 * Pipeline: v0.dev drafted the skeleton → GPT-5.4 audit (14 issues found) →
 * fixes applied: i18n hook, UZS currency, theme-safe tokens, useId for SVG
 * gradients, no Tailwind theme() arbitrary values, no redundant classes.
 *
 * Usage:
 *   <KpiGridPremium stats={stats} deltas={deltas} />
 */

import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown,
  ShoppingCart, DollarSign, BarChart3, Users, CreditCard,
  Package, Truck, AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { useId } from "react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────

export type SavdoAIMetrics = {
  bugungiSotuv:    number
  haftalikDaromad: number
  oylikFoyda:      number
  faolMijozlar:    number
  qarzlar:         number
  otgruzka:        number
  yetkazildi:      number
  kamQoldiq:       number
}

export type SavdoAIStats  = SavdoAIMetrics
export type SavdoAIDelta  = SavdoAIMetrics

interface KpiGridPremiumProps {
  stats:  SavdoAIStats
  deltas: SavdoAIDelta
  className?: string
}

type CardKey = keyof SavdoAIMetrics

type Labels = Record<CardKey, string>

const LABELS_UZ: Labels = {
  bugungiSotuv:    "Bugungi sotuv",
  haftalikDaromad: "Haftalik daromad",
  oylikFoyda:      "Oylik foyda",
  faolMijozlar:    "Faol mijozlar",
  qarzlar:         "Qarzlar",
  otgruzka:        "Otgruzka",
  yetkazildi:      "Yetkazildi",
  kamQoldiq:       "Kam qoldiq",
}

const LABELS_RU: Labels = {
  bugungiSotuv:    "Продажи сегодня",
  haftalikDaromad: "Доход за неделю",
  oylikFoyda:      "Прибыль за месяц",
  faolMijozlar:    "Активные клиенты",
  qarzlar:         "Долги",
  otgruzka:        "Отгрузка",
  yetkazildi:      "Доставлено",
  kamQoldiq:       "Низкий остаток",
}

interface CardConfig {
  key:       CardKey
  Icon:      LucideIcon
  iconClass: string         // semantic theme-aware tailwind class
  haloClass: string         // gradient halo bucket
  strokeHex: string          // sparkline stroke (works in both themes)
  isCurrency: boolean
  unit?:     string          // non-currency suffix (ta / SKU)
}

// Semantic tokens — work in both light AND dark theme via Tailwind
// default + dark: variants.
const CARDS: CardConfig[] = [
  {
    key: "bugungiSotuv",    Icon: ShoppingCart,
    iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25",
    haloClass: "from-emerald-500/25 via-emerald-500/5 to-transparent",
    strokeHex: "#10b981", isCurrency: true,
  },
  {
    key: "haftalikDaromad", Icon: DollarSign,
    iconClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/25",
    haloClass: "from-blue-500/25 via-blue-500/5 to-transparent",
    strokeHex: "#3b82f6", isCurrency: true,
  },
  {
    key: "oylikFoyda",      Icon: BarChart3,
    iconClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/25",
    haloClass: "from-amber-500/25 via-amber-500/5 to-transparent",
    strokeHex: "#f59e0b", isCurrency: true,
  },
  {
    key: "faolMijozlar",    Icon: Users,
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-violet-500/25",
    haloClass: "from-violet-500/25 via-violet-500/5 to-transparent",
    strokeHex: "#8b5cf6", isCurrency: false, unit: "ta",
  },
  {
    key: "qarzlar",         Icon: CreditCard,
    iconClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/25",
    haloClass: "from-rose-500/25 via-rose-500/5 to-transparent",
    strokeHex: "#f43f5e", isCurrency: true,
  },
  {
    key: "otgruzka",        Icon: Package,
    iconClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-cyan-500/25",
    haloClass: "from-cyan-500/25 via-cyan-500/5 to-transparent",
    strokeHex: "#06b6d4", isCurrency: false, unit: "ta",
  },
  {
    key: "yetkazildi",      Icon: Truck,
    iconClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-orange-500/25",
    haloClass: "from-orange-500/25 via-orange-500/5 to-transparent",
    strokeHex: "#f97316", isCurrency: false, unit: "ta",
  },
  {
    key: "kamQoldiq",       Icon: AlertTriangle,
    iconClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 ring-slate-500/25",
    haloClass: "from-slate-500/20 via-slate-500/5 to-transparent",
    strokeHex: "#64748b", isCurrency: false, unit: "SKU",
  },
]

// ────────────────────────────────────────────────────────────
//  Formatting — locale-aware
// ────────────────────────────────────────────────────────────

function formatValue(
  value: number,
  isCurrency: boolean,
  locale: "uz" | "ru",
  unit?: string,
): { text: string; suffix?: string } {
  const intlLocale = locale === "ru" ? "ru-RU" : "uz-UZ"
  if (isCurrency) {
    // UZS is low-denominator — always use abbreviated form on compact cards
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000) {
      return { text: (value / 1_000_000_000).toFixed(1).replace(/\.0$/, ""), suffix: "mlrd so'm" }
    }
    if (abs >= 1_000_000) {
      return { text: (value / 1_000_000).toFixed(1).replace(/\.0$/, ""), suffix: "mln so'm" }
    }
    if (abs >= 1_000) {
      return { text: (value / 1_000).toFixed(1).replace(/\.0$/, ""), suffix: "ming so'm" }
    }
    return { text: new Intl.NumberFormat(intlLocale).format(value), suffix: "so'm" }
  }
  return {
    text: new Intl.NumberFormat(intlLocale).format(value),
    suffix: unit,
  }
}

// ────────────────────────────────────────────────────────────
//  Sparkline (SVG inline, no library)
//  Fix from audit: use useId() for gradient id — '#' in id was broken.
// ────────────────────────────────────────────────────────────

function Sparkline({
  strokeHex,
  positive,
}: {
  strokeHex: string
  positive: boolean
}) {
  const rawId = useId()
  const gradId = `spark-${rawId.replace(/:/g, "")}`

  const points = positive
    ? [28, 22, 26, 18, 20, 14, 16, 10, 13, 8, 10, 6]
    : [6, 10, 8, 14, 10, 16, 12, 20, 14, 22, 18, 26]

  const w = 80, h = 32
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map(v => h - (v / 30) * h + 2)
  const line = `M ${xs[0]} ${ys[0]} ` +
    xs.slice(1).map((x, i) => `L ${x} ${ys[i + 1]}`).join(" ")
  const fill = line +
    ` L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-20 h-8"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeHex} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeHex} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={strokeHex}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ────────────────────────────────────────────────────────────
//  Individual KPI card
// ────────────────────────────────────────────────────────────

interface KpiCardProps {
  config:   CardConfig
  value:    number
  delta:    number
  label:    string
  index:    number
  locale:   "uz" | "ru"
}

function KpiCard({ config, value, delta, label, index, locale }: KpiCardProps) {
  const { Icon, iconClass, haloClass, strokeHex, isCurrency, unit } = config
  const formatted = formatValue(value, isCurrency, locale, unit)
  const isPositive = delta >= 0
  const DeltaIcon  = isPositive ? TrendingUp : TrendingDown
  const deltaColor = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400"
  const periodCaption = locale === "ru" ? "к прошлому периоду" : "o'tgan davrga"

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.04,
      }}
      whileHover={{ y: -2 }}
      aria-label={`${label} ${formatted.text} ${formatted.suffix ?? ""} ${isPositive ? "+" : ""}${delta}%`}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3",
        "bg-card/60 backdrop-blur-xl border border-border/60",
        "shadow-sm hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300",
      )}
    >
      {/* Gradient halo blob */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity bg-gradient-to-br",
          haloClass,
        )}
      />

      {/* Top row: label + icon */}
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase leading-none pt-0.5">
          {label}
        </p>
        <span className={cn("flex-shrink-0 rounded-xl p-2 ring-1 transition-colors duration-200", iconClass)}>
          <Icon size={16} strokeWidth={1.75} />
        </span>
      </div>

      {/* Big number */}
      <div className="relative">
        <p className="text-2xl font-bold tracking-tight text-foreground leading-none tabular-nums">
          {formatted.text}
          {formatted.suffix && (
            <span className="text-xs font-medium text-muted-foreground ml-1">
              {formatted.suffix}
            </span>
          )}
        </p>
      </div>

      {/* Delta + sparkline row */}
      <div className="relative flex items-end justify-between mt-auto">
        <div className={cn("flex items-center gap-1", deltaColor)}>
          <DeltaIcon size={13} strokeWidth={2.5} />
          <span className="text-xs font-semibold tabular-nums">
            {isPositive ? "+" : ""}
            {delta}%
          </span>
          <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
            {periodCaption}
          </span>
        </div>
        <Sparkline strokeHex={strokeHex} positive={isPositive} />
      </div>
    </motion.article>
  )
}

// ────────────────────────────────────────────────────────────
//  Main export
// ────────────────────────────────────────────────────────────

export default function KpiGridPremium({
  stats,
  deltas,
  className,
}: KpiGridPremiumProps) {
  const { locale } = useLocale()
  const lang = locale === "ru" ? "ru" : "uz"
  const labels = lang === "ru" ? LABELS_RU : LABELS_UZ
  const intlLocale = lang === "ru" ? "ru-RU" : "uz-UZ"

  return (
    <section
      aria-label={lang === "ru" ? "KPI показатели" : "KPI ko'rsatkichlari"}
      className={cn("w-full", className)}
    >
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground tracking-wide">
            {lang === "ru" ? "Сегодняшний отчёт" : "Bugungi hisobot"}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(intlLocale, {
              weekday: "long",
              year:    "numeric",
              month:   "long",
              day:     "numeric",
            })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          {lang === "ru" ? "Онлайн" : "Jonli"}
        </span>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {CARDS.map((config, i) => (
          <KpiCard
            key={config.key}
            config={config}
            value={stats[config.key]}
            delta={deltas[config.key]}
            label={labels[config.key]}
            index={i}
            locale={lang}
          />
        ))}
      </div>
    </section>
  )
}
