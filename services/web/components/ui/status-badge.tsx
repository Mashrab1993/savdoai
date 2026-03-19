import { cn } from "@/lib/utils"

type StatusVariant = "active" | "inactive" | "prospect" | "in-stock" | "low-stock" | "out-of-stock" | "pending" | "overdue" | "paid" | "partial" | "draft" | "sent" | "approved" | "rejected"

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const variantMap: Record<StatusVariant, string> = {
  active:        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid:          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  approved:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "in-stock":    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sent:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pending:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  partial:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "low-stock":   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  draft:         "bg-secondary text-secondary-foreground",
  overdue:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  rejected:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "out-of-stock":"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  inactive:      "bg-secondary text-muted-foreground",
  prospect:      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

const labelMap: Record<StatusVariant, string> = {
  active: "Faol", inactive: "Nofaol", prospect: "Potentsial",
  "in-stock": "Mavjud", "low-stock": "Kam qoldi", "out-of-stock": "Tugagan",
  pending: "Kutilmoqda", overdue: "Muddati o'tgan", paid: "To'langan", partial: "Qisman",
  draft: "Qoralama", sent: "Yuborilgan",
  approved: "Tasdiqlangan", rejected: "Rad etilgan",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", variantMap[status], className)}>
      {labelMap[status]}
    </span>
  )
}
