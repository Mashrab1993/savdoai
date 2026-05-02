"use client"

import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const locales = [
  { code: "uz" as const, label: "O'zbek", short: "UZ" },
  { code: "ru" as const, label: "Русский", short: "RU" },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const current = locales.find(l => l.code === locale) ?? locales[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 text-sm font-medium">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {locales.map(l => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              locale === l.code && "text-primary font-semibold"
            )}
          >
            <span>{l.label}</span>
            <span className="text-xs text-muted-foreground">{l.short}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
