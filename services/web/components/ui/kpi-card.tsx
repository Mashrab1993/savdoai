"use client"

import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  gradient?: "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan" | "slate"
  className?: string
  delay?: number
}

const GRADIENTS: Record<string, string> = {
  blue:    "from-blue-500/20 via-blue-500/5 to-transparent",
  emerald: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  amber:   "from-amber-500/20 via-amber-500/5 to-transparent",
  rose:    "from-rose-500/20 via-rose-500/5 to-transparent",
  violet:  "from-violet-500/20 via-violet-500/5 to-transparent",
  cyan:    "from-cyan-500/20 via-cyan-500/5 to-transparent",
  slate:   "from-slate-500/15 via-slate-500/5 to-transparent",
}

const ICON_BG: Record<string, string> = {
  blue:    "bg-blue-500/15 text-blue-500 ring-blue-500/20",
  emerald: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/20",
  amber:   "bg-amber-500/15 text-amber-500 ring-amber-500/20",
  rose:    "bg-rose-500/15 text-rose-500 ring-rose-500/20",
  violet:  "bg-violet-500/15 text-violet-500 ring-violet-500/20",
  cyan:    "bg-cyan-500/15 text-cyan-500 ring-cyan-500/20",
  slate:   "bg-slate-500/15 text-slate-500 ring-slate-500/20",
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  gradient = "slate",
  className,
  delay = 0,
}: KpiCardProps) {
  const isPositive = (change ?? 0) >= 0
  const grad = GRADIENTS[gradient]
  const iconBg = ICON_BG[gradient]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl shadow-sm",
        "before:absolute before:inset-0 before:-z-0 before:bg-gradient-to-br before:pointer-events-none",
        `before:${grad}`,
        "hover:border-border hover:shadow-lg hover:shadow-black/5 transition-all duration-300",
        className,
      )}
    >
      {/* Aurora glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-40 bg-gradient-to-br",
          grad,
        )}
      />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={cn("p-2 rounded-xl ring-1 shrink-0", iconBg)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span
                className={cn(
                  "text-xs font-semibold",
                  isPositive ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
