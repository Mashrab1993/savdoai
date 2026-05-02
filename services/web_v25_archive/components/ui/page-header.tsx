"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Premium page header — gradient icon badge, title, subtitle, action slot.
 *
 * <PageHeader
 *   icon={ShoppingCart}
 *   title="Sotuvlar"
 *   subtitle="Barcha savdo operatsiyalari"
 *   gradient="emerald"
 *   action={<Button>Yangi sotuv</Button>}
 * />
 */

type Gradient = "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan"

const HALO: Record<Gradient, string> = {
  blue:    "from-blue-500/40 via-blue-500/10 to-transparent",
  emerald: "from-emerald-500/40 via-emerald-500/10 to-transparent",
  amber:   "from-amber-500/40 via-amber-500/10 to-transparent",
  rose:    "from-rose-500/40 via-rose-500/10 to-transparent",
  violet:  "from-violet-500/40 via-violet-500/10 to-transparent",
  cyan:    "from-cyan-500/40 via-cyan-500/10 to-transparent",
}

const BADGE: Record<Gradient, string> = {
  blue:    "bg-blue-500/15 text-blue-500 ring-blue-500/30",
  emerald: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  amber:   "bg-amber-500/15 text-amber-500 ring-amber-500/30",
  rose:    "bg-rose-500/15 text-rose-500 ring-rose-500/30",
  violet:  "bg-violet-500/15 text-violet-500 ring-violet-500/30",
  cyan:    "bg-cyan-500/15 text-cyan-500 ring-cyan-500/30",
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  gradient = "blue",
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  subtitle?: string
  gradient?: Gradient
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 md:p-6 shadow-sm",
        className,
      )}
    >
      {/* Aurora halo */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br",
          HALO[gradient],
        )}
      />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {Icon && (
            <div className={cn("p-3 rounded-2xl ring-1 shrink-0", BADGE[gradient])}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </motion.div>
  )
}
