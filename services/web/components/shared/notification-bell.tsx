"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { notificationService } from "@/lib/api/services"
import { useWebSocket } from "@/hooks/use-websocket"
import { useLocale } from "@/lib/locale-context"

interface BellItem {
  id?: number
  matn: string
  turi?: string
  tur?: string
  oqilgan?: boolean
  vaqt?: string
  yaratilgan?: string
  darajasi?: string
}

/**
 * Bildirishnoma bell — header da ko'rsatiladi
 * WebSocket orqali real-time yangilanadi
 */
export function NotificationBell() {
  const { locale } = useLocale()
  const { data, refetch } = useApi(notificationService.list)
  const { lastMessage } = useWebSocket()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (lastMessage?.type === "sync" || lastMessage?.type === "bildirishnoma") {
      refetch()
    }
  }, [lastMessage, refetch])

  const items: BellItem[] = (data as any)?.items ?? []
  const unread = items.filter((n) => !n.oqilgan).length

  const formatTime = (vaqt?: string) => {
    if (!vaqt) return ""
    try {
      const d = new Date(vaqt)
      const now = new Date()
      const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
      if (diff < 60) return locale === "uz" ? "hozirgina" : "только что"
      if (diff < 3600)
        return `${Math.floor(diff / 60)} ${locale === "uz" ? "daq" : "мин"}`
      if (diff < 86400)
        return `${Math.floor(diff / 3600)} ${locale === "uz" ? "soat" : "ч"}`
      return d.toLocaleDateString()
    } catch {
      return ""
    }
  }

  const icon = (turi?: string) => {
    switch (turi) {
      case "sotuv":
        return "💰"
      case "qarz":
        return "💸"
      case "kam_qoldiq":
        return "📦"
      case "kirim":
        return "📥"
      case "buyurtma":
        return "🛒"
      default:
        return "🔔"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="font-medium text-sm">
            {locale === "uz" ? "Bildirishnomalar" : "Уведомления"}
            {unread > 0 && ` (${unread})`}
          </span>
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">
                {locale === "uz"
                  ? "Bildirishnomalar yo'q"
                  : "Нет уведомлений"}
              </p>
            </div>
          ) : (
            items.map((n, idx) => (
              <div
                key={n.id ?? idx}
                className={cn(
                  "px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors",
                  !n.oqilgan && "bg-primary/5"
                )}
              >
                <div className="flex gap-2">
                  <span className="text-base shrink-0">{icon(n.turi || n.tur)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.matn}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(n.yaratilgan || n.vaqt)}
                    </p>
                  </div>
                  {!n.oqilgan && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
