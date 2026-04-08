"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCheck, ShoppingCart, CreditCard, Package, AlertCircle, Settings } from "lucide-react"

const TURI_CFG: Record<string, { icon: any; color: string }> = {
  sotuv: { icon: ShoppingCart, color: "text-emerald-600 bg-emerald-50" },
  qarz: { icon: CreditCard, color: "text-red-600 bg-red-50" },
  ombor: { icon: Package, color: "text-amber-600 bg-amber-50" },
  topshiriq: { icon: AlertCircle, color: "text-blue-600 bg-blue-50" },
  tizim: { icon: Settings, color: "text-gray-600 bg-gray-50" },
}

export function NotificationCenter() {
  const [items, setItems] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/bildirishnoma?limit=20`, { headers: h })
      if (res.ok) { const d = await res.json(); setItems(d.bildirishnomalar || []); setUnread(d.oqilmagan_soni || 0) }
    } catch (_) {}
  }
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn)
  }, [])

  const markRead = async (id: number) => {
    await fetch(`${API}/api/bildirishnoma/${id}/oqish`, { method: "PUT", headers: h })
    setItems(p => p.map(n => n.id === id ? { ...n, oqildi: true } : n)); setUnread(c => Math.max(0, c - 1))
  }
  const markAll = async () => {
    await fetch(`${API}/api/bildirishnoma/barchasi-oqildi`, { method: "PUT", headers: h })
    setItems(p => p.map(n => ({ ...n, oqildi: true }))); setUnread(0)
  }
  const ago = (iso: string) => { const m = (Date.now() - new Date(iso).getTime()) / 60000; return m < 60 ? `${Math.floor(m)}m` : m < 1440 ? `${Math.floor(m/60)}s` : `${Math.floor(m/1440)}k` }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        <Bell className="w-5 h-5 text-gray-500" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">🔔 Bildirishnomalar</span>
            {unread > 0 && <button onClick={markAll} className="text-xs text-emerald-600 hover:underline flex items-center gap-1"><CheckCheck className="w-3 h-3" /> Barchasi</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.map(n => {
              const c = TURI_CFG[n.turi] || TURI_CFG.tizim; const Icon = c.icon
              return (
                <div key={n.id} onClick={() => !n.oqildi && markRead(n.id)} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer ${!n.oqildi ? "bg-blue-50/50" : "hover:bg-gray-50"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.color}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-1.5">{!n.oqildi && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}<span className="truncate">{n.sarlavha}</span></div>
                    {n.matn && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.matn}</p>}
                    <span className="text-[10px] text-gray-400">{ago(n.yaratilgan)}</span>
                  </div>
                </div>
              )
            })}
            {items.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Bildirishnomalar yo&apos;q</div>}
          </div>
        </div>
      )}
    </div>
  )
}
