"use client"

/**
 * DebtorsList — aging-bucketed debtors list.
 *
 * SalesDoc /clients/finans/report equivalent with an aging ladder
 * (0-7 days, 8-30, 31-90, 90+), sort + bucket filter + call link.
 */

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle, Phone, CalendarDays, TrendingDown, Users,
  Clock, type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface DebtorRow {
  klient_id:       number
  klient_ismi:     string
  telefon?:        string
  joriy_qarz:      number          // total outstanding (UZS)
  kredit_limit:    number
  qarz_soni:       number          // number of open debts
  eng_eski_muddat?: string         // ISO date of oldest debt due
  oxirgi_tolov?:   string          // ISO date of last payment
}

interface Props {
  debtors: DebtorRow[]
  onCallClick?:  (id: number) => void
  onRowClick?:   (id: number) => void
  className?:    string
}

type Lang = "uz" | "ru"
type BucketKey = "all" | "fresh" | "warn" | "bad" | "critical"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:       "Qarzdorlar ro'yxati",
    subtitle:    "Muddati bo'yicha guruhlash",
    total_debt:  "Jami qarz",
    total_count: "Qarzdorlar",
    all:         "Barchasi",
    fresh:       "0-7 kun",
    warn:        "8-30 kun",
    bad:         "31-90 kun",
    critical:    "90+ kun",
    call:        "Qo'ng'iroq",
    empty:       "Qarzdorlar yo'q",
    empty_hint:  "Hamma mijozlar o'z vaqtida to'lagan",
    n_debts:     (n: number) => `${n} ta qarz`,
    no_limit:    "limitdan tashqarida",
    days_overdue: (n: number) => `${n} kun o'tgan`,
    last_paid:   "oxirgi to'lov",
    never:       "yo'q",
  },
  ru: {
    title:       "Должники",
    subtitle:    "Группировка по срокам",
    total_debt:  "Общий долг",
    total_count: "Должников",
    all:         "Все",
    fresh:       "0-7 дн",
    warn:        "8-30 дн",
    bad:         "31-90 дн",
    critical:    "90+ дн",
    call:        "Позвонить",
    empty:       "Должников нет",
    empty_hint:  "Все клиенты платят вовремя",
    n_debts:     (n: number) => `${n} долгов`,
    no_limit:    "превышен лимит",
    days_overdue: (n: number) => `просрочено ${n} дн`,
    last_paid:   "последний платёж",
    never:       "нет",
  },
}

// ─── Formatters ─────────────────────────────────────────────

function formatUzs(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt = new Intl.NumberFormat(intl, { maximumFractionDigits: 1 })
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${fmt.format(amount / 1_000_000_000)} mlrd so'm`
  if (abs >= 1_000_000)     return `${fmt.format(amount / 1_000_000)} mln so'm`
  if (abs >= 10_000)        return `${fmt.format(amount / 1_000)} ming so'm`
  return `${new Intl.NumberFormat(intl).format(amount)} so'm`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

function daysSince(iso: string | undefined): number {
  if (!iso) return 0
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

// Age buckets in days
function bucketOf(daysOverdue: number): Exclude<BucketKey, "all"> {
  if (daysOverdue > 90)  return "critical"
  if (daysOverdue > 30)  return "bad"
  if (daysOverdue > 7)   return "warn"
  return "fresh"
}

interface BucketMeta {
  tone:   string
  bar:    string
  Icon:   LucideIcon
  ring:   string
}

const BUCKET_META: Record<Exclude<BucketKey, "all">, BucketMeta> = {
  fresh: {
    tone: "text-emerald-700 dark:text-emerald-300",
    bar:  "bg-emerald-500/80",
    Icon: Clock,
    ring: "ring-emerald-500/30 bg-emerald-500/15",
  },
  warn: {
    tone: "text-amber-700 dark:text-amber-300",
    bar:  "bg-amber-500/80",
    Icon: CalendarDays,
    ring: "ring-amber-500/30 bg-amber-500/15",
  },
  bad: {
    tone: "text-orange-700 dark:text-orange-300",
    bar:  "bg-orange-500/80",
    Icon: TrendingDown,
    ring: "ring-orange-500/30 bg-orange-500/15",
  },
  critical: {
    tone: "text-rose-700 dark:text-rose-300",
    bar:  "bg-rose-500/80",
    Icon: AlertTriangle,
    ring: "ring-rose-500/30 bg-rose-500/15",
  },
}

// ─── Chip ───────────────────────────────────────────────────

interface ChipProps {
  label:   string
  count:   number
  active:  boolean
  tone?:   BucketMeta | null
  onClick: () => void
}
function Chip({ label, count, active, tone, onClick }: ChipProps) {
  const activeClass = tone
    ? cn(tone.ring, tone.tone, "ring-1 shadow-sm")
    : "bg-primary text-primary-foreground border-primary shadow-sm"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all",
        active
          ? activeClass
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card",
      )}
    >
      {tone && <tone.Icon className="w-3 h-3" />}
      {label}
      <span className={cn(
        "inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-semibold",
        active ? "bg-white/20 text-current" : "bg-muted text-muted-foreground",
      )}>
        {count}
      </span>
    </button>
  )
}

// ─── Row ────────────────────────────────────────────────────

interface RowProps {
  debtor:       DebtorRow
  lang:         Lang
  index:        number
  onCallClick?: (id: number) => void
  onRowClick?:  (id: number) => void
}

function DebtorRowItem({ debtor: d, lang, index, onCallClick, onRowClick }: RowProps) {
  const L = LABELS[lang]
  const daysOverdue = daysSince(d.eng_eski_muddat)
  const bucket = bucketOf(daysOverdue)
  const meta = BUCKET_META[bucket]
  const limitPct = d.kredit_limit > 0
    ? Math.min(200, Math.round((d.joriy_qarz / d.kredit_limit) * 100))
    : 0
  const overLimit = limitPct > 100

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (d.telefon && typeof window !== "undefined") {
      window.location.href = `tel:${d.telefon}`
    }
    onCallClick?.(d.klient_id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      onClick={() => onRowClick?.(d.klient_id)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        onRowClick && "cursor-pointer",
      )}
    >
      {/* Halo */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-50 bg-gradient-to-br",
          bucket === "critical" ? "from-rose-500/30"   :
          bucket === "bad"      ? "from-orange-500/30" :
          bucket === "warn"     ? "from-amber-500/20"  :
                                  "from-emerald-500/15",
          "via-transparent to-transparent",
        )}
      />

      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-11 h-11 rounded-2xl ring-1 flex items-center justify-center font-bold text-foreground shrink-0",
          meta.ring,
        )}>
          {initials(d.klient_ismi)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {d.klient_ismi}
            </p>
            <span className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0 text-[10px] font-semibold ring-1",
              meta.ring, meta.tone,
            )}>
              <meta.Icon className="w-2.5 h-2.5" />
              {daysOverdue > 0 ? L.days_overdue(daysOverdue) : L.n_debts(d.qarz_soni)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{L.n_debts(d.qarz_soni)}</span>
            {d.oxirgi_tolov ? (
              <span>{L.last_paid}: {daysSince(d.oxirgi_tolov)} kun</span>
            ) : (
              <span>{L.last_paid}: {L.never}</span>
            )}
          </div>
          {/* Limit bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                overLimit ? "bg-rose-500" : meta.bar,
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(limitPct, 100)}%` }}
              transition={{ duration: 0.6, delay: index * 0.03 + 0.1 }}
            />
          </div>
        </div>

        {/* Debt amount + action */}
        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <p className={cn("text-base font-bold tabular-nums", meta.tone)}>
            {formatUzs(d.joriy_qarz, lang)}
          </p>
          {overLimit && (
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">
              ⚠ {L.no_limit}
            </span>
          )}
          {d.telefon && (
            <button
              type="button"
              onClick={handleCall}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
            >
              <Phone className="w-3 h-3" />
              {L.call}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ───────────────────────────────────────────────────

export default function DebtorsList({
  debtors,
  onCallClick,
  onRowClick,
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [active, setActive] = useState<BucketKey>("all")

  // Pre-compute bucket per debtor
  const enriched = useMemo(
    () => debtors.map(d => ({
      ...d,
      _days:   daysSince(d.eng_eski_muddat),
      _bucket: bucketOf(daysSince(d.eng_eski_muddat)),
    })),
    [debtors],
  )

  const counts = useMemo(() => {
    const base = { all: enriched.length, fresh: 0, warn: 0, bad: 0, critical: 0 }
    for (const d of enriched) base[d._bucket] += 1
    return base
  }, [enriched])

  const filtered = useMemo(
    () => active === "all"
      ? [...enriched].sort((a, b) => b._days - a._days)
      : enriched.filter(d => d._bucket === active).sort((a, b) => b.joriy_qarz - a.joriy_qarz),
    [enriched, active],
  )

  const totalDebt = enriched.reduce((s, d) => s + d.joriy_qarz, 0)

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">{L.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.total_debt}
            </p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              {formatUzs(totalDebt, lang)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.total_count}
            </p>
            <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
              {enriched.length}
            </p>
          </div>
        </div>
      </div>

      {/* Buckets */}
      <div className="flex gap-2 flex-wrap">
        <Chip
          label={L.all}
          count={counts.all}
          active={active === "all"}
          onClick={() => setActive("all")}
        />
        <Chip label={L.fresh}    count={counts.fresh}    active={active === "fresh"}    tone={BUCKET_META.fresh}    onClick={() => setActive("fresh")} />
        <Chip label={L.warn}     count={counts.warn}     active={active === "warn"}     tone={BUCKET_META.warn}     onClick={() => setActive("warn")} />
        <Chip label={L.bad}      count={counts.bad}      active={active === "bad"}      tone={BUCKET_META.bad}      onClick={() => setActive("bad")} />
        <Chip label={L.critical} count={counts.critical} active={active === "critical"} tone={BUCKET_META.critical} onClick={() => setActive("critical")} />
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((d, i) => (
            <DebtorRowItem
              key={d.klient_id}
              debtor={d}
              lang={lang}
              index={i}
              onCallClick={onCallClick}
              onRowClick={onRowClick}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center"
        >
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/15 mb-3">
            <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-foreground">{L.empty}</p>
          <p className="text-xs text-muted-foreground mt-1">{L.empty_hint}</p>
        </motion.div>
      )}
    </div>
  )
}
