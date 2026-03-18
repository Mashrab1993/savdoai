"use client"

import { Bell, Search, Moon, Sun, ChevronDown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"

interface TopHeaderProps {
  title: string
}

export function TopHeader({ title }: TopHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { locale } = useLocale()
  const h = translations.header

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card shrink-0 gap-4">
      <h1 className="text-base font-semibold text-foreground truncate shrink-0">{title}</h1>

      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={h.search[locale]}
            className="pl-9 w-52 h-9 bg-background text-sm"
          />
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-0">
            3
          </Badge>
          <span className="sr-only">{h.notifications[locale]}</span>
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">AE</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">Alisher E.</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Alisher Ergashev</span>
                <span className="text-xs text-muted-foreground font-normal">alisher@savdoai.uz</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{h.profile[locale]}</DropdownMenuItem>
            <DropdownMenuItem>{h.team[locale]}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">{h.signout[locale]}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
