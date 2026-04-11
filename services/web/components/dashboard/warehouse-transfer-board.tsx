"use client"

/**
 * WarehouseTransferBoard — inter-filial transfer list with status tabs.
 *
 * Maps onto the existing filial_transferlar table:
 *   (id, dan_filial_id, ga_filial_id, tovar_id, tovar_nomi, miqdor,
 *    holat in('kutilmoqda','tasdiqlangan','bekor'), izoh, yaratilgan)
 *
 * Visual model: similar to OrderStatusBoard but simpler — a single
 * stream of transfer cards with filter tabs and from→to direction
 * indicator.
 */

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Package, ArrowRight, Clock, CheckCircle2, XCircle, Building2,
  type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export type TransferStatus = "kutilmoqda" | "tasdiqlangan" | "bekor"

export interface WarehouseTransfer {
  id:              number
  dan_filial_id:   number
  dan_filial_nomi?: string
  ga_filial_id:    number
  ga_filial_nomi?:  string
  tovar_nomi:      string
  miqdor:          number
  birlik?:         string
  holat:           TransferStatus
  izoh?:           string
  yaratilgan:      string      // ISO
}

interface Props {
  transfers:   WarehouseTransfer[]
  onApprove?:  (id: number) => void
  onCancel?:   (id: number) => void
  className?:  string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:          "Ko'chirishlar",
    subtitle:       "Filiallar orasida tovar harakati",
    all:            "Barchasi",
    kutilmoqda:     "Kutilmoqda",
    tasdiqlangan:   "Tasdiqlangan",
    bekor:          "Bekor",
    from:           "Dan",
    to:             "Ga",
    qty:            "Miqdor",
    tasdiqlash:     "Tasdiqlash",
    bekor_qilish:   "Bekor qilish",
    no_transfers:   "Ko'chirishlar yo'q",
    empty_hint:     "Yangi ko'chirish yaratilgach bu yerda ko'rinadi",
    today:          "bugun",
    yesterday:      "kecha",
    days_ago:       (n: number) => `${n} kun oldin`,
  },
  ru: {
    title:          "Перемещения",
    subtitle:       "Движение товаров между филиалами",
    all:            "Все",
    kutilmoqda:     "Ожидание",
    tasdiqlangan:   "Подтверждено",
    bekor:          "Отменено",
    from:           "Из",
    to:             "В",
    qty:            "Кол-во",
    tasdiqlash:     "Подтвердить",
    bekor_qilish:   "Отменить",
    no_transfers:   "Нет перемещений",
    empty_hint:     "Новые перемещения появятся здесь",
    today:          "сегодня",
    yesterday:      "вчера",
    days_ago:       (n: number) => `${n} дн назад`,
  },
}

// ─── Status meta ────────────────────────────────────────────

interface StatusMeta {
  Icon:   LucideIcon
  rail:   string
  border: string
  pill:   string
  color:  string
  glow:   string
}

const STATUS_META: Record<TransferStatus, StatusMeta> = {
  kutilmoqda: {
    Icon:   Clock,
    rail:   "bg-amber-500/70 dark:bg-amber-400/60",
    border: "border-amber-500/40",
    pill:   "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
    color:  "text-amber-600 dark:text-amber-400",
    glow:   "from-amber-500/30 via-amber-500/5 to-transparent",
  },
  tasdiqlangan: {
    Icon:   CheckCircle2,
    rail:   "bg-emerald-500/70 dark:bg-emerald-400/60",
    border: "border-emerald-500/40",
    pill:   "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
    color:  "text-emerald-600 dark:text-emerald-400",
    glow:   "from-emerald-500/30 via-emerald-500/5 to-transparent",
  },
  bekor: {
    Icon:   XCircle,
    rail:   "bg-rose-500/70 dark:bg-rose-400/60",
    border: "border-rose-500/40",
    pill:   "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
    color:  "text-rose-600 dark:text-rose-400",
    glow:   "from-rose-500/30 via-rose-500/5 to-transparent",
  },
}

const STATUSES: TransferStatus[] = ["kutilmoqda", "tasdiqlangan", "bekor"]

// ─── Helpers ────────────────────────────────────────────────

function relDays(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return LABELS[lang].today
  if (days === 1) return LABELS[lang].yesterday
  return LABELS[lang].days_ago(days)
}

function filialLabel(id: number, nomi?: string): string {
  return nomi?.trim() || `#${id}`
}

// ─── Filter chip ────────────────────────────────────────────

interface ChipProps {
  label:   string
  count:   number
  active:  boolean
  tone?:   StatusMeta | null
  onClick: () => void
}

function Chip({ label, count, active, tone, onClick }: ChipProps) {
  const activeClass = tone
    ? cn(tone.pill, "ring-1 shadow-sm")
    : "bg-primary text-primary-foreground border-primary shadow-sm"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? activeClass
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card",
      )}
    >
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

// ─── Transfer card ──────────────────────────────────────────

interface CardProps {
  t:         WarehouseTransfer
  lang:      Lang
  onApprove?: (id: number) => void
  onCancel?:  (id: number) => void
  index:     number
}

function TransferCard({ t, lang, onApprove, onCancel, index }: CardProps) {
  const L = LABELS[lang]
  const meta = STATUS_META[t.holat]
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const qty  = new Intl.NumberFormat(intl, { maximumFractionDigits: 2 }).format(t.miqdor)
  const canApprove = t.holat === "kutilmoqda" && !!onApprove
  const canCancel  = t.holat === "kutilmoqda" && !!onCancel

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: index * 0.03,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl p-4",
        "shadow-sm hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300",
        meta.border,
      )}
    >
      {/* Left accent rail */}
      <div
        aria-hidden
        className={cn("absolute left-0 top-0 h-full w-1 rounded-l-2xl", meta.rail)}
      />

      {/* Halo */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-60 bg-gradient-to-br",
          meta.glow,
        )}
      />

      <div className="relative pl-3">
        {/* Header: id + status pill */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              #{t.id}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5 line-clamp-1">
              {t.tovar_nomi}
            </p>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 shrink-0",
            meta.pill,
          )}>
            <meta.Icon className="w-3 h-3" />
            {L[t.holat]}
          </span>
        </div>

        {/* Dan → Ga (from → to) */}
        <div className="flex items-center gap-2 text-xs mb-3">
          <div className="flex-1 min-w-0 rounded-xl bg-muted/60 px-2.5 py-2">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
              {L.from}
            </p>
            <p className="text-foreground font-medium truncate mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" />
              {filialLabel(t.dan_filial_id, t.dan_filial_nomi)}
            </p>
          </div>
          <ArrowRight className={cn("w-4 h-4 shrink-0", meta.color)} />
          <div className="flex-1 min-w-0 rounded-xl bg-muted/60 px-2.5 py-2">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
              {L.to}
            </p>
            <p className="text-foreground font-medium truncate mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" />
              {filialLabel(t.ga_filial_id, t.ga_filial_nomi)}
            </p>
          </div>
        </div>

        {/* Qty + date */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="flex items-center gap-1.5">
            <Package className={cn("w-3.5 h-3.5", meta.color)} />
            <span className={cn("font-bold tabular-nums", meta.color)}>
              {qty}
            </span>
            {t.birlik && <span className="text-muted-foreground">{t.birlik}</span>}
          </span>
          <span className="text-muted-foreground">
            {relDays(t.yaratilgan, lang)}
          </span>
        </div>

        {/* Izoh */}
        {t.izoh && (
          <p className="text-[11px] text-muted-foreground italic line-clamp-2 mb-3">
            {t.izoh}
          </p>
        )}

        {/* Actions (kutilmoqda only) */}
        {(canApprove || canCancel) && (
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                type="button"
                onClick={() => onApprove!(t.id)}
                className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold hover:bg-emerald-500/25 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {L.tasdiqlash}
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel!(t.id)}
                className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[11px] font-semibold hover:bg-rose-500/20 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                {L.bekor_qilish}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  )
}

// ─── Main component ─────────────────────────────────────────

export default function WarehouseTransferBoard({
  transfers,
  onApprove,
  onCancel,
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [active, setActive] = useState<TransferStatus | "all">("all")

  const counts = useMemo(() => {
    const base = { all: transfers.length, kutilmoqda: 0, tasdiqlangan: 0, bekor: 0 }
    for (const t of transfers) base[t.holat] += 1
    return base
  }, [transfers])

  const filtered = useMemo(
    () => active === "all" ? transfers : transfers.filter(t => t.holat === active),
    [transfers, active],
  )

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">{L.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Chip
          label={L.all}
          count={counts.all}
          active={active === "all"}
          onClick={() => setActive("all")}
        />
        {STATUSES.map(s => (
          <Chip
            key={s}
            label={L[s]}
            count={counts[s]}
            active={active === s}
            tone={STATUS_META[s]}
            onClick={() => setActive(s)}
          />
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((t, i) => (
            <TransferCard
              key={t.id}
              t={t}
              lang={lang}
              onApprove={onApprove}
              onCancel={onCancel}
              index={i}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center"
        >
          <div className="inline-flex p-4 rounded-2xl bg-muted mb-3">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{L.no_transfers}</p>
          <p className="text-xs text-muted-foreground mt-1">{L.empty_hint}</p>
        </motion.div>
      )}
    </div>
  )
}
