"use client"

import { Bell, Search, Moon, Sun, ChevronDown, Menu, Settings, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface TopHeaderProps {
  title: string
  onMenuClick?: () => void
}

export function TopHeader({ title, onMenuClick }: TopHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { locale } = useLocale()
  const h = translations.header
  const { user, logout } = useAuth()

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
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
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

        {/* Global search — desktop only */}
        <div className="relative hidden lg:block mr-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={h.search[locale]}
            className="pl-8 w-44 h-8 bg-background text-xs border-border/60 focus-visible:ring-1"
          />
        </div>

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

        {/* Notifications — static indicator */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={h.notifications[locale]}
        >
          <Bell className="h-4 w-4" />
          {/* Neutral dot — shown only when backend sends unread notifications */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        </Button>

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
  )
}
