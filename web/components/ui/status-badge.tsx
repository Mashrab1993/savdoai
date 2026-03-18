"use client"

import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"

type StatusVariant = "active" | "inactive" | "prospect" | "in-stock" | "low-stock" | "out-of-stock" | "pending" | "overdue" | "paid" | "partial" | "draft" | "sent" | "approved" | "rejected"

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const variantMap: Record<StatusVariant, string> = {
  active:        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid:          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "in-stock":    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sent:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pending:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  partial:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "low-stock":   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  draft:         "bg-secondary text-secondary-foreground",
  overdue:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "out-of-stock":"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  inactive:      "bg-secondary text-muted-foreground",
  prospect:      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  approved:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const statusToI18nKey: Record<StatusVariant, keyof typeof translations.status> = {
  active: "active", inactive: "inactive", prospect: "prospect",
  "in-stock": "inStock", "low-stock": "lowStock", "out-of-stock": "outOfStock",
  pending: "pending", overdue: "overdue", paid: "paid", partial: "partial",
  draft: "draft", sent: "sent", approved: "approved", rejected: "rejected",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { locale } = useLocale()
  const key = statusToI18nKey[status]
  const label = key ? translations.status[key][locale] : status
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", variantMap[status], className)}>
      {label}
    </span>
  )
}
