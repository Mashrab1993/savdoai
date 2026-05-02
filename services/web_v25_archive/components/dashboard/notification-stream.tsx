"use client"

/**
 * NotificationStream — real-time activity feed.
 *
 * SalesDoc live feed equivalent. A vertical list of recent events
 * (order created, payment received, low stock alert, visit checked
 * in, agent reached goal, etc.) with icon per type, agent + client
 * context, relative time, and a "live" pulsing dot at the top.
 */

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingCart, CreditCard, Package, MapPin, Trophy, AlertTriangle,
  RefreshCw, Camera, Receipt, UserPlus, Truck,
  type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export type EventType =
  | "sotuv"         // new order
  | "tolov"         // payment received
  | "qaytarish"     // return
  | "kam_qoldiq"    // low stock alert
  | "tashrif"       // agent visit check-in
  | "kpi_success"   // agent hit target
  | "photo"         // photo report uploaded
  | "xarajat"       // expense logged
  | "yangi_mijoz"   // new client registered
  | "yetkazildi"    // delivery confirmed

export interface StreamEvent {
  id:         number | string
  type:       EventType
  title:      string          // short one-line title
  body?:      string          // optional secondary line
  summa?:     number          // money amount (UZS)
  agent?:     string          // agent name
  klient?:    string          // client name
  vaqt:       string          // ISO timestamp
}

interface Props {
  events:     StreamEvent[]
  live?:      boolean         // show "live" dot
  className?:  string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:    "Jonli oqim",
    live:     "Jonli",
    empty:    "Hozirda hech qanday voqea yo'q",
    empty_hint: "Yangi sotuv, to'lov yoki tashrif yaratilganda bu yerda ko'rinadi",
    now:      "hozir",
    min_ago:  (n: number) => `${n} daq`,
    hour_ago: (n: number) => `${n} soat`,
    day_ago:  (n: number) => `${n} kun`,
  },
  ru: {
    title:    "Живой поток",
    live:     "В эфире",
    empty:    "Пока событий нет",
    empty_hint: "Новые продажи, платежи и визиты появятся здесь",
    now:      "сейчас",
    min_ago:  (n: number) => `${n} мин`,
    hour_ago: (n: number) => `${n} ч`,
    day_ago:  (n: number) => `${n} дн`,
  },
}

// ─── Event type → meta ─────────────────────────────────────

interface EventMeta {
  Icon:  LucideIcon
  tone:  string
  dot:   string
}

const EVENT_META: Record<EventType, EventMeta> = {
  sotuv:       { Icon: ShoppingCart,  tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30", dot: "bg-emerald-500" },
  tolov:       { Icon: CreditCard,    tone: "bg-blue-500/15    text-blue-600    dark:text-blue-400    ring-blue-500/30",    dot: "bg-blue-500" },
  qaytarish:   { Icon: RefreshCw,     tone: "bg-rose-500/15    text-rose-600    dark:text-rose-400    ring-rose-500/30",    dot: "bg-rose-500" },
  kam_qoldiq:  { Icon: Package,       tone: "bg-amber-500/15   text-amber-600   dark:text-amber-400   ring-amber-500/30",   dot: "bg-amber-500" },
  tashrif:     { Icon: MapPin,        tone: "bg-cyan-500/15    text-cyan-600    dark:text-cyan-400    ring-cyan-500/30",    dot: "bg-cyan-500" },
  kpi_success: { Icon: Trophy,        tone: "bg-amber-500/20   text-amber-700   dark:text-amber-300   ring-amber-500/40",   dot: "bg-amber-500" },
  photo:       { Icon: Camera,        tone: "bg-violet-500/15  text-violet-600  dark:text-violet-400  ring-violet-500/30",  dot: "bg-violet-500" },
  xarajat:     { Icon: Receipt,       tone: "bg-orange-500/15  text-orange-600  dark:text-orange-400  ring-orange-500/30",  dot: "bg-orange-500" },
  yangi_mijoz: { Icon: UserPlus,      tone: "bg-teal-500/15    text-teal-600    dark:text-teal-400    ring-teal-500/30",    dot: "bg-teal-500" },
  yetkazildi:  { Icon: Truck,         tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30", dot: "bg-emerald-500" },
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

function relTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const minutes = (Date.now() - d.getTime()) / 60_000
  const L = LABELS[lang]
  if (minutes < 1)    return L.now
  if (minutes < 60)   return L.min_ago(Math.floor(minutes))
  if (minutes < 1440) return L.hour_ago(Math.floor(minutes / 60))
  return L.day_ago(Math.floor(minutes / 1440))
}

// ─── Main ───────────────────────────────────────────────────

export default function NotificationStream({
  events,
  live = true,
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const sorted = useMemo(
    () => [...events].sort((a, b) => {
      const ta = new Date(a.vaqt).getTime()
      const tb = new Date(b.vaqt).getTime()
      return tb - ta
    }),
    [events],
  )

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
      {/* Header */}
      <div className="relative flex items-center justify-between gap-4 p-5 border-b border-border/60">
        <div>
          <h2 className="text-base font-bold text-foreground">{L.title}</h2>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {L.live}
          </span>
        )}
      </div>

      {/* Stream */}
      <div className="relative max-h-[600px] overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="p-4 rounded-2xl bg-muted">
              <RefreshCw className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{L.empty}</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">{L.empty_hint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            <AnimatePresence initial={false}>
              {sorted.map((ev, i) => {
                const meta = EVENT_META[ev.type]
                return (
                  <motion.li
                    key={ev.id}
                    initial={{ opacity: 0, x: -8, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: -8, height: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.025,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                      {/* Icon */}
                      <div className={cn(
                        "p-2 rounded-xl ring-1 shrink-0",
                        meta.tone,
                      )}>
                        <meta.Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {ev.title}
                          </p>
                          {ev.summa !== undefined && (
                            <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                              {formatUzs(ev.summa, lang)}
                              <span className="text-[10px] text-muted-foreground font-normal ml-0.5">so'm</span>
                            </span>
                          )}
                        </div>
                        {ev.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {ev.body}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {ev.agent && (
                            <>
                              <span className="truncate max-w-[130px]">👤 {ev.agent}</span>
                            </>
                          )}
                          {ev.klient && (
                            <>
                              {ev.agent && <span>·</span>}
                              <span className="truncate max-w-[160px]">🏪 {ev.klient}</span>
                            </>
                          )}
                          <span className="ml-auto shrink-0">{relTime(ev.vaqt, lang)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.div>
  )
}
