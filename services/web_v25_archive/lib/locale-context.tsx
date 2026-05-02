"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Locale } from "./i18n"

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "uz",
  setLocale: () => {},
})

const LOCALE_STORAGE_KEY = "savdo-locale"

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("uz")
  const [mounted, setMounted] = useState(false)

  // Restore locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    if (stored && (stored === "uz" || stored === "ru")) {
      setLocale(stored)
    }
    setMounted(true)
  }, [])

  // Persist locale to localStorage on change
  const handleSetLocale = (l: Locale) => {
    setLocale(l)
    localStorage.setItem(LOCALE_STORAGE_KEY, l)
  }

  // Prevent hydration mismatch by not rendering children until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
