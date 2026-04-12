"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Navigation, Battery, Clock, RefreshCw, User,
  Signal, SignalZero, Satellite,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { gpsService } from "@/lib/api/services"

interface AgentLocation {
  id: number
  ism: string
  lat: number
  lng: number
  oxirgi_yangilanish: string
  batareya?: number
  online: boolean
}

export default function GpsPage() {
  const [agents, setAgents] = useState<AgentLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentLocation | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLocations = async () => {
    try {
      const data = await gpsService.history()
      if (Array.isArray(data)) {
        setAgents(data as AgentLocation[])
      }
    } catch (e) {
      console.error("GPS error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
    if (autoRefresh) {
      const interval = setInterval(fetchLocations, 30000) // 30 sek
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const onlineCount = agents.filter(a => a.online).length
  const offlineCount = agents.filter(a => !a.online).length

  const timeDiff = (dateStr: string) => {
    if (!dateStr) return "Noma'lum"
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Hozir"
    if (mins < 60) return `${mins} daqiqa oldin`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} soat oldin`
    return `${Math.floor(hours / 24)} kun oldin`
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={Satellite}
          gradient="cyan"
          title="GPS Monitoring"
          subtitle="Agentlar joylashuvini real vaqtda kuzating"
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div></div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-yangilanish ON" : "Auto OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLocations}>
              Yangilash
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Jami agentlar</div>
            <div className="text-2xl font-bold mt-1">{agents.length}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600 flex items-center gap-1">
              <Signal className="w-3 h-3" /> Online
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{onlineCount}</div>
          </div>
          <div className="bg-rose-500/10 dark:bg-rose-950/20 rounded-xl border border-rose-500/30 p-4">
            <div className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <SignalZero className="w-3 h-3" /> Offline
            </div>
            <div className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">{offlineCount}</div>
          </div>
        </div>

        {/* Map placeholder + Agent list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2 bg-card rounded-xl border overflow-hidden">
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-muted dark:to-card h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto text-emerald-300 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Xarita integratsiyasi</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {agents.length} ta agent, {onlineCount} ta online
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Yandex/Google Maps integratsiya qo'shilmoqda
                </p>
              </div>
            </div>
          </div>

          {/* Agent List */}
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold">Agentlar</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full" />
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Agent ma'lumotlari yo'q
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 dark:hover:bg-muted ${
                      selectedAgent?.id === agent.id ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${agent.online ? "bg-emerald-500" : "bg-rose-400"}`} />
                      <div>
                        <div className="font-medium text-sm">{agent.ism}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeDiff(agent.oxirgi_yangilanish)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.batareya !== undefined && (
                        <div className={`flex items-center gap-1 text-xs ${
                          agent.batareya > 50 ? "text-emerald-600" : agent.batareya > 20 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                        }`}>
                          <Battery className="w-3 h-3" />
                          {agent.batareya}%
                        </div>
                      )}
                      <Badge variant={agent.online ? "default" : "secondary"} className="text-xs">
                        {agent.online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Agent Detail */}
        {selectedAgent && (
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              {selectedAgent.ism} — batafsil
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Holat:</span>
                <div className="font-medium">{selectedAgent.online ? "Online" : "Offline"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Koordinata:</span>
                <div className="font-mono text-xs">{selectedAgent.lat?.toFixed(6)}, {selectedAgent.lng?.toFixed(6)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Oxirgi yangilanish:</span>
                <div className="font-medium">{timeDiff(selectedAgent.oxirgi_yangilanish)}</div>
              </div>
              {selectedAgent.batareya !== undefined && (
                <div>
                  <span className="text-muted-foreground">Batareya:</span>
                  <div className="font-medium">{selectedAgent.batareya}%</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
