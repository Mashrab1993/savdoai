"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell, Check, X, AlertCircle, Info, CheckCircle2,
} from "lucide-react"
import Link from "next/link"

type Notification = {
  id: string
  turi: "info" | "warning" | "success" | "error"
  sarlavha: string
  matn: string
  href?: string
  oqilgan: boolean
}

const ICONS = {
  info:    { icon: Info,          color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10 border-blue-200" },
  warning: { icon: AlertCircle,   color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30" },
  success: { icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  error:   { icon: X,             color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-500/10 border-rose-500/30" },
}

async function api<T = unknown>(path: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
  const base  = process.env.NEXT_PUBLIC_API_URL || ""
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      type DashboardResp = {
        bugun_sotuv_jami?: number
        kam_qoldiq_soni?: number
        overdue_count?: number
        overdue_amount?: number
        jami_qarz?: number
        pending_expenses?: number
      }
      const d = await api<DashboardResp>("/api/v1/dashboard")
      const read = new Set(
        JSON.parse(localStorage.getItem("read_notifications") || "[]")
      )

      const list: Notification[] = []

      if ((d.overdue_count || 0) > 0) {
        const id = "overdue"
        list.push({
          id,
          turi:      "error",
          sarlavha:  `${d.overdue_count} ta qarz muddati o'tgan`,
          matn:      `Jami: ${Number(d.overdue_amount || 0).toLocaleString()} so'm. Darhol chora ko'ring!`,
          href:      "/debts",
          oqilgan:   read.has(id),
        })
      }

      if ((d.kam_qoldiq_soni || 0) > 0) {
        const id = "kam_qoldiq"
        list.push({
          id,
          turi:      "warning",
          sarlavha:  `${d.kam_qoldiq_soni} ta tovar kam qolgan`,
          matn:      "Zapasni tezroq to'ldiring — aks holda sotuv to'xtab qolishi mumkin.",
          href:      "/ombor",
          oqilgan:   read.has(id),
        })
      }

      if ((d.pending_expenses || 0) > 0) {
        const id = "pending_exp"
        list.push({
          id,
          turi:      "info",
          sarlavha:  `${d.pending_expenses} ta xarajat tasdiqlash kutilmoqda`,
          matn:      "Shogird xarajatlarini tekshiring va tasdiqlang.",
          href:      "/expenses",
          oqilgan:   read.has(id),
        })
      }

      if ((d.bugun_sotuv_jami || 0) > 0) {
        const id = `bugun_${new Date().toISOString().slice(0, 10)}`
        list.push({
          id,
          turi:      "success",
          sarlavha:  "Bugungi sotuv yaxshi",
          matn:      `Bugun ${Number(d.bugun_sotuv_jami || 0).toLocaleString()} so'm sotuv qilindi.`,
          href:      "/dashboard",
          oqilgan:   read.has(id),
        })
      }

      if ((d.jami_qarz || 0) > 100000) {
        const id = "jami_qarz"
        list.push({
          id,
          turi:      "warning",
          sarlavha:  "Aktiv qarzlar yuqori",
          matn:      `Jami ${Number(d.jami_qarz || 0).toLocaleString()} so'm aktiv qarz. RFM tahlili qiling.`,
          href:      "/reports/rfm",
          oqilgan:   read.has(id),
        })
      }

      setNotifications(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function markRead(id: string) {
    const read = new Set<string>(
      JSON.parse(localStorage.getItem("read_notifications") || "[]")
    )
    read.add(id)
    localStorage.setItem("read_notifications", JSON.stringify([...read]))
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, oqilgan: true } : n))
  }

  function markAllRead() {
    const ids = notifications.map(n => n.id)
    localStorage.setItem("read_notifications", JSON.stringify(ids))
    setNotifications(ns => ns.map(n => ({ ...n, oqilgan: true })))
  }

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.oqilgan
    if (filter === "read") return n.oqilgan
    return true
  })

  const unreadCount = notifications.filter(n => !n.oqilgan).length

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-7 h-7 text-emerald-600" />
              Bildirishnomalar
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-rose-500/100">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dashboard ma&apos;lumotlaridan avtomatik tuzilgan xabarlar
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchData}>
              Yangilash
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" onClick={markAllRead}>
                <Check className="w-4 h-4 mr-1" /> Hammasini o&apos;qildi
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map(f => (
            <Button key={f} size="sm"
                    variant={filter === f ? "default" : "outline"}
                    onClick={() => setFilter(f)}>
              {f === "all" ? "Hammasi" : f === "unread" ? "O'qilmagan" : "O'qilgan"}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border rounded-xl p-20 text-center">
            <Bell className="w-16 h-16 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">Bildirishnomalar yo&apos;q</p>
            <p className="text-sm text-muted-foreground mt-1">
              Biznes holati yaxshi — alohida e&apos;tibor talab qilinmaydi!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => {
              const meta = ICONS[n.turi]
              const Icon = meta.icon
              const content = (
                <div className={`rounded-xl border p-4 ${meta.bg} ${n.oqilgan ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{n.sarlavha}</div>
                      <div className="text-xs text-muted-foreground mt-1">{n.matn}</div>
                    </div>
                    {!n.oqilgan && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id) }}>
                        <Check className="w-3 h-3 mr-1" /> O&apos;qildi
                      </Button>
                    )}
                  </div>
                </div>
              )
              return n.href ? (
                <Link key={n.id} href={n.href} onClick={() => markRead(n.id)} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
