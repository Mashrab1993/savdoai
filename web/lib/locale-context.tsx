"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Locale } from "./i18n"

const STORAGE_KEY = "savdoai_locale"

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "uz"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "uz" || stored === "ru") return stored
  return "uz"
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "uz",
  setLocale: () => {},
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale())

  useEffect(() => {
    document.documentElement.lang = locale === "uz" ? "uz" : "ru"
    document.documentElement.setAttribute("lang", locale === "uz" ? "uz" : "ru")
  }, [locale])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l)
    }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
