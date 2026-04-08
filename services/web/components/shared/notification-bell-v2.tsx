"use client"

import { useState, useEffect, useRef } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Bell, X, ShoppingCart, Users, CreditCard, Package, AlertTriangle, Gift, MapPin } from "lucide-react"

interface Notification {
  id: string
  type: string
  emoji: string
  title: string
  body: string
  time: string
  read: boolean
}

const ICON_MAP: Record<string, any> = {
  sotuv: ShoppingCart, klient: Users, qarz: CreditCard,
  qoldiq: Package, xato: AlertTriangle, aksiya: Gift, checkin: MapPin,
}

/**
 * SavdoAI — Real-time Notification Bell
 * WebSocket orqali jonli bildirishnomalar.
 * 
 * top-header.tsx ga qo'shish:
 *   import { NotificationBell } from "@/components/shared/notification-bell-v2"
 *   <NotificationBell />
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)
  const { lastMessage } = useWebSocket()

  // WebSocket dan kelgan xabarlarni qo'shish
  useEffect(() => {
    if (lastMessage?.type === "live_event" || lastMessage?.type === "notification") {
      const n: Notification = {
        id: `${Date.now()}_${Math.random()}`,
        type: lastMessage.turi || lastMessage.type || "info",
        emoji: lastMessage.emoji || "📌",
        title: lastMessage.sarlavha || lastMessage.title || "Yangilik",
        body: lastMessage.tafsilot || lastMessage.body || "",
        time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        read: false,
      }
      setNotifications(prev => [n, ...prev].slice(0, 50))
      setUnread(prev => prev + 1)
    }
  }, [lastMessage])

  // Tashqariga bosganda yopish
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnread(0)
  }

  return (
    <div ref={bellRef} className="relative">
      {/* Bell button */}
      <button onClick={() => { setOpen(!open); if (!open) markAllRead() }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Bell className={`w-5 h-5 ${unread > 0 ? "text-emerald-600" : "text-gray-400"}`} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold">Bildirishnomalar</span>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-red-500">Tozalash</button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => {
              const IconComp = ICON_MAP[n.type] || Bell
              return (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                  !n.read ? "bg-emerald-50/50 dark:bg-emerald-900/5" : ""
                }`}>
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${!n.read ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <IconComp className={`w-3.5 h-3.5 ${!n.read ? "text-emerald-600" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{n.emoji} {n.title}</div>
                    {n.body && <div className="text-[11px] text-gray-500 mt-0.5 truncate">{n.body}</div>}
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{n.time}</span>
                </div>
              )
            })}
            {notifications.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div className="text-xs">Bildirishnomalar yo&apos;q</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
