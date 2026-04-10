"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, AlertCircle, Info, CheckCircle2, Settings } from "lucide-react"

interface Notification {
  id: number
  turi: "info" | "warning" | "success" | "error"
  sarlavha: string
  matn: string
  vaqt: string
  oqilgan: boolean
}

const DEMO: Notification[] = [
  { id: 1, turi: "warning", sarlavha: "Zaxira kam!", matn: "5 ta tovar zaxirasi 5 dan kam qoldi", vaqt: "5 daqiqa oldin", oqilgan: false },
  { id: 2, turi: "success", sarlavha: "Yangi buyurtma", matn: "Karim Aliyev 245,000 so'mlik buyurtma berdi", vaqt: "20 daqiqa oldin", oqilgan: false },
  { id: 3, turi: "error", sarlavha: "Qarz oshdi", matn: "Asror Polvonov qarzi 1.5M so'mga yetdi", vaqt: "1 soat oldin", oqilgan: true },
  { id: 4, turi: "info", sarlavha: "Hisobot tayyor", matn: "Bugungi sotuv hisoboti tayyor", vaqt: "2 soat oldin", oqilgan: true },
]

const ICONS = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  warning: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  error: { icon: X, color: "text-red-600", bg: "bg-red-50 border-red-200" },
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all")
  const [notifications, setNotifications] = useState(DEMO)

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.oqilgan
    if (filter === "read") return n.oqilgan
    return true
  })

  const unreadCount = notifications.filter(n => !n.oqilgan).length

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-7 h-7 text-emerald-600" />
              Bildirishnomalar
              {unreadCount > 0 && <Badge className="bg-red-500">{unreadCount}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Tizim bildirishnomalari va ogohlantirishlar</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotifications(notifications.map(n => ({ ...n, oqilgan: true })))}>
              <Check className="w-4 h-4 mr-1" /> Hammasini o'qildi
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" /> Sozlamalar
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === "all" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
            Barchasi ({notifications.length})
          </button>
          <button onClick={() => setFilter("unread")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === "unread" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
            O'qilmagan ({unreadCount})
          </button>
          <button onClick={() => setFilter("read")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === "read" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
            O'qilgan ({notifications.length - unreadCount})
          </button>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border p-10 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">Bildirishnomalar yo'q</p>
            </div>
          ) : filtered.map(n => {
            const I = ICONS[n.turi]
            return (
              <div key={n.id} className={`rounded-xl border p-4 transition ${n.oqilgan ? "bg-white dark:bg-gray-900" : I.bg}`}>
                <div className="flex items-start gap-3">
                  <I.icon className={`w-5 h-5 ${I.color} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold">{n.sarlavha}</div>
                      <div className="text-xs text-muted-foreground shrink-0">{n.vaqt}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{n.matn}</div>
                  </div>
                  {!n.oqilgan && (
                    <button onClick={() => setNotifications(notifications.map(x => x.id === n.id ? { ...x, oqilgan: true } : x))} className="text-xs text-emerald-600 hover:underline shrink-0">
                      O'qildi
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
