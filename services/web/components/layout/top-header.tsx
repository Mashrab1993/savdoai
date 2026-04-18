"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Search, Moon, Sun, ChevronDown, Menu, Settings, LogOut,
         AlertTriangle, PackageMinus, Clock } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { CommandPalette, useCommandPalette } from "@/components/command-palette"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"
import { useAuth } from "@/lib/auth/auth-context"
import Link from "next/link"
import { cn } from "@/lib/utils"


// ── Notification Bell — real-time bildirishnomalar ────────────
function NotificationBell({ locale }: { locale: string }) {
  const [items, setItems] = useState<Array<{
    tur: string; darajasi: string; matn: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { notificationService } = await import("@/lib/api/services")
      const data = await notificationService.list()
      setItems(data?.items ?? [])
    } catch {
      // Silent fail — notification is optional
    } finally {
      setLoading(false)
    }
  }, [])

  // Har 2 daqiqada yangilash
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 120_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const count = items.length
  const hasUrgent = items.some(i => i.darajasi === "xavfli")

  const iconMap: Record<string, typeof AlertTriangle> = {
    qarz_muddati: AlertTriangle,
    kam_qoldiq: PackageMinus,
    xarajat_tasdiq: Clock,
  }

  const colorMap: Record<string, string> = {
    xavfli: "text-red-500",
    ogohlantirish: "text-yellow-500",
    info: "text-blue-500",
  }

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchNotifications() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8"
                aria-label={locale === "uz" ? "Bildirishnomalar" : "Уведомления"}>
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1",
              hasUrgent ? "bg-red-500" : "bg-yellow-500"
            )}>
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-semibold">
          {locale === "uz" ? "Bildirishnomalar" : "Уведомления"}
          {count > 0 && <span className="ml-1 text-muted-foreground">({count})</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && items.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {locale === "uz" ? "Yuklanmoqda..." : "Загрузка..."}
          </div>
        ) : count === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {locale === "uz" ? "Yangi bildirishnomalar yo'q" : "Нет уведомлений"}
          </div>
        ) : (
          items.map((item, idx) => {
            const Icon = iconMap[item.tur] || Bell
            const color = colorMap[item.darajasi] || "text-muted-foreground"
            return (
              <DropdownMenuItem key={idx} className="flex items-start gap-2.5 py-2.5 cursor-default">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
                <span className="text-xs text-foreground leading-snug">{item.matn}</span>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface TopHeaderProps {
  title: string
  onMenuClick?: () => void
}

export function TopHeader({ title, onMenuClick }: TopHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { locale } = useLocale()
  const h = translations.header
  const { user, logout } = useAuth()
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette()

  const displayName = user?.ism?.trim() || user?.full_name?.trim() || user?.username?.trim() || user?.dokon_nomi?.trim() || ""
  const shortName = displayName.split(" ")[0] || ""
  const displayEmail = user?.telefon?.trim() || (user?.email?.trim() ?? "")

  const initials = displayName
    ? displayName.split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  // Role label with sensible fallback
  const roleLabel = user?.role?.trim()
    ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase())
    : (locale === "uz" ? "Admin" : "Администратор")

  return (
    <>
    <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border/70 bg-card/95 backdrop-blur-sm shrink-0 sticky top-0 z-20">
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden h-8 w-8 shrink-0"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 ml-auto shrink-0">

        {/* Global search — opens Cmd+K palette */}
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="relative hidden lg:flex items-center gap-2 mr-1 h-8 px-2.5 pr-2 rounded-lg border border-border/70 bg-background hover:bg-accent/50 transition-colors"
          aria-label={h.search[locale]}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{h.search[locale]}</span>
          <kbd className="ml-2 hidden xl:inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        {/* Mobile search icon — opens palette */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCmdOpen(true)}
          className="lg:hidden h-8 w-8"
          aria-label={h.search[locale]}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Language */}
        <LanguageSwitcher />

        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 relative"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications — live data */}
        <NotificationBell locale={locale} />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 h-8 px-2 rounded-lg",
                "hover:bg-accent focus-visible:ring-1"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold leading-none">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {shortName && (
                <span className="hidden md:inline text-xs font-medium text-foreground truncate max-w-20">
                  {shortName}
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="py-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {displayName || roleLabel}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {displayEmail || roleLabel}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-3.5 h-3.5" />
                {locale === "uz" ? "Sozlamalar" : "Настройки"}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
              onClick={logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              {h.signout[locale]}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  )
}
