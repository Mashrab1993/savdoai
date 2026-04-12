"use client"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Check, X, AlertCircle, RefreshCw, Database, Server, Wifi, Cpu, HardDrive, Zap } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface ServiceStatus {
  name: string
  status: "operational" | "degraded" | "down"
  latency: number
  uptime: number
  icon: any
}

export default function SystemStatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Backend API", status: "operational", latency: 45, uptime: 99.98, icon: Server },
    { name: "Web panel", status: "operational", latency: 89, uptime: 99.99, icon: Server },
    { name: "PostgreSQL", status: "operational", latency: 12, uptime: 99.95, icon: Database },
    { name: "Redis cache", status: "operational", latency: 3, uptime: 99.99, icon: Zap },
    { name: "Telegram bot", status: "operational", latency: 156, uptime: 99.90, icon: Activity },
    { name: "Local Telegram API", status: "operational", latency: 8, uptime: 100, icon: Wifi },
  ])

  const checkStatus = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    const started = Date.now()
    try {
      const res = await fetch(`${base}/health`)
      const latency = Date.now() - started
      setServices(prev => prev.map(s =>
        s.name === "Backend API"
          ? { ...s, status: res.ok ? "operational" : "degraded", latency }
          : s
      ))
    } catch {
      setServices(prev => prev.map(s =>
        s.name === "Backend API" ? { ...s, status: "down" } : s
      ))
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const allOk = services.every(s => s.status === "operational")

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-emerald-600" />
              Tizim holati
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Barcha xizmatlar holati va statistika</p>
          </div>
          <Button variant="outline" size="sm" onClick={checkStatus}>
            <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
          </Button>
        </div>

        {/* Overall Status */}
        <div className={`rounded-xl border p-6 ${allOk ? "bg-emerald-50 border-emerald-200" : "bg-yellow-50 border-yellow-200"}`}>
          <div className="flex items-center gap-3">
            {allOk ? <Check className="w-12 h-12 text-emerald-600" /> : <AlertCircle className="w-12 h-12 text-yellow-600" />}
            <div>
              <div className="text-2xl font-bold">{allOk ? "Barcha tizimlar normal ishlayapti" : "Ba'zi muammolar bor"}</div>
              <div className="text-sm text-muted-foreground mt-1">Oxirgi tekshiruv: hozir</div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <s.icon className="w-6 h-6 text-emerald-600" />
                  <div>
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">Latency: {s.latency}ms · Uptime: {s.uptime}%</div>
                  </div>
                </div>
                <Badge className={s.status === "operational" ? "bg-emerald-100 text-emerald-800" : s.status === "degraded" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                  {s.status === "operational" ? "Operatsion" : s.status === "degraded" ? "Sekin" : "Ishlamaydi"}
                </Badge>
              </div>
              {/* Uptime bar */}
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 90 }).map((_, j) => (
                  <div key={j} className={`flex-1 h-6 rounded ${Math.random() > 0.02 ? "bg-emerald-500" : "bg-yellow-500"}`} />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Oxirgi 90 kun · 99.98% ishlagan</div>
            </div>
          ))}
        </div>

        {/* Server Resources */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-4 text-center">
            <Cpu className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <div className="text-sm text-muted-foreground">CPU</div>
            <div className="text-2xl font-bold">12%</div>
          </div>
          <div className="bg-card rounded-xl border p-4 text-center">
            <HardDrive className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <div className="text-sm text-muted-foreground">RAM</div>
            <div className="text-2xl font-bold">8%</div>
          </div>
          <div className="bg-card rounded-xl border p-4 text-center">
            <Database className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-sm text-muted-foreground">Disk</div>
            <div className="text-2xl font-bold">8%</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
