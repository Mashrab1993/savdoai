/**
 * Centralized formatting for SavdoAI (so'm, dates, numbers).
 * Use these in tables, charts, and empty states for consistency.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + " so'm"
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

export function formatDate(dateStr: string, locale: string = "uz"): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(dateStr: string, locale: string = "uz"): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}
