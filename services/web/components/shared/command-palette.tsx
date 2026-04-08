"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Package, CreditCard, FileText, BarChart3,
  Settings, ShoppingCart, Gift, MapPin, Activity, Award, Search,
  Zap, Star, RefreshCw, Landmark, Brain, Target, Link2, Wallet,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════
//  COMMAND PALETTE — Cmd+K / Ctrl+K
//  Spotlight (macOS) / VS Code Command Palette analog
//  Har qanday sahifaga, funksiyaga, klientga tez o'tish
// ═══════════════════════════════════════════════════════════

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: any
  action: () => void
  category: string
  keywords?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const go = useCallback((path: string) => {
    router.push(path)
    setOpen(false)
    setQuery("")
  }, [router])

  const commands: CommandItem[] = [
    // Navigation
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => go("/dashboard"), category: "Sahifalar", keywords: "bosh sahifa uy" },
    { id: "live", label: "🔴 Live Dashboard", icon: Activity, action: () => go("/live"), category: "Sahifalar", keywords: "jonli real-time" },
    { id: "sales", label: "Yangi sotuv", icon: ShoppingCart, action: () => go("/sales"), category: "Amallar", keywords: "sotuv savdo buyurtma" },
    { id: "clients", label: "Klientlar", icon: Users, action: () => go("/clients"), category: "Sahifalar", keywords: "klient mijoz do'kon" },
    { id: "products", label: "Tovarlar", icon: Package, action: () => go("/products"), category: "Sahifalar", keywords: "tovar mahsulot ombor" },
    { id: "debts", label: "Qarzlar", icon: CreditCard, action: () => go("/debts"), category: "Sahifalar", keywords: "qarz nasiya qarzdor" },
    { id: "reports", label: "Hisobotlar", icon: FileText, action: () => go("/reports"), category: "Sahifalar", keywords: "hisobot report" },

    // Pro features
    { id: "moliya", label: "💼 Moliyaviy hisobotlar", icon: Wallet, action: () => go("/moliya"), category: "Pro", keywords: "foyda zarar balans pul oqimi P&L" },
    { id: "analytics", label: "📊 Pro Analitika", icon: BarChart3, action: () => go("/pro-analitika"), category: "Pro", keywords: "abc xyz matritsa churn tahlil" },
    { id: "klient360", label: "👤 Klient 360°", icon: Users, action: () => go("/klient360"), category: "Pro", keywords: "klient profil 360 crm" },
    { id: "leaderboard", label: "🏆 Leaderboard", icon: Award, action: () => go("/leaderboard"), category: "Pro", keywords: "reyting gamification badge xp" },
    { id: "aksiya", label: "🎁 Aksiyalar", icon: Gift, action: () => go("/aksiya"), category: "Pro", keywords: "aksiya chegirma bonus" },
    { id: "tashrif", label: "📍 Tashriflar", icon: MapPin, action: () => go("/tashrif"), category: "Pro", keywords: "checkin checkout tashrif gps" },
    { id: "webhook", label: "🔗 Webhook", icon: Link2, action: () => go("/webhook"), category: "Pro", keywords: "webhook integratsiya 1C telegram" },

    // Settings
    { id: "config", label: "⚙️ Sozlamalar", icon: Settings, action: () => go("/config"), category: "Sozlamalar", keywords: "sozlama config setting" },
    { id: "sync", label: "🔄 Sync log", icon: RefreshCw, action: () => go("/sync-log"), category: "Sozlamalar", keywords: "sync sinxron log" },
  ]

  // Filter
  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase()
        return c.label.toLowerCase().includes(q) ||
               c.description?.toLowerCase().includes(q) ||
               c.keywords?.toLowerCase().includes(q)
      })
    : commands

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => { setSelectedIndex(0) }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <Search className="w-3.5 h-3.5" />
        <span>Qidirish...</span>
        <kbd className="hidden sm:inline text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sahifa, funksiya yoki klient qidiring..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <kbd className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{category}</div>
                {items.map((cmd, i) => {
                  const globalIdx = filtered.indexOf(cmd)
                  const Icon = cmd.icon
                  return (
                    <button key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        globalIdx === selectedIndex ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${globalIdx === selectedIndex ? "text-emerald-600" : "text-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{cmd.label}</div>
                        {cmd.description && <div className="text-[11px] text-gray-500 truncate">{cmd.description}</div>}
                      </div>
                      {globalIdx === selectedIndex && (
                        <kbd className="text-[10px] text-emerald-500">↵</kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                &quot;{query}&quot; topilmadi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
