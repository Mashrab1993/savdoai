"use client"

import { useEffect } from "react"
import { useLocale } from "@/lib/locale-context"

/**
 * Keeps the <html lang> attribute in sync with the active locale.
 * Renders nothing — purely a side-effect component.
 */
export function LangSync() {
  const { locale } = useLocale()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
