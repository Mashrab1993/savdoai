"use client"

/**
 * Client360View — deep customer profile card.
 *
 * SalesDoc's "Karta klienta" equivalent. Shows:
 *  - Header with name, avatar, category, RFM score chips
 *  - 4 headline metrics (lifetime spend, avg check, visits, credit %)
 *  - Purchase trend sparkline (SVG)
 *  - Last-N orders list
 *  - Top-N products
 *  - Debt/credit state with bar
 *
 * Theme-safe, framer-motion animated, useLocale uz/ru.
 */

import { motion } from "framer-motion"
import {
  DollarSign, ShoppingBag, CalendarCheck, CreditCard, User,
  Phone, MapPin, Award, TrendingUp, Package, Clock,
  type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface Client360 {
  // Basic
  id:             number
  ism:            string
  telefon?:       string
  manzil?:        string
  kategoriya?:    string

  // Financial
  jami_xaridlar:  number          // lifetime revenue
  xarid_soni:     number          // lifetime order count
  ortacha_chek:   number          // avg order size
  joriy_qarz:     number
  kredit_limit:   number

  // Activity
  birinchi_sotuv?: string         // ISO
  oxirgi_sotuv?:   string         // ISO
  tashrif_soni?:   number

  // RFM segmentation
  rfm_segment?:    "champions" | "loyal" | "potential" | "at_risk" | "lost" | "new"
  rfm_score?:      { R: number; F: number; M: number }  // 1..5 each

  // History (last N) + top products
  oxirgi_sotuvlar?: Array<{
    id:     number
    sana:   string
    jami:   number
    tovar_soni?: number
  }>
  top_tovarlar?: Array<{
    nomi:    string
    jami:    number
    miqdor?: number
  }>

  // 12-month trend (sparkline)
  oylik_trend?: Array<{ oy: string; jami: number }>
}

interface Client360ViewProps {
  client: Client360
  className?: string
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    lifetime:   "Jami xaridlar",
    orders:     "Buyurtmalar",
    avg_check:  "O'rtacha chek",
    credit:     "Kredit holati",
    used:       "ishlatilgan",
    limit:      "limit",
    first_buy:  "Birinchi xarid",
    last_buy:   "Oxirgi xarid",
    visits:     "Tashriflar",
    trend:      "12 oylik trend",
    recent:     "Oxirgi buyurtmalar",
    top_prod:   "Top tovarlar",
    rfm_title:  "RFM segmenti",
    segments: {
      champions: "Champions",
      loyal:     "Loyal mijoz",
      potential: "Potensial",
      at_risk:   "Xavf ostida",
      lost:      "Yo'qolgan",
      new:       "Yangi",
    },
    no_data:    "Ma'lumot yo'q",
    today:      "bugun",
    yesterday:  "kecha",
    days_ago:   (n: number) => `${n} kun oldin`,
  },
  ru: {
    lifetime:   "Всего покупок",
    orders:     "Заказов",
    avg_check:  "Средний чек",
    credit:     "Кредит",
    used:       "использовано",
    limit:      "лимит",
    first_buy:  "Первая покупка",
    last_buy:   "Последняя покупка",
    visits:     "Визитов",
    trend:      "Тренд за 12 мес",
    recent:     "Последние заказы",
    top_prod:   "Топ товары",
    rfm_title:  "RFM сегмент",
    segments: {
      champions: "Чемпионы",
      loyal:     "Лояльные",
      potential: "Потенциал",
      at_risk:   "Под риском",
      lost:      "Потеряны",
      new:       "Новые",
    },
    no_data:    "Нет данных",
    today:      "сегодня",
    yesterday:  "вчера",
    days_ago:   (n: number) => `${n} дн назад`,
  },
}

const SEGMENT_META: Record<NonNullable<Client360["rfm_segment"]>, {
  tone: string
  gradient: string
}> = {
  champions: { tone: "text-amber-700 dark:text-amber-300 bg-amber-500/15 ring-amber-500/30",   gradient: "from-amber-500/40 to-amber-500/5" },
  loyal:     { tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 ring-emerald-500/30", gradient: "from-emerald-500/40 to-emerald-500/5" },
  potential: { tone: "text-blue-700 dark:text-blue-300 bg-blue-500/15 ring-blue-500/30",     gradient: "from-blue-500/40 to-blue-500/5" },
  at_risk:   { tone: "text-rose-700 dark:text-rose-300 bg-rose-500/15 ring-rose-500/30",     gradient: "from-rose-500/40 to-rose-500/5" },
  lost:      { tone: "text-slate-700 dark:text-slate-300 bg-slate-500/15 ring-slate-500/30", gradient: "from-slate-500/40 to-slate-500/5" },
  new:       { tone: "text-violet-700 dark:text-violet-300 bg-violet-500/15 ring-violet-500/30", gradient: "from-violet-500/40 to-violet-500/5" },
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

function daysAgo(iso: string | undefined, lang: Lang): string {
  if (!iso) return LABELS[lang].no_data
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return LABELS[lang].no_data
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diff === 0) return LABELS[lang].today
  if (diff === 1) return LABELS[lang].yesterday
  return LABELS[lang].days_ago(diff)
}

// ─── Sparkline ──────────────────────────────────────────────

function TrendSparkline({ data }: { data: Array<{ oy: string; jami: number }> }) {
  if (data.length < 2) return null
  const w = 240, h = 48
  const vals = data.map(d => d.jami)
  const max = Math.max(...vals, 1)
  const min = Math.min(...vals, 0)
  const range = max - min || 1
  const xs = vals.map((_, i) => (i / (vals.length - 1)) * w)
  const ys = vals.map(v => h - ((v - min) / range) * (h - 4) - 2)
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ")
  const area = `${line} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-12"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="client360-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#client360-spark)" className="text-emerald-500" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500"
      />
    </svg>
  )
}

// ─── Metric tile ────────────────────────────────────────────

interface MetricTileProps {
  label: string
  value: string
  Icon:  LucideIcon
  delay: number
  tone?: "emerald" | "blue" | "amber" | "rose"
}

function MetricTile({ label, value, Icon, delay, tone = "emerald" }: MetricTileProps) {
  const toneClass = {
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
    blue:    "bg-blue-500/15    text-blue-600    dark:text-blue-400    ring-blue-500/30",
    amber:   "bg-amber-500/15   text-amber-600   dark:text-amber-400   ring-amber-500/30",
    rose:    "bg-rose-500/15    text-rose-600    dark:text-rose-400    ring-rose-500/30",
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

// ─── Main ───────────────────────────────────────────────────

export default function Client360View({ client, className }: Client360ViewProps) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const creditUsedPct = client.kredit_limit > 0
    ? Math.min(100, Math.round((client.joriy_qarz / client.kredit_limit) * 100))
    : 0

  const seg = client.rfm_segment
  const segMeta = seg ? SEGMENT_META[seg] : null
  const segLabel = seg ? L.segments[seg] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl",
        className,
      )}
    >
      {/* Gradient halo tinted by segment */}
      {segMeta && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl bg-gradient-to-br",
            segMeta.gradient,
          )}
        />
      )}

      {/* Header */}
      <div className="relative p-5 border-b border-border/60 flex items-start gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-16 h-16 rounded-2xl ring-1 ring-border/60 flex items-center justify-center text-2xl font-bold text-foreground shrink-0 bg-gradient-to-br",
          segMeta?.gradient ?? "from-blue-500/30 to-blue-500/5",
        )}>
          {initials(client.ism)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-foreground">{client.ism}</h2>
            {client.kategoriya && (
              <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium">
                {client.kategoriya}
              </span>
            )}
            {seg && segMeta && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", segMeta.tone)}>
                <Award className="w-3 h-3" />
                {segLabel}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {client.telefon && (
              <a
                href={`tel:${client.telefon}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Phone className="w-3 h-3" />
                {client.telefon}
              </a>
            )}
            {client.manzil && (
              <span className="flex items-center gap-1 truncate max-w-[220px]">
                <MapPin className="w-3 h-3" />
                {client.manzil}
              </span>
            )}
          </div>

          {/* RFM detail */}
          {client.rfm_score && (
            <div className="mt-2 flex gap-1.5">
              {([
                ["R", client.rfm_score.R],
                ["F", client.rfm_score.F],
                ["M", client.rfm_score.M],
              ] as const).map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-0.5 text-[10px] font-mono rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground tabular-nums"
                  title={`${L.rfm_title}: ${k}=${v}`}
                >
                  {k}<span className="text-foreground font-bold">{v}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metric tiles */}
      <div className="relative p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile
          label={L.lifetime}
          value={formatUzs(client.jami_xaridlar, lang)}
          Icon={DollarSign}
          delay={0}
          tone="emerald"
        />
        <MetricTile
          label={L.orders}
          value={String(client.xarid_soni)}
          Icon={ShoppingBag}
          delay={0.05}
          tone="blue"
        />
        <MetricTile
          label={L.avg_check}
          value={formatUzs(client.ortacha_chek, lang)}
          Icon={TrendingUp}
          delay={0.1}
          tone="amber"
        />
        <MetricTile
          label={L.credit}
          value={`${creditUsedPct}% ${L.used}`}
          Icon={CreditCard}
          delay={0.15}
          tone={creditUsedPct >= 80 ? "rose" : creditUsedPct >= 50 ? "amber" : "emerald"}
        />
      </div>

      {/* 12-month trend */}
      {client.oylik_trend && client.oylik_trend.length >= 2 && (
        <div className="relative px-5 pb-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {L.trend}
          </p>
          <TrendSparkline data={client.oylik_trend} />
        </div>
      )}

      {/* Credit bar */}
      {client.kredit_limit > 0 && (
        <div className="relative px-5 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{L.credit}</span>
            <span className="tabular-nums">
              {formatUzs(client.joriy_qarz, lang)} / {formatUzs(client.kredit_limit, lang)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                creditUsedPct >= 80 ? "bg-rose-500" :
                creditUsedPct >= 50 ? "bg-amber-500" :
                                       "bg-emerald-500",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${creditUsedPct}%` }}
              transition={{ duration: 0.7, delay: 0.25 }}
            />
          </div>
        </div>
      )}

      {/* Recent orders + Top products grid */}
      {(client.oxirgi_sotuvlar?.length || client.top_tovarlar?.length) ? (
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-t border-border/60">
          {/* Recent orders */}
          {client.oxirgi_sotuvlar && client.oxirgi_sotuvlar.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {L.recent}
              </p>
              <ul className="space-y-1.5">
                {client.oxirgi_sotuvlar.slice(0, 5).map(o => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">#{o.id}</span>
                      <span className="text-muted-foreground truncate">
                        {daysAgo(o.sana, lang)}
                      </span>
                      {o.tovar_soni !== undefined && (
                        <span className="text-muted-foreground text-[10px]">
                          · {o.tovar_soni}×
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-foreground tabular-nums shrink-0">
                      {formatUzs(o.jami, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top products */}
          {client.top_tovarlar && client.top_tovarlar.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" />
                {L.top_prod}
              </p>
              <ul className="space-y-1.5">
                {client.top_tovarlar.slice(0, 5).map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-foreground truncate min-w-0">{t.nomi}</span>
                    <span className="font-semibold text-foreground tabular-nums shrink-0 ml-2">
                      {formatUzs(t.jami, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Activity footer */}
      {(client.birinchi_sotuv || client.oxirgi_sotuv || client.tashrif_soni !== undefined) && (
        <div className="relative px-5 py-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          {client.birinchi_sotuv && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {L.first_buy}: <span className="text-foreground font-medium">{daysAgo(client.birinchi_sotuv, lang)}</span>
            </span>
          )}
          {client.oxirgi_sotuv && (
            <span className="flex items-center gap-1">
              <CalendarCheck className="w-3 h-3" />
              {L.last_buy}: <span className="text-foreground font-medium">{daysAgo(client.oxirgi_sotuv, lang)}</span>
            </span>
          )}
          {client.tashrif_soni !== undefined && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {L.visits}: <span className="text-foreground font-medium">{client.tashrif_soni}</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
