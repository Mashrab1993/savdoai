"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { useWebSocket } from "@/hooks/use-websocket"
import { formatCurrency } from "@/lib/format"
import {
  TrendingUp, TrendingDown, Users, Package, CreditCard,
  Activity, ShoppingCart, MapPin, Clock, Zap, Target, Award,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

// ═══════════════════════════════════════════════════════════
//  ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === display) return
    const diff = value - display
    const step = Math.max(1, Math.abs(diff) / 20)
    const timer = setInterval(() => {
      setDisplay(prev => {
        const next = diff > 0 ? Math.min(prev + step, value) : Math.max(prev - step, value)
        if (Math.abs(next - value) < step) { clearInterval(timer); return value }
        return Math.round(next)
      })
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════
//  SPARKLINE
// ═══════════════════════════════════════════════════════════
function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  if (!data?.length) return null
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 80}`).join(" ")
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
//  STAT CARD
// ═══════════════════════════════════════════════════════════
function StatCard({ icon: Icon, label, value, trend, sparkData, color = "emerald", pulse = false }: any) {
  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 overflow-hidden ${pulse ? "ring-2 ring-emerald-400 ring-opacity-50" : ""}`}>
      {pulse && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
        {sparkData && <Sparkline data={sparkData} color={color === "emerald" ? "#10b981" : color === "blue" ? "#3b82f6" : "#f59e0b"} />}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        <AnimatedNumber value={typeof value === "number" ? value : Number(value) || 0} />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">{label}</span>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  LIVE ACTIVITY ITEM
// ═══════════════════════════════════════════════════════════
function ActivityItem({ emoji, text, time, summa, isNew = false }: any) {
  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${isNew ? "bg-emerald-50 dark:bg-emerald-900/10 animate-pulse" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
      <span className="text-lg flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{text}</div>
        <div className="text-[11px] text-gray-400">{time}</div>
      </div>
      {summa && <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{summa}</span>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function LiveDashboardPage() {
  const [liveData, setLiveData] = useState<any>(null)
  const [reja, setReja] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const { lastMessage } = useWebSocket()

  // Time ticker
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const h = { Authorization: `Bearer ${token}` }
        const base = process.env.NEXT_PUBLIC_API_URL || ""
        const [live, plan] = await Promise.all([
          fetch(`${base}/api/live`, { headers: h }).then(r => r.ok ? r.json() : null),
          fetch(`${base}/api/reja/bugun`, { headers: h }).then(r => r.ok ? r.json() : null),
        ])
        setLiveData(live)
        setReja(plan)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
    const interval = setInterval(load, 30000) // Auto-refresh 30s
    return () => clearInterval(interval)
  }, [])

  // WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === "sync" || lastMessage?.type === "live_event") {
      // Reload on any update
      const token = localStorage.getItem("auth_token")
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/live`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).then(d => d && setLiveData(d))
    }
  }, [lastMessage])

  const b = liveData?.bugun || {}
  const og = liveData?.ogohlantirishlar || {}
  const sotuvlar = liveData?.oxirgi_sotuvlar || []

  return (
    <AdminLayout title="🔴 LIVE">
      <div className="space-y-4">
        {/* Live header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-600 uppercase tracking-wide">LIVE</span>
            </div>
            <span className="text-sm text-gray-500">
              {now.toLocaleTimeString("uz-UZ")}
            </span>
          </div>
          {reja && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <Target className="w-3 h-3" />
              <span>Bugungi reja: {reja.vazifalar_soni || 0} vazifa</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={ShoppingCart} label="Bugungi sotuv" value={Number(b.jami_sotuv || 0)}
            trend={b.osish_foiz} color="emerald" pulse={Number(b.jami_sotuv || 0) > 0} />
          <StatCard icon={Package} label="Buyurtmalar" value={b.sotuv_soni || 0} color="blue" />
          <StatCard icon={Users} label="Klientlar" value={b.klient_soni || 0} color="purple" />
          <StatCard icon={CreditCard} label="Qarz berildi" value={Number(b.qarz || 0)} color="amber" />
        </div>

        {/* Warnings */}
        {(og.kam_qoldiq > 0 || Number(og.jami_qarz || 0) > 0) && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {og.kam_qoldiq > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 whitespace-nowrap">
                <Package className="w-3.5 h-3.5" />
                <span>{og.kam_qoldiq} ta tovar tugayapti</span>
              </div>
            )}
            {Number(og.jami_qarz || 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 whitespace-nowrap">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Jami qarz: {formatCurrency(Number(og.jami_qarz || 0))}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Live Activity Feed */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Jonli oqim</h3>
              </div>
              <span className="text-[10px] text-gray-400">{sotuvlar.length} ta</span>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
              {sotuvlar.map((s: any, i: number) => (
                <ActivityItem
                  key={s.id || i}
                  emoji={s.holat === "posted" ? "✅" : s.holat === "bekor" ? "↩️" : "📦"}
                  text={`${s.klient} — ${s.tovar_soni} tovar`}
                  time={s.vaqt ? new Date(s.vaqt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : ""}
                  summa={formatCurrency(Number(s.summa || 0))}
                  isNew={i === 0}
                />
              ))}
              {sotuvlar.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Bugun hali sotuv yo&apos;q
                </div>
              )}
            </div>
          </div>

          {/* Daily Plan sidebar */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Bugungi reja</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(reja?.vazifalar || []).map((v: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-lg flex-shrink-0 mt-0.5">{v.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{v.sarlavha}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{v.tafsilot}</div>
                  </div>
                  {v.summa && (
                    <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{Number(v.summa).toLocaleString()}</span>
                  )}
                </div>
              ))}
              {(!reja?.vazifalar?.length) && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Bugungi reja bo&apos;sh
                </div>
              )}
            </div>
            {reja?.prognoz && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900 rounded-b-xl">
                <div className="text-xs text-blue-600 font-medium">
                  📊 Prognoz: {reja.prognoz.sotuv_soni} sotuv, ~{Number(reja.prognoz.sotuv_summa || 0).toLocaleString()} so&apos;m
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
