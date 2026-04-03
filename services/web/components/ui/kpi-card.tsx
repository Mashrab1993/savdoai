import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  className?: string
}

export function KpiCard({ title, value, change, changeLabel, icon: Icon, iconColor = "text-primary", className }: KpiCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-border/70 transition-colors", className)}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={cn("p-2 rounded-lg bg-secondary shrink-0", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1.5">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            )}
            <span className={cn("text-xs font-medium", isPositive ? "text-green-500" : "text-destructive")}>
              {isPositive ? "+" : ""}{change}%
            </span>
            {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
          </div>
        )}
        {change === undefined && changeLabel && (
          <p className="text-xs text-muted-foreground mt-1.5">{changeLabel}</p>
        )}
      </div>
    </div>
  )
}
