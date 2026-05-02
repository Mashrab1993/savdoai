"use client"

/**
 * NotificationCenter — premium bell + dropdown, upgraded.
 *
 * Previously used hardcoded bg-gray/bg-emerald-50 colors (dark-theme
 * unsafe) and no i18n. Rewritten with:
 *   - Theme-safe semantic tokens (bg-card/60, text-muted-foreground,
 *     border-border, text-foreground)
 *   - Severity badges via ring + tinted bg (emerald/rose/amber/blue)
 *   - Framer-motion entrance + stagger on items
 *   - useLocale() uz/ru labels
 *   - Keyboard: Esc closes, click-outside closes
 *   - Auto-refresh every 60s
 *   - Mark single + mark all
 *   - Relative time in uz/ru
 *
 * Backend contract unchanged:
 *   GET  /bildirishnoma?limit=20 → { bildirishnomalar[], oqilmagan_soni }
 *   PUT  /bildirishnoma/{id}/oqish
 *   PUT  /bildirishnoma/barchasi-oqildi
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, BellRing, CheckCheck, X,
  ShoppingCart, CreditCard, Package, AlertCircle, Settings,
  type LucideIcon,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

interface Item {
  id:         number
  turi:       string
  sarlavha:   string
  matn?:      string
  yaratilgan: string
  oqildi:     boolean
}

type Lang = "uz" | "ru"

const LABELS = {
  uz: {
    title:   "Bildirishnomalar",
    all:     "Hammasini o'qildi",
    empty:   "Bildirishnomalar yo'q",
    min:     (n: number) => `${n} daq`,
    hour:    (n: number) => `${n} soat`,
    day:     (n: number) => `${n} kun`,
    now:     "hozir",
  },
  ru: {
    title:   "Уведомления",
    all:     "Отметить все",
    empty:   "Нет уведомлений",
    min:     (n: number) => `${n} мин`,
    hour:    (n: number) => `${n} ч`,
    day:     (n: number) => `${n} дн`,
    now:     "сейчас",
  },
}

// ─── Notification type → icon + color tone ─────────────────

const TURI_META: Record<string, { Icon: LucideIcon; tone: string; dot: string }> = {
  sotuv: {
    Icon: ShoppingCart,
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
    dot:  "bg-emerald-500",
  },
  qarz: {
    Icon: CreditCard,
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30",
    dot:  "bg-rose-500",
  },
  ombor: {
    Icon: Package,
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30",
    dot:  "bg-amber-500",
  },
  topshiriq: {
    Icon: AlertCircle,
    tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30",
    dot:  "bg-blue-500",
  },
  tizim: {
    Icon: Settings,
    tone: "bg-slate-500/15 text-slate-600 dark:text-slate-400 ring-slate-500/30",
    dot:  "bg-slate-500",
  },
}
const DEFAULT_META = TURI_META.tizim!

// ─── Main ───────────────────────────────────────────────────

export function NotificationCenter() {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [items, setItems]   = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen]     = useState(false)
  const menuRef             = useRef<HTMLDivElement>(null)
  const btnRef              = useRef<HTMLButtonElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const authHeader = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {}
    const t = localStorage.getItem("auth_token")
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/bildirishnoma?limit=20`, {
        headers: authHeader(),
        credentials: "include",
      })
      if (!res.ok) return
      const d = await res.json()
      setItems(d.bildirishnomalar || [])
      setUnread(d.oqilmagan_soni || 0)
    } catch {
      // silent
    }
  }, [API, authHeader])

  // Initial load + periodic refresh
  useEffect(() => {
    load()
    const iv = window.setInterval(load, 60_000)
    return () => window.clearInterval(iv)
  }, [load])

  // Close on click-outside + Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t)) return
      if (btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const markRead = async (id: number) => {
    try {
      await fetch(`${API}/bildirishnoma/${id}/oqish`, {
        method:  "PUT",
        headers: authHeader(),
        credentials: "include",
      })
    } catch {
      // silent
    }
    setItems(prev => prev.map(n => (n.id === id ? { ...n, oqildi: true } : n)))
    setUnread(c => Math.max(0, c - 1))
  }

  const markAll = async () => {
    try {
      await fetch(`${API}/bildirishnoma/barchasi-oqildi`, {
        method:  "PUT",
        headers: authHeader(),
        credentials: "include",
      })
    } catch {
      // silent
    }
    setItems(prev => prev.map(n => ({ ...n, oqildi: true })))
    setUnread(0)
  }

  const ago = (iso: string): string => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const minutes = (Date.now() - d.getTime()) / 60_000
    if (minutes < 1)    return L.now
    if (minutes < 60)   return L.min(Math.floor(minutes))
    if (minutes < 1440) return L.hour(Math.floor(minutes / 60))
    return L.day(Math.floor(minutes / 1440))
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={L.title}
        aria-expanded={open}
        className={cn(
          "relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl",
          "text-muted-foreground hover:text-foreground hover:bg-card transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {unread > 0 ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute right-0 top-[calc(100%+8px)] z-50 w-80 sm:w-96 max-h-[min(80vh,32rem)] overflow-hidden",
              "rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/10",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/60">
              <p className="text-sm font-bold text-foreground">
                {L.title}
                {unread > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({unread})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAll}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    {L.all}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-96">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-muted">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{L.empty}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {items.map((n, i) => {
                    const meta = TURI_META[n.turi] || DEFAULT_META
                    const isUnread = !n.oqildi
                    return (
                      <motion.li
                        key={n.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.2 }}
                      >
                        <button
                          type="button"
                          onClick={() => isUnread && markRead(n.id)}
                          className={cn(
                            "w-full text-left p-3 flex items-start gap-3 hover:bg-muted/60 transition-colors",
                            isUnread && "bg-primary/5",
                          )}
                        >
                          <div className={cn(
                            "p-1.5 rounded-lg ring-1 shrink-0",
                            meta.tone,
                          )}>
                            <meta.Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-xs font-semibold text-foreground truncate",
                                isUnread && "font-bold",
                              )}>
                                {n.sarlavha}
                              </p>
                              {isUnread && (
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", meta.dot)} />
                              )}
                            </div>
                            {n.matn && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                {n.matn}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {ago(n.yaratilgan)}
                            </p>
                          </div>
                        </button>
                      </motion.li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
