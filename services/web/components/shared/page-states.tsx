"use client"

import { AlertCircle, RefreshCw, Inbox, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function PageLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  )
}

/** Jadval skeleton — sahifalarda jadval yuklanayotganda */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/50 border-b border-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

/** AI thinking state — for pages where the model needs seconds to respond */
export function AILoading({ label }: { label?: string }) {
  const { locale } = useLocale()
  const text = label ?? (locale === "ru" ? "AI анализирует..." : "AI tahlil qilmoqda...")
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{text}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {locale === "ru" ? "Обычно 5-20 секунд" : "Odatda 5-20 soniya"}
        </p>
      </div>
    </div>
  )
}

/** KPI karta skeleton */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-5 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────
interface PageErrorProps {
  message: string
  onRetry?: () => void
}

export function PageError({ message, onRetry }: PageErrorProps) {
  const { locale } = useLocale()
  const heading  = locale === "ru" ? "Произошла ошибка"  : "Xato yuz berdi"
  const retryLbl = locale === "ru" ? "Повторить"         : "Qayta urinish"

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="p-3 rounded-full bg-destructive/10">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{heading}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          {retryLbl}
        </Button>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
interface PageEmptyProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageEmpty({ title, subtitle, action }: PageEmptyProps) {
  const { locale } = useLocale()
  const defaultTitle = locale === "ru" ? "Данные не найдены" : "Ma'lumot topilmadi"

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="p-3 rounded-full bg-muted">
        <Inbox className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title ?? defaultTitle}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
