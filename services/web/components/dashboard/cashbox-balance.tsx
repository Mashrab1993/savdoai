"use client"

/**
 * CashboxBalance — cash register balance + recent cashflow feed.
 *
 * SalesDoc /clients/finans/cashboxBalans equivalent. Shows:
 *   - 3 balance tiles: Cash / Card / Transfer (per method)
 *   - Total pill with delta vs yesterday
 *   - Recent operations stream (kirim/chiqim/tuzatish)
 *   - Net flow (income - outcome)
 */

import { motion } from "framer-motion"
import {
  Wallet, CreditCard, Landmark, ArrowDownCircle, ArrowUpCircle,
  Receipt, TrendingUp, TrendingDown, Calculator,
  type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export type CashFlowType = "kirim" | "chiqim" | "tuzatish"

export interface CashflowOp {
  id:     number
  turi:   CashFlowType
  usul:   "naqd" | "karta" | "hisob"   // method
  summa:  number
  izoh?:  string
  sana:   string    // ISO
}

export interface CashboxBalanceData {
  naqd:     number
  karta:    number
  hisob:    number
  jami:     number
  bugun_kirim:    number
  bugun_chiqim:   number
  sof_oqim_prev?: number
  ops:       CashflowOp[]
}

interface Props {
  data:      CashboxBalanceData
  className?: string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:        "Kassa holati",
    subtitle:     "Bugungi aylanma va balans",
    naqd:         "Naqd",
    karta:        "Plastik karta",
    hisob:        "Bank o'tkazma",
    jami:         "Jami kassa",
    kirim:        "Kirim",
    chiqim:       "Chiqim",
    sof_oqim:     "Sof oqim",
    vs_prev:      "kechadan",
    recent:       "Oxirgi operatsiyalar",
    empty:        "Operatsiyalar yo'q",
    today:        "bugun",
    yesterday:    "kecha",
    days_ago:     (n: number) => `${n} kun oldin`,
    turi: {
      kirim:    "Kirim",
      chiqim:   "Chiqim",
      tuzatish: "Tuzatish",
    },
  },
  ru: {
    title:        "Состояние кассы",
    subtitle:     "Баланс и оборот за день",
    naqd:         "Наличные",
    karta:        "Банковская карта",
    hisob:        "Банковский перевод",
    jami:         "Всего в кассе",
    kirim:        "Приход",
    chiqim:       "Расход",
    sof_oqim:     "Чистый поток",
    vs_prev:      "ко вчера",
    recent:       "Последние операции",
    empty:        "Операций нет",
    today:        "сегодня",
    yesterday:    "вчера",
    days_ago:     (n: number) => `${n} дн назад`,
    turi: {
      kirim:    "Приход",
      chiqim:   "Расход",
      tuzatish: "Корректировка",
    },
  },
}

// ─── Formatters ─────────────────────────────────────────────

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

function relTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const mins = (Date.now() - d.getTime()) / 60_000
  if (mins < 1)    return LABELS[lang].today
  if (mins < 60)   return `${Math.floor(mins)} ${lang === "ru" ? "мин" : "daq"}`
  if (mins < 1440) return `${Math.floor(mins / 60)} ${lang === "ru" ? "ч" : "soat"}`
  const days = Math.floor(mins / 1440)
  if (days === 1) return LABELS[lang].yesterday
  return LABELS[lang].days_ago(days)
}

// ─── Balance tile ───────────────────────────────────────────

interface TileProps {
  label: string
  value: string
  Icon:  LucideIcon
  tone:  "emerald" | "blue" | "violet"
  delay: number
}

function Tile({ label, value, Icon, tone, delay }: TileProps) {
  const toneClass = {
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
    blue:    "bg-blue-500/15    text-blue-600    dark:text-blue-400    ring-blue-500/30",
    violet:  "bg-violet-500/15  text-violet-600  dark:text-violet-400  ring-violet-500/30",
  }[tone]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl"
    >
      <div className={cn("p-2 rounded-xl ring-1 shrink-0", toneClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground mt-1 truncate tabular-nums">
          {value}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Op row ─────────────────────────────────────────────────

function OpRow({ op, lang, index }: { op: CashflowOp; lang: Lang; index: number }) {
  const L = LABELS[lang]
  const isKirim = op.turi === "kirim"
  const isChiqim = op.turi === "chiqim"
  const Icon = isKirim ? ArrowDownCircle : isChiqim ? ArrowUpCircle : Receipt
  const tone = isKirim
    ? "text-emerald-600 dark:text-emerald-400"
    : isChiqim
      ? "text-rose-600 dark:text-rose-400"
      : "text-slate-600 dark:text-slate-400"
  const iconBg = isKirim
    ? "bg-emerald-500/15 ring-emerald-500/30"
    : isChiqim
      ? "bg-rose-500/15 ring-rose-500/30"
      : "bg-slate-500/15 ring-slate-500/30"
  const sign = isKirim ? "+" : isChiqim ? "-" : ""
  const methodLabel: Record<CashflowOp["usul"], string> = {
    naqd:  L.naqd,
    karta: L.karta,
    hisob: L.hisob,
  }
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className={cn("p-1.5 rounded-lg ring-1 shrink-0", iconBg, tone)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-foreground truncate">
            {L.turi[op.turi]}
          </p>
          <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-1.5 py-0 text-[10px]">
            {methodLabel[op.usul]}
          </span>
        </div>
        {op.izoh && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{op.izoh}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">{relTime(op.sana, lang)}</p>
      </div>
      <div className={cn("text-sm font-bold tabular-nums shrink-0", tone)}>
        {sign}{formatUzs(Math.abs(op.summa), lang)}
      </div>
    </motion.li>
  )
}

// ─── Main ───────────────────────────────────────────────────

export default function CashboxBalance({ data, className }: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const sofOqim = data.bugun_kirim - data.bugun_chiqim
  const delta = data.sof_oqim_prev !== undefined
    ? Math.round(
        data.sof_oqim_prev === 0
          ? 0
          : ((sofOqim - data.sof_oqim_prev) / Math.abs(data.sof_oqim_prev)) * 100,
      )
    : null
  const isUp = sofOqim >= 0

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
        className={cn(
          "pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl bg-gradient-to-br",
          isUp
            ? "from-emerald-500/30 via-emerald-500/5 to-transparent"
            : "from-rose-500/30 via-rose-500/5 to-transparent",
        )}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-4 p-5 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "p-2.5 rounded-xl ring-1",
            isUp
              ? "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30"
              : "bg-rose-500/15 text-rose-500 ring-rose-500/30",
          )}>
            <Calculator className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">{L.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {L.jami}
          </p>
          <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
            {formatUzs(data.jami, lang)}
          </p>
        </div>
      </div>

      {/* Balance tiles */}
      <div className="relative p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tile
          label={L.naqd}
          value={formatUzs(data.naqd, lang)}
          Icon={Wallet}
          tone="emerald"
          delay={0}
        />
        <Tile
          label={L.karta}
          value={formatUzs(data.karta, lang)}
          Icon={CreditCard}
          tone="blue"
          delay={0.05}
        />
        <Tile
          label={L.hisob}
          value={formatUzs(data.hisob, lang)}
          Icon={Landmark}
          tone="violet"
          delay={0.1}
        />
      </div>

      {/* Flow summary */}
      <div className="relative px-5 pb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/25">
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            {L.kirim}
          </p>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200 tabular-nums mt-1">
            +{formatUzs(data.bugun_kirim, lang)}
          </p>
        </div>
        <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/25">
          <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
            {L.chiqim}
          </p>
          <p className="text-sm font-bold text-rose-700 dark:text-rose-200 tabular-nums mt-1">
            -{formatUzs(data.bugun_chiqim, lang)}
          </p>
        </div>
        <div className={cn(
          "rounded-xl p-3 border",
          isUp
            ? "bg-emerald-500/15 border-emerald-500/30"
            : "bg-rose-500/15 border-rose-500/30",
        )}>
          <p className={cn(
            "text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1",
            isUp ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300",
          )}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {L.sof_oqim}
          </p>
          <p className={cn(
            "text-sm font-bold tabular-nums mt-1",
            isUp ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200",
          )}>
            {isUp ? "+" : ""}{formatUzs(sofOqim, lang)}
          </p>
          {delta !== null && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {delta >= 0 ? "+" : ""}{delta}% {L.vs_prev}
            </p>
          )}
        </div>
      </div>

      {/* Recent ops */}
      {data.ops.length > 0 ? (
        <div className="relative px-4 pb-4 border-t border-border/60 pt-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {L.recent}
          </p>
          <ul className="space-y-0.5">
            {data.ops.slice(0, 8).map((op, i) => (
              <OpRow key={op.id} op={op} lang={lang} index={i} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="relative px-4 pb-5 pt-3 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">{L.empty}</p>
        </div>
      )}
    </motion.div>
  )
}
