"use client"

/**
 * AgentRouteCard — daily visit route for one sales rep.
 *
 * SalesDoc /clients/agentRoute equivalent. Shows a vertical timeline
 * of planned client visits with per-stop status, planned vs actual
 * order amounts, photo thumbnails, and a header progress bar.
 *
 * Written directly by Claude (v0 returned description only).
 */

import { motion } from "framer-motion"
import {
  MapPin, Clock, Camera, CheckCircle2, XCircle, CircleDashed,
  UserX, User, type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export type StopStatus =
  | "kutilmoqda"        // planned, not yet visited
  | "tashrif_qilingan"  // visited + order captured
  | "bekor"             // visit cancelled
  | "no_show"           // agent went but client closed / no order

export interface RouteStop {
  id:             number
  klient_ismi:    string
  manzil?:        string
  planned_order:  number          // planned sum (UZS)
  actual_order?:  number          // actual sum (only if visited)
  holat:          StopStatus
  vaqt?:          string          // ISO timestamp of visit
  photo_url?:     string
}

export interface AgentRouteAgent {
  id:          number
  ism:         string
  avatar_url?: string
}

interface Props {
  agent:     AgentRouteAgent
  stops:     RouteStop[]
  className?: string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    role:             "Savdo agenti",
    progress:         (done: number, total: number) => `${done} / ${total} ta nuqta`,
    planned:          "Reja",
    actual:           "Fakt",
    status: {
      kutilmoqda:       "Kutilmoqda",
      tashrif_qilingan: "Tashrif qilingan",
      bekor:            "Bekor",
      no_show:          "Mijoz yo'q",
    },
    no_photo:          "Rasm yo'q",
    empty:             "Bu agent uchun bugungi marshrut yo'q",
  },
  ru: {
    role:             "Торговый агент",
    progress:         (done: number, total: number) => `${done} / ${total} точек`,
    planned:          "План",
    actual:           "Факт",
    status: {
      kutilmoqda:       "Ожидание",
      tashrif_qilingan: "Посещено",
      bekor:            "Отменено",
      no_show:          "Клиента нет",
    },
    no_photo:          "Нет фото",
    empty:             "Маршрут на сегодня пуст",
  },
}

// ─── Status meta ────────────────────────────────────────────

interface StatusMeta {
  Icon:     LucideIcon
  dot:      string    // tailwind bg colour for the dot
  tone:     string    // text colour
  ring:     string    // pill bg + ring
  pulse:    boolean   // show ping animation (pending)
}

const STATUS_META: Record<StopStatus, StatusMeta> = {
  kutilmoqda: {
    Icon:  CircleDashed,
    dot:   "bg-amber-500",
    tone:  "text-amber-700 dark:text-amber-300",
    ring:  "bg-amber-500/15 ring-amber-500/30",
    pulse: true,
  },
  tashrif_qilingan: {
    Icon:  CheckCircle2,
    dot:   "bg-emerald-500",
    tone:  "text-emerald-700 dark:text-emerald-300",
    ring:  "bg-emerald-500/15 ring-emerald-500/30",
    pulse: false,
  },
  bekor: {
    Icon:  XCircle,
    dot:   "bg-rose-500",
    tone:  "text-rose-700 dark:text-rose-300",
    ring:  "bg-rose-500/15 ring-rose-500/30",
    pulse: false,
  },
  no_show: {
    Icon:  UserX,
    dot:   "bg-slate-500",
    tone:  "text-slate-700 dark:text-slate-300",
    ring:  "bg-slate-500/15 ring-slate-500/30",
    pulse: false,
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

function formatTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

// ─── Stop row ───────────────────────────────────────────────

interface StopRowProps {
  stop:   RouteStop
  lang:   Lang
  index:  number
  last:   boolean
}

function StopRow({ stop, lang, index, last }: StopRowProps) {
  const L = LABELS[lang]
  const meta = STATUS_META[stop.holat]
  const visited = stop.holat === "tashrif_qilingan"
  const actualPct = stop.planned_order > 0 && stop.actual_order !== undefined
    ? Math.round((stop.actual_order / stop.planned_order) * 100)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex gap-4"
    >
      {/* Connector rail */}
      <div className="relative shrink-0 w-8 flex flex-col items-center">
        <div className="relative mt-2">
          <div className={cn("w-3.5 h-3.5 rounded-full ring-2 ring-background z-10 relative", meta.dot)} />
          {meta.pulse && (
            <span className={cn(
              "absolute inset-0 w-3.5 h-3.5 rounded-full animate-ping",
              meta.dot, "opacity-60",
            )} />
          )}
        </div>
        {!last && (
          <div className="flex-1 w-[2px] bg-border/60 mt-1" />
        )}
      </div>

      {/* Card */}
      <div
        className={cn(
          "flex-1 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 mb-3",
          "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {stop.klient_ismi}
            </p>
            {stop.manzil && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {stop.manzil}
              </p>
            )}
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 shrink-0",
            meta.ring, meta.tone,
          )}>
            <meta.Icon className="w-2.5 h-2.5" />
            {L.status[stop.holat]}
          </span>
        </div>

        {/* Order amounts */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.planned}
            </p>
            <p className="text-xs font-medium text-muted-foreground tabular-nums mt-0.5">
              {formatUzs(stop.planned_order, lang)}
            </p>
          </div>
          {visited && stop.actual_order !== undefined && (
            <div className="text-right">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                {L.actual}
              </p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                {formatUzs(stop.actual_order, lang)}
                {actualPct !== null && (
                  <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                    ({actualPct}%)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Time + photo */}
        {(stop.vaqt || stop.photo_url) && (
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-3">
            {stop.vaqt && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(stop.vaqt, lang)}
              </span>
            )}
            {stop.photo_url ? (
              <a
                href={stop.photo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block"
              >
                <img
                  src={stop.photo_url}
                  alt="Visit photo"
                  className="w-14 h-14 rounded-xl object-cover ring-1 ring-border/60 hover:scale-110 transition-transform"
                />
              </a>
            ) : visited ? (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground">
                <Camera className="w-4 h-4" />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main ───────────────────────────────────────────────────

export default function AgentRouteCard({
  agent,
  stops,
  className,
}: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const total   = stops.length
  const visited = stops.filter(s => s.holat === "tashrif_qilingan").length
  const progress = total > 0 ? Math.round((visited / total) * 100) : 0

  // Per-status counts (for legend)
  const counts = stops.reduce<Record<StopStatus, number>>(
    (acc, s) => { acc[s.holat] += 1; return acc },
    { kutilmoqda: 0, tashrif_qilingan: 0, bekor: 0, no_show: 0 },
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5",
        className,
      )}
    >
      {/* Halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br from-emerald-500/25 via-emerald-500/5 to-transparent"
      />

      {/* Header */}
      <div className="relative flex items-center gap-4 mb-5">
        {/* Avatar */}
        {agent.avatar_url ? (
          <img
            src={agent.avatar_url}
            alt={agent.ism}
            className="w-14 h-14 rounded-2xl object-cover ring-1 ring-border/60"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl ring-1 ring-border/60 bg-gradient-to-br from-emerald-500/40 to-emerald-500/5 flex items-center justify-center text-xl font-bold text-foreground">
            {initials(agent.ism)}
          </div>
        )}

        {/* Name + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3" />
            {L.role}
          </p>
          <h2 className="text-lg font-bold text-foreground truncate">{agent.ism}</h2>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">{L.progress(visited, total)}</span>
              <span className="text-muted-foreground tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {total > 0 && (
        <div className="relative flex flex-wrap gap-2 mb-5">
          {(Object.keys(STATUS_META) as StopStatus[]).map(k =>
            counts[k] > 0 ? (
              <span
                key={k}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                  STATUS_META[k].ring,
                  STATUS_META[k].tone,
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_META[k].dot)} />
                {L.status[k]}: {counts[k]}
              </span>
            ) : null,
          )}
        </div>
      )}

      {/* Timeline */}
      {stops.length > 0 ? (
        <div className="relative">
          {stops.map((stop, i) => (
            <StopRow
              key={stop.id}
              stop={stop}
              lang={lang}
              index={i}
              last={i === stops.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="relative py-10 text-center">
          <p className="text-sm text-muted-foreground">{L.empty}</p>
        </div>
      )}
    </motion.div>
  )
}
