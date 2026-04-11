"use client"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { MapPin, Clock, ShoppingCart, CheckCircle2, Activity, Battery, Wifi } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function AgentMonitorPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  useEffect(() => {
    const load = async () => {
      try {
        // Live dashboard — bugungi ma'lumotlar
        const [liveRes, syncRes] = await Promise.all([
          fetch(`${API}/live`, { headers: h }).then(r => r.ok ? r.json() : null),
          fetch(`${API}/config/sync-log?limit=20`, { headers: h }).then(r => r.ok ? r.json() : []),
        ])

        // Sync loglardan agent ma'lumotlarini chiqarish
        const agentMap = new Map()
        for (const log of syncRes) {
          if (!agentMap.has(log.user_id)) {
            agentMap.set(log.user_id, {
              id: log.user_id,
              oxirgi_sync: log.boshlangan,
              tarmoq: log.tarmoq_turi || "—",
              batareya: log.batareya_foiz || 0,
              qurilma: log.qurilma_info || "—",
              muvaffaqiyatli: log.muvaffaqiyatli,
            })
          }
        }

        setAgents(Array.from(agentMap.values()))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const sinceMinutes = (iso: string) => {
    if (!iso) return "—"
    const diff = (Date.now() - new Date(iso).getTime()) / 60000
    if (diff < 1) return "hozirgina"
    if (diff < 60) return `${Math.floor(diff)} min oldin`
    return `${Math.floor(diff / 60)} soat oldin`
  }

  return (
    <AdminLayout title="📡 Agent Monitor">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Real-time agent faoliyatini kuzatish</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{agents.filter(a => a.muvaffaqiyatli).length}</div>
            <div className="text-xs text-gray-500">🟢 Online</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold">{agents.length}</div>
            <div className="text-xs text-gray-500">Jami agent</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {agents.filter(a => (a.batareya || 0) < 20).length}
            </div>
            <div className="text-xs text-gray-500">🔋 Kam batareya</div>
          </div>
        </div>

        {/* Agent list */}
        <div className="space-y-2">
          {agents.map(a => {
            const online = a.oxirgi_sync && (Date.now() - new Date(a.oxirgi_sync).getTime()) < 30 * 60000
            return (
              <div key={a.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 ${
                online ? "border-emerald-200" : "border-gray-200 opacity-70"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      online ? "bg-emerald-100" : "bg-gray-100"
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Agent #{a.id}</div>
                      <div className="text-xs text-gray-500">{a.qurilma}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">{sinceMinutes(a.oxirgi_sync)}</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> {a.tarmoq}
                  </span>
                  <span className={`flex items-center gap-1 ${(a.batareya || 0) < 20 ? "text-red-500" : ""}`}>
                    <Battery className="w-3 h-3" /> {a.batareya || 0}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" /> {a.muvaffaqiyatli ? "✅ Sync OK" : "❌ Xato"}
                  </span>
                </div>
              </div>
            )
          })}
          {agents.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Agent ma&apos;lumotlari yo&apos;q</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
