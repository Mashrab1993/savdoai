"use client"

/**
 * SupplierBalance — supplier accounts panel.
 *
 * SalesDoc /clients/shipperFinans equivalent. Shows each supplier
 * with their current debt to us, last delivery, credit terms, and
 * a mini stats strip (total purchased, avg invoice, active orders).
 */

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Truck, Phone, Calendar, TrendingUp, TrendingDown,
  AlertCircle, Search, Building2, type LucideIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface SupplierRow {
  id:            number
  nomi:          string
  telefon?:      string
  kategoriya?:   string          // e.g. "Kimyo", "Ichimlik"
  balans:        number          // + = we owe them, - = they owe us (overpaid)
  jami_xarid:    number          // lifetime purchases
  aktiv_buyurtma: number         // active orders count
  oxirgi_kirim?: string          // ISO last delivery
  kredit_muddat_kun?: number     // credit term in days
}

interface Props {
  suppliers:   SupplierRow[]
  onCall?:     (id: number) => void
  onRowClick?: (id: number) => void
  className?:  string
}

type Lang = "uz" | "ru"
type FilterKey = "all" | "qarzimiz_bor" | "sof" | "overdue"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:          "Yetkazib beruvchilar",
    subtitle:       "Balans va hamkorlik",
    search_ph:      "Nom, telefon yoki kategoriya…",
    total_debt:     "Jami qarz",
    suppliers_cnt:  "Ta'minotchilar",
    active_orders:  "Aktiv buyurtmalar",
    all:            "Barchasi",
    qarzdor:        "Qarzimiz bor",
    sof:            "Sof",
    overdue:        "Muddati o'tgan",
    balans:         "Balans",
    lifetime:       "Jami xarid",
    last_delivery:  "Oxirgi kirim",
    credit_term:    "Kredit muddati",
    orders_open:    "aktiv buyurtma",
    days:           "kun",
    no_suppliers:   "Yetkazib beruvchilar yo'q",
    never:          "yo'q",
    days_ago:       (n: number) => `${n} kun oldin`,
    today:          "bugun",
    call:           "Qo'ng'iroq",
  },
  ru: {
    title:          "Поставщики",
    subtitle:       "Баланс и партнёрство",
    search_ph:      "Название, телефон, категория…",
    total_debt:     "Общий долг",
    suppliers_cnt:  "Поставщики",
    active_orders:  "Активные заказы",
    all:            "Все",
    qarzdor:        "Мы должны",
    sof:            "Без долга",
    overdue:        "Просроченные",
    balans:         "Баланс",
    lifetime:       "Всего закупок",
    last_delivery:  "Последняя поставка",
    credit_term:    "Срок кредита",
    orders_open:    "активных заказов",
    days:           "дн",
    no_suppliers:   "Поставщиков нет",
    never:          "нет",
    days_ago:       (n: number) => `${n} дн назад`,
    today:          "сегодня",
    call:           "Позвонить",
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

// ─── Chip ───────────────────────────────────────────────────

interface ChipProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
  tone?: "default" | "rose" | "emerald" | "amber"
}

function Chip({ label, count, active, onClick, tone = "default" }: ChipProps) {
  const activeClass = {
    default: "bg-primary text-primary-foreground border-primary",
    rose:    "bg-rose-500 text-white border-rose-500",
    emerald: "bg-emerald-500 text-white border-emerald-500",
    amber:   "bg-amber-500 text-white border-amber-500",
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
        active
          ? cn(activeClass, "shadow-sm")
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground",
      )}
    >
      {label}
      <span className={cn(
        "inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-semibold",
        active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
      )}>
        {count}
      </span>
    </button>
  )
}

// ─── Row ────────────────────────────────────────────────────

interface RowProps {
  supplier:  SupplierRow
  lang:      Lang
  index:     number
  onCall?:   (id: number) => void
  onClick?:  (id: number) => void
}

function Row({ supplier: s, lang, index, onCall, onClick }: RowProps) {
  const L = LABELS[lang]
  const isDebt = s.balans > 0
  const isOverpaid = s.balans < 0
  const lastDelivDays = daysSince(s.oxirgi_kirim)
  const overdue = isDebt && s.kredit_muddat_kun !== undefined && lastDelivDays > s.kredit_muddat_kun

  const toneClass = overdue
    ? "text-rose-600 dark:text-rose-400"
    : isDebt
      ? "text-amber-600 dark:text-amber-400"
      : isOverpaid
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground"

  const ringClass = overdue
    ? "ring-rose-500/30 bg-rose-500/15"
    : isDebt
      ? "ring-amber-500/30 bg-amber-500/15"
      : "ring-emerald-500/30 bg-emerald-500/15"

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (s.telefon && typeof window !== "undefined") {
      window.location.href = `tel:${s.telefon}`
    }
    onCall?.(s.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      onClick={() => onClick?.(s.id)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4",
        "shadow-sm hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-12 h-12 rounded-2xl ring-1 flex items-center justify-center shrink-0",
          ringClass,
        )}>
          <Building2 className={cn("w-5 h-5", toneClass)} />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{s.nomi}</p>
            {s.kategoriya && (
              <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-1.5 py-0 text-[10px] shrink-0">
                {s.kategoriya}
              </span>
            )}
            {overdue && (
              <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 shrink-0">
                <AlertCircle className="w-2.5 h-2.5" />
                {L.overdue}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {s.oxirgi_kirim
                ? (lastDelivDays === 0 ? L.today : L.days_ago(lastDelivDays))
                : L.never}
            </span>
            <span>{s.aktiv_buyurtma} {L.orders_open}</span>
            {s.kredit_muddat_kun !== undefined && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {s.kredit_muddat_kun} {L.days}
              </span>
            )}
          </div>
        </div>

        {/* Balance + lifetime + call */}
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <p className={cn("text-base font-bold tabular-nums", toneClass)}>
            {isDebt && "-"}
            {isOverpaid && "+"}
            {formatUzs(Math.abs(s.balans), lang)}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {L.lifetime}: {formatUzs(s.jami_xarid, lang)}
          </p>
          {s.telefon && (
            <button
              type="button"
              onClick={handleCall}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors mt-0.5"
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

export default function SupplierBalance({
  suppliers,
  onCall,
  onRowClick,
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [search, setSearch] = useState("")
  const [active, setActive] = useState<FilterKey>("all")

  const counts = useMemo(() => {
    let qarzdor = 0, sof = 0, overdue = 0
    for (const s of suppliers) {
      if (s.balans > 0) {
        qarzdor += 1
        if (
          s.kredit_muddat_kun !== undefined &&
          daysSince(s.oxirgi_kirim) > s.kredit_muddat_kun
        ) {
          overdue += 1
        }
      }
      if (s.balans <= 0) sof += 1
    }
    return { all: suppliers.length, qarzdor, sof, overdue }
  }, [suppliers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return suppliers
      .filter(s => {
        const matchSearch =
          !q ||
          s.nomi.toLowerCase().includes(q) ||
          (s.telefon ?? "").includes(q) ||
          (s.kategoriya ?? "").toLowerCase().includes(q)
        if (!matchSearch) return false
        if (active === "qarzimiz_bor") return s.balans > 0
        if (active === "sof")          return s.balans <= 0
        if (active === "overdue")      {
          if (s.balans <= 0) return false
          if (s.kredit_muddat_kun === undefined) return false
          return daysSince(s.oxirgi_kirim) > s.kredit_muddat_kun
        }
        return true
      })
      .sort((a, b) => b.balans - a.balans)
  }, [suppliers, search, active])

  const totalDebt = suppliers.reduce((sum, s) => sum + Math.max(0, s.balans), 0)
  const totalActive = suppliers.reduce((sum, s) => sum + s.aktiv_buyurtma, 0)

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">{L.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.total_debt}
            </p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
              {formatUzs(totalDebt, lang)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.active_orders}
            </p>
            <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
              {totalActive}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L.search_ph}
            className="pl-9 h-9 text-sm bg-card/60 backdrop-blur-xl border-border/60"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Chip label={L.all}     count={counts.all}     active={active === "all"}           onClick={() => setActive("all")} />
          <Chip label={L.qarzdor} count={counts.qarzdor} active={active === "qarzimiz_bor"} tone="amber"   onClick={() => setActive("qarzimiz_bor")} />
          <Chip label={L.sof}     count={counts.sof}     active={active === "sof"}           tone="emerald" onClick={() => setActive("sof")} />
          <Chip label={L.overdue} count={counts.overdue} active={active === "overdue"}       tone="rose"    onClick={() => setActive("overdue")} />
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((s, i) => (
            <Row
              key={s.id}
              supplier={s}
              lang={lang}
              index={i}
              onCall={onCall}
              onClick={onRowClick}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center"
        >
          <div className="inline-flex p-4 rounded-2xl bg-muted mb-3">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{L.no_suppliers}</p>
        </motion.div>
      )}
    </div>
  )
}
