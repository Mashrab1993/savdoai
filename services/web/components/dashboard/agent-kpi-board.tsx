"use client"

/**
 * AgentKpiBoard — ranked sales agent leaderboard, SalesDoc-inspired.
 *
 * Pipeline: v0.dev drafted skeleton → GPT-5.4 audit (7 issues: wrong
 * English prop names, hardcoded currency as "UZS" instead of "so'm",
 * hardcoded Uzbek labels bypassing useLocale, raw color classes
 * instead of semantic tokens) → Claude rewrote with project schema.
 *
 * Shows each agent's today performance:
 *   - Rank (top 3 get medals)
 *   - Visit progress (visited / planned with % bar)
 *   - Jami savdo (rejali + off-plan)
 *   - Warning badges for low visits and returns
 */

import { motion } from "framer-motion"
import { AlertTriangle, Trophy, Medal, Award, TrendingUp, Users } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface AgentKpi {
  id:           number | string
  ism:          string            // agent name
  reja:         number            // planned visits
  tashrif_soni: number            // actual visits done
  rejali_summa: number            // sum of on-plan orders (UZS)
  rejali_soni:  number            // count of on-plan orders
  ofplan_summa: number            // sum of off-plan orders
  ofplan_soni:  number            // count of off-plan orders
  qaytarish:    number            // returns count
  avatar_url?:  string
}

interface AgentKpiBoardProps {
  agents:    AgentKpi[]
  className?: string
  onAgentClick?: (id: number | string) => void
}

type Lang = "uz" | "ru"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:          "Agentlar hisoboti",
    subtitle:       "Bugun",
    total:          "Jami bugun",
    jami_savdo:     "Jami savdo",
    tashriflar:     "Tashrif",
    zakazlar:       "Zakazlar",
    rejali:         "Rejali",
    offplan:        "Off-plan",
    qaytarish:      "qaytarish",
    past_tashrif:   "Past tashrif",
    bugun_yoq:      "Bugun hali zakaz yo'q",
    empty_hint:     "Tashrif va savdo ma'lumotlari soat 9:00 dan keyin paydo bo'ladi",
  },
  ru: {
    title:          "Отчёт по агентам",
    subtitle:       "Сегодня",
    total:          "Всего сегодня",
    jami_savdo:     "Продажи",
    tashriflar:     "Визиты",
    zakazlar:       "Заказы",
    rejali:         "По плану",
    offplan:        "Вне плана",
    qaytarish:      "возвратов",
    past_tashrif:   "Мало визитов",
    bugun_yoq:      "Сегодня заказов ещё нет",
    empty_hint:     "Данные появятся после 9:00",
  },
}

// ─── Formatters ─────────────────────────────────────────────

function formatUzs(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt  = new Intl.NumberFormat(intl, { maximumFractionDigits: 1 })
  if (amount >= 1_000_000_000) return `${fmt.format(amount / 1_000_000_000)} mlrd so'm`
  if (amount >= 1_000_000)     return `${fmt.format(amount / 1_000_000)} mln so'm`
  if (amount >= 10_000)        return `${fmt.format(amount / 1_000)} ming so'm`
  return `${fmt.format(amount)} so'm`
}

// ─── Helpers ────────────────────────────────────────────────

function visitPct(done: number, plan: number): number {
  if (plan <= 0) return 0
  return Math.min(100, Math.round((done / plan) * 100))
}

function progressTone(pct: number) {
  if (pct >= 70) return "bg-emerald-500"
  if (pct >= 40) return "bg-amber-500"
  if (pct >= 20) return "bg-orange-500"
  return "bg-rose-500"
}

// Initials gradient bucket — stable per agent id hash
const GRADIENT_BUCKETS = [
  "from-emerald-500/40 to-emerald-500/10",
  "from-blue-500/40 to-blue-500/10",
  "from-violet-500/40 to-violet-500/10",
  "from-amber-500/40 to-amber-500/10",
  "from-rose-500/40 to-rose-500/10",
  "from-cyan-500/40 to-cyan-500/10",
]

function agentGradient(id: number | string): string {
  const n = typeof id === "number" ? id : [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADIENT_BUCKETS[n % GRADIENT_BUCKETS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

// ─── Medal for top 3 ────────────────────────────────────────

const MEDALS: Record<number, { icon: typeof Trophy; ring: string; glow: string }> = {
  1: { icon: Trophy, ring: "ring-amber-400/60",  glow: "from-amber-500/40 via-amber-500/10 to-transparent" },
  2: { icon: Medal,  ring: "ring-slate-300/60",  glow: "from-slate-400/40 via-slate-400/10 to-transparent" },
  3: { icon: Award,  ring: "ring-orange-400/50", glow: "from-orange-500/40 via-orange-500/10 to-transparent" },
}

// ─── Agent row ──────────────────────────────────────────────

interface AgentRowProps {
  agent:  AgentKpi
  rank:   number
  lang:   Lang
  onClick?: (id: number | string) => void
  index:  number
}

function AgentRow({ agent, rank, lang, onClick, index }: AgentRowProps) {
  const L = LABELS[lang]
  const jami = agent.rejali_summa + agent.ofplan_summa
  const zakaz_soni = agent.rejali_soni + agent.ofplan_soni
  const pct = visitPct(agent.tashrif_soni, agent.reja)
  const medal = MEDALS[rank]
  const lowVisits = pct < 20
  const hasReturns = agent.qaytarish > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(agent.id)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl p-5",
        "transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-black/5",
        medal ? cn("ring-1", medal.ring) : "border-border/60",
        onClick ? "cursor-pointer" : "",
      )}
    >
      {/* Halo for top 3 */}
      {medal && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full blur-3xl bg-gradient-to-br",
            medal.glow,
          )}
        />
      )}

      <div className="relative flex items-center gap-4">
        {/* Rank */}
        <div className="shrink-0 w-8 text-center">
          {medal ? (
            <medal.icon
              className={cn(
                "w-6 h-6 mx-auto",
                rank === 1 && "text-amber-500",
                rank === 2 && "text-slate-400",
                rank === 3 && "text-orange-500",
              )}
            />
          ) : (
            <span className="text-sm font-bold text-muted-foreground tabular-nums">
              {rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div
          className={cn(
            "shrink-0 w-12 h-12 rounded-2xl ring-1 ring-border/60 flex items-center justify-center font-semibold text-foreground bg-gradient-to-br",
            agentGradient(agent.id),
          )}
        >
          {initials(agent.ism)}
        </div>

        {/* Agent name + sub line */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground truncate">
            {agent.ism}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {L.rejali}: {agent.rejali_soni}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {L.offplan}: {agent.ofplan_soni}
            </span>
            {hasReturns && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {agent.qaytarish} {L.qaytarish}
              </span>
            )}
          </div>
        </div>

        {/* Metrics cluster */}
        <div className="hidden sm:flex items-center gap-4 text-right">
          <div className="min-w-[90px]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.jami_savdo}
            </p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {formatUzs(jami, lang)}
            </p>
          </div>
          <div className="min-w-[70px]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.zakazlar}
            </p>
            <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
              {zakaz_soni}
            </p>
          </div>
          <div className="min-w-[100px]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {L.tashriflar}
            </p>
            <p
              className={cn(
                "text-base font-bold tabular-nums mt-0.5",
                pct >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                pct >= 40 ? "text-amber-600 dark:text-amber-400" :
                            "text-rose-600 dark:text-rose-400",
              )}
            >
              {agent.tashrif_soni}/{agent.reja}
              <span className="text-[11px] ml-1 text-muted-foreground font-medium">
                ({pct}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-only metrics row */}
      <div className="sm:hidden relative mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">{L.jami_savdo}</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatUzs(jami, lang)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">{L.zakazlar}</p>
          <p className="text-sm font-bold text-foreground tabular-nums">{zakaz_soni}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">{L.tashriflar}</p>
          <p className={cn(
            "text-sm font-bold tabular-nums",
            pct >= 70 ? "text-emerald-600 dark:text-emerald-400" :
            pct >= 40 ? "text-amber-600 dark:text-amber-400" :
                        "text-rose-600 dark:text-rose-400",
          )}>
            {agent.tashrif_soni}/{agent.reja} ({pct}%)
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", progressTone(pct))}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: index * 0.04 + 0.15, ease: "easeOut" }}
        />
      </div>

      {/* Warning badges */}
      {(lowVisits || hasReturns) && (
        <div className="relative mt-3 flex flex-wrap gap-2">
          {lowVisits && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              {L.past_tashrif}
            </span>
          )}
          {hasReturns && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[11px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              {agent.qaytarish} {L.qaytarish}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main export ────────────────────────────────────────────

export default function AgentKpiBoard({
  agents,
  className,
  onAgentClick,
}: AgentKpiBoardProps) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  // Sort by total sales desc
  const ranked = [...agents]
    .map(a => ({
      ...a,
      _total: a.rejali_summa + a.ofplan_summa,
    }))
    .sort((a, b) => b._total - a._total)

  const grandTotal = ranked.reduce((s, a) => s + a._total, 0)

  if (ranked.length === 0) {
    return (
      <div className={cn(
        "rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center",
        className,
      )}>
        <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{L.bugun_yoq}</h3>
        <p className="text-sm text-muted-foreground mt-1">{L.empty_hint}</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">{L.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider leading-none">
              {L.total}
            </p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200 tabular-nums mt-0.5">
              {formatUzs(grandTotal, lang)}
            </p>
          </div>
        </div>
      </div>

      {/* Agent rows */}
      <div className="space-y-3">
        {ranked.map((agent, i) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            rank={i + 1}
            lang={lang}
            onClick={onAgentClick}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
