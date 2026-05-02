"use client"

/**
 * OrderStatusBoard — SalesDoc-style tabbed order board.
 *
 * Pipeline: v0.dev drafted skeleton → GPT-5.4 audit (19 issues found) →
 * Claude applied fixes:
 *   - Real useLocale() from @/lib/locale-context (not stub)
 *   - Strict OrderStatus typing across the state machine
 *   - Explicit `progress` class in STATUS_META (no brittle .replace() hack)
 *   - type="button" on tab buttons (no stray form submits)
 *   - Removed dead useId/SVG gradient defs
 *   - Removed misleading "Jonli yangilanish" badge
 *   - useMemo for counts
 *   - Removed scrollbar-none (not in Tailwind v4 core)
 */

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, Truck, PackageCheck, XCircle, Sparkles, Ban,
  ChevronRight, InboxIcon, CalendarDays, Wallet, CreditCard,
  AlertCircle, type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────

export type OrderStatus =
  | "yangi" | "tasdiqlangan" | "otgruzka" | "yetkazildi" | "bekor"

export interface Order {
  id:          number
  klient_ismi: string
  jami:        number
  tolangan:    number
  qarz:        number
  holat:       OrderStatus
  sana:        string   // ISO timestamp
  bekor_sabab?: string
}

export type ActionKey = "tasdiqlash" | "otgruzkaga" | "yetkazildi" | "bekor"

interface OrderStatusBoardProps {
  orders: Order[]
  onStatusChange?: (orderId: number, newStatus: OrderStatus) => void
  className?: string
}

// ────────────────────────────────────────────────────────────
//  Constants
// ────────────────────────────────────────────────────────────

const STATUS_LIST: OrderStatus[] = [
  "yangi", "tasdiqlangan", "otgruzka", "yetkazildi", "bekor",
]

type Lang = "uz" | "ru"

const LABELS: Record<Lang, Record<OrderStatus, string>> = {
  uz: {
    yangi:        "Yangi",
    tasdiqlangan: "Tasdiqlangan",
    otgruzka:     "Otgruzkada",
    yetkazildi:   "Yetkazildi",
    bekor:        "Bekor qilingan",
  },
  ru: {
    yangi:        "Новый",
    tasdiqlangan: "Подтверждён",
    otgruzka:     "В отгрузке",
    yetkazildi:   "Доставлен",
    bekor:        "Отменён",
  },
}

const ACTION_LABELS: Record<Lang, Record<ActionKey, string>> = {
  uz: {
    tasdiqlash: "Tasdiqlash",
    bekor:      "Bekor qilish",
    otgruzkaga: "Otgruzkaga",
    yetkazildi: "Yetkazildi",
  },
  ru: {
    tasdiqlash: "Подтвердить",
    bekor:      "Отменить",
    otgruzkaga: "В отгрузку",
    yetkazildi: "Доставлен",
  },
}

const EMPTY_LABEL: Record<Lang, string> = {
  uz: "Hozircha yo'q",
  ru: "Пока нет",
}

interface StatusMeta {
  icon:      LucideIcon
  color:     string      // icon/text colour
  rail:      string      // left-accent rail bg
  progress:  string      // progress bar fill
  border:    string      // card border
  glow:      string      // tab ring glow
  tabActive: string      // active tab bg+border
  pill:      string      // pill bg+text
}

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  yangi: {
    icon:      Sparkles,
    color:     "text-amber-600 dark:text-amber-400",
    rail:      "bg-amber-500/70 dark:bg-amber-400/60",
    progress:  "bg-amber-500/80",
    border:    "border-amber-500/40",
    glow:      "ring-amber-400/30",
    tabActive: "bg-amber-500/15 border-amber-500/50",
    pill:      "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  tasdiqlangan: {
    icon:      CheckCircle2,
    color:     "text-blue-600 dark:text-blue-400",
    rail:      "bg-blue-500/70 dark:bg-blue-400/60",
    progress:  "bg-blue-500/80",
    border:    "border-blue-500/40",
    glow:      "ring-blue-400/30",
    tabActive: "bg-blue-500/15 border-blue-500/50",
    pill:      "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  },
  otgruzka: {
    icon:      Truck,
    color:     "text-cyan-600 dark:text-cyan-400",
    rail:      "bg-cyan-500/70 dark:bg-cyan-400/60",
    progress:  "bg-cyan-500/80",
    border:    "border-cyan-500/40",
    glow:      "ring-cyan-400/30",
    tabActive: "bg-cyan-500/15 border-cyan-500/50",
    pill:      "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  },
  yetkazildi: {
    icon:      PackageCheck,
    color:     "text-emerald-600 dark:text-emerald-400",
    rail:      "bg-emerald-500/70 dark:bg-emerald-400/60",
    progress:  "bg-emerald-500/80",
    border:    "border-emerald-500/40",
    glow:      "ring-emerald-400/30",
    tabActive: "bg-emerald-500/15 border-emerald-500/50",
    pill:      "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  bekor: {
    icon:      XCircle,
    color:     "text-rose-600 dark:text-rose-400",
    rail:      "bg-rose-500/70 dark:bg-rose-400/60",
    progress:  "bg-rose-500/80",
    border:    "border-rose-500/40",
    glow:      "ring-rose-400/30",
    tabActive: "bg-rose-500/15 border-rose-500/50",
    pill:      "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  },
}

interface NextAction {
  key:        ActionKey
  nextStatus: OrderStatus
  destructive: boolean
}

const NEXT_ACTIONS: Record<OrderStatus, NextAction[]> = {
  yangi: [
    { key: "tasdiqlash", nextStatus: "tasdiqlangan", destructive: false },
    { key: "bekor",      nextStatus: "bekor",        destructive: true  },
  ],
  tasdiqlangan: [
    { key: "otgruzkaga", nextStatus: "otgruzka", destructive: false },
    { key: "bekor",      nextStatus: "bekor",    destructive: true  },
  ],
  otgruzka: [
    { key: "yetkazildi", nextStatus: "yetkazildi", destructive: false },
    { key: "bekor",      nextStatus: "bekor",      destructive: true  },
  ],
  yetkazildi: [],
  bekor:      [],
}

// ────────────────────────────────────────────────────────────
//  Formatters — locale-aware, UZS
// ────────────────────────────────────────────────────────────

function formatCurrency(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt  = new Intl.NumberFormat(intl, { maximumFractionDigits: 0 })
  if (amount >= 1_000_000_000) {
    return `${fmt.format(Math.round((amount / 1_000_000_000) * 10) / 10)} mlrd so'm`
  }
  if (amount >= 1_000_000) {
    return `${fmt.format(Math.round((amount / 1_000_000) * 10) / 10)} mln so'm`
  }
  if (amount >= 10_000) {
    return `${fmt.format(Math.round(amount / 1_000))} ming so'm`
  }
  return `${fmt.format(amount)} so'm`
}

function formatDate(iso: string, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(intl, {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(d)
}

// ────────────────────────────────────────────────────────────
//  Status tabs
// ────────────────────────────────────────────────────────────

interface StatusTabsProps {
  counts: Record<OrderStatus, number>
  active: OrderStatus
  onSelect: (s: OrderStatus) => void
  lang: Lang
}

function StatusTabs({ counts, active, onSelect, lang }: StatusTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {STATUS_LIST.map(status => {
        const meta = STATUS_META[status]
        const isActive = active === status
        const Icon = meta.icon
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            className={cn(
              "relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? cn(meta.tabActive, meta.color, "shadow-sm ring-1", meta.glow)
                : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            <Icon size={15} className={isActive ? meta.color : "opacity-60"} />
            <span>{LABELS[lang][status]}</span>
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                isActive ? meta.pill : "bg-muted text-muted-foreground",
              )}
            >
              {counts[status]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  Order card
// ────────────────────────────────────────────────────────────

interface OrderCardProps {
  order:    Order
  lang:     Lang
  onAction: (orderId: number, nextStatus: OrderStatus) => void
  index:    number
}

function OrderCard({ order, lang, onAction, index }: OrderCardProps) {
  const meta    = STATUS_META[order.holat]
  const actions = NEXT_ACTIONS[order.holat]
  const Icon    = meta.icon

  const paidPct =
    order.jami > 0
      ? Math.min(100, Math.round((order.tolangan / order.jami) * 100))
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{
        duration: 0.28,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      layout
    >
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl",
          "transition-shadow duration-200 hover:shadow-md",
          meta.border,
        )}
      >
        {/* Left accent rail */}
        <div
          aria-hidden
          className={cn("absolute left-0 top-0 h-full w-1 rounded-l-2xl", meta.rail)}
        />

        <div className="pl-5 pr-4 py-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                #{order.id}
              </p>
              <p className="text-base font-semibold text-foreground leading-tight truncate">
                {order.klient_ismi}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold shrink-0",
                meta.pill,
              )}
            >
              <Icon size={12} />
              {LABELS[lang][order.holat]}
            </div>
          </div>

          {/* Jami summa */}
          <div>
            <p className={cn("text-2xl font-bold tracking-tight", meta.color)}>
              {formatCurrency(order.jami, lang)}
            </p>
          </div>

          {/* Progress + tolangan/qarz */}
          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", meta.progress)}
                initial={{ width: 0 }}
                animate={{ width: `${paidPct}%` }}
                transition={{ duration: 0.6, delay: index * 0.04 + 0.15, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CreditCard size={11} />
                {formatCurrency(order.tolangan, lang)}
              </span>
              {order.qarz > 0 && (
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <Wallet size={11} />
                  -{formatCurrency(order.qarz, lang)}
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays size={11} />
            {formatDate(order.sana, lang)}
          </div>

          {/* Bekor sabab */}
          {order.holat === "bekor" && order.bekor_sabab && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{order.bekor_sabab}</span>
            </div>
          )}

          {/* Yetkazildi success */}
          {order.holat === "yetkazildi" && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <PackageCheck size={13} />
              {lang === "uz" ? "Yetkazib berildi" : "Доставлено успешно"}
            </div>
          )}

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 pt-0.5">
              {actions.map(action => (
                <Button
                  key={action.key}
                  type="button"
                  size="sm"
                  variant={action.destructive ? "destructive" : "default"}
                  onClick={() => onAction(order.id, action.nextStatus)}
                  className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                >
                  {action.destructive ? (
                    <Ban size={11} />
                  ) : (
                    <ChevronRight size={11} />
                  )}
                  {ACTION_LABELS[lang][action.key]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────
//  Empty state
// ────────────────────────────────────────────────────────────

function EmptyState({ lang }: { lang: Lang }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground"
    >
      <div className="rounded-2xl bg-muted/60 p-5 backdrop-blur-sm">
        <InboxIcon size={40} strokeWidth={1.2} />
      </div>
      <p className="text-sm font-medium">{EMPTY_LABEL[lang]}</p>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────
//  Main export
// ────────────────────────────────────────────────────────────

export default function OrderStatusBoard({
  orders,
  onStatusChange,
  className,
}: OrderStatusBoardProps) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("yangi")

  const counts = useMemo<Record<OrderStatus, number>>(() => {
    const base: Record<OrderStatus, number> = {
      yangi: 0, tasdiqlangan: 0, otgruzka: 0, yetkazildi: 0, bekor: 0,
    }
    for (const o of orders) base[o.holat] += 1
    return base
  }, [orders])

  const filtered = useMemo(
    () => orders.filter(o => o.holat === activeStatus),
    [orders, activeStatus],
  )

  const handleAction = (orderId: number, nextStatus: OrderStatus) => {
    onStatusChange?.(orderId, nextStatus)
  }

  return (
    <div className={cn("w-full space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {lang === "uz" ? "Buyurtmalar holati" : "Статус заказов"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "uz"
              ? `Jami ${orders.length} ta buyurtma`
              : `Всего ${orders.length} заказов`}
          </p>
        </div>
        <Badge
          variant="outline"
          className="rounded-xl border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
        >
          {lang === "uz" ? "Hozirgi holat" : "Текущий статус"}
        </Badge>
      </div>

      {/* Tabs */}
      <StatusTabs
        counts={counts}
        active={activeStatus}
        onSelect={setActiveStatus}
        lang={lang}
      />

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Cards grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <EmptyState key={`empty-${activeStatus}`} lang={lang} />
        ) : (
          <motion.div
            key={activeStatus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                lang={lang}
                onAction={handleAction}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
