import type { Locale } from "./i18n"

/**
 * Format currency for UZS (Uzbek Som).
 * Returns "1.5M so'm" for millions, "500K so'm" for thousands, "123 so'm" for regular.
 * Uzbek and Russian both use "so'm" for the currency.
 */
export function formatCurrency(amount: number, _locale?: Locale): string {
  const n = Number(amount) || 0
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M so'm`
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K so'm`
  }
  return `${n} so'm`
}

/**
 * Format full currency value without abbreviation.
 * Shows thousands separator for readability.
 */
export function formatCurrencyFull(amount: number, _locale?: Locale): string {
  const n = Number(amount) || 0
  return `${n.toLocaleString("en-US")} so'm`
}

/**
 * Format date string for display in charts and tables.
 * Converts dates like "2025-03-19" to locale-specific format.
 */
export function formatDateShort(dateStr: string, locale: Locale): string {
  try {
    const date = new Date(dateStr + "T00:00:00")
    if (isNaN(date.getTime())) return dateStr
    
    if (locale === "ru") {
      // Format: "19 мар" (day month abbr)
      const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
      return `${date.getDate()} ${months[date.getMonth()]}`
    }
    
    // Uzbek: "19-mar"
    const months = ["jan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"]
    return `${date.getDate()}-${months[date.getMonth()]}`
  } catch {
    return dateStr
  }
}

/**
 * Format percentage with locale-specific decimal separator.
 */
export function formatPercent(value: number, decimals = 1, locale?: Locale): string {
  const formatted = value.toFixed(decimals)
  if (locale === "ru") {
    return formatted.replace(".", ",") + "%"
  }
  return formatted + "%"
}

/**
 * Format time relative to now (e.g., "2 minutes ago", "2 daqiqa oldin").
 * Returns the relative time string key that should be looked up in i18n.
 */
export function getRelativeTimeKey(minutesAgo: number): "mins" | "hours" | "days" | "yesterday" {
  if (minutesAgo < 60) return "mins"
  if (minutesAgo < 24 * 60) return "hours"
  if (minutesAgo < 2 * 24 * 60) return "yesterday"
  return "days"
}

/**
 * Format number with thousands separator using en-US locale for consistency.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US")
}

/**
 * Safe deep access to translation object with fallback.
 * Returns empty string if key path doesn't exist.
 */
export function safeT(obj: any, keyPath: string, fallback = ""): any {
  try {
    const keys = keyPath.split(".")
    let value = obj
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) return fallback
    }
    return value ?? fallback
  } catch {
    return fallback
  }
}
