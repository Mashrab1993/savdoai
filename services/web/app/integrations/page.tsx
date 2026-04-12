"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plug, Check, X, Settings, ExternalLink, MessageSquare, CreditCard, Receipt, Truck, Database } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const INTEGRATIONS = [
  { name: "Telegram Bot", desc: "Buyurtma, narx, hisobot — bot orqali", icon: MessageSquare, status: "active", category: "messaging" },
  { name: "Click", desc: "Onlayn to'lov tizimi", icon: CreditCard, status: "ready", category: "payment" },
  { name: "Payme", desc: "Onlayn to'lov tizimi", icon: CreditCard, status: "ready", category: "payment" },
  { name: "Didox", desc: "Elektron faktura (E-SF) operatori", icon: Receipt, status: "ready", category: "fiscal" },
  { name: "Faktura.uz", desc: "Elektron faktura operatori", icon: Receipt, status: "ready", category: "fiscal" },
  { name: "1C", desc: "1C buxgalteriya integratsiyasi", icon: Database, status: "planned", category: "accounting" },
  { name: "Yandex Maps", desc: "GPS va xarita", icon: Plug, status: "active", category: "maps" },
  { name: "Webhook API", desc: "Tashqi tizimlarga real-time bildirish", icon: Plug, status: "active", category: "api" },
  { name: "WhatsApp Business", desc: "WhatsApp orqali bildirishnoma", icon: MessageSquare, status: "planned", category: "messaging" },
  { name: "Eskiz SMS", desc: "SMS yuborish xizmati", icon: MessageSquare, status: "ready", category: "messaging" },
  { name: "Yetkazib berish", desc: "Avtomatik marshrutlash", icon: Truck, status: "ready", category: "logistics" },
  { name: "TraceIQ", desc: "Tovar nazorat tizimi", icon: Database, status: "planned", category: "tracking" },
]

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  active:  { color: "bg-emerald-100 text-emerald-800", label: "Faol" },
  ready:   { color: "bg-blue-100 text-blue-800",       label: "Tayyor (sozlash kerak)" },
  planned: { color: "bg-muted text-muted-foreground",       label: "Rejada" },
}

export default function IntegrationsPage() {
  const [filter, setFilter] = useState("all")

  const filtered = filter === "all" ? INTEGRATIONS : INTEGRATIONS.filter(i => i.status === filter)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={Plug}
          gradient="violet"
          title="Integratsiyalar"
          subtitle="Tashqi xizmatlar va API integratsiyalari"
        />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "Barchasi" },
            { key: "active", label: "Faol" },
            { key: "ready", label: "Tayyor" },
            { key: "planned", label: "Rejada" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === f.key ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
            >{f.label}</button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600">Faol</div>
            <div className="text-2xl font-bold text-emerald-700">{INTEGRATIONS.filter(i => i.status === "active").length}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-600">Tayyor</div>
            <div className="text-2xl font-bold text-blue-700">{INTEGRATIONS.filter(i => i.status === "ready").length}</div>
          </div>
          <div className="bg-muted/50 dark:bg-card/20 rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Rejada</div>
            <div className="text-2xl font-bold text-foreground">{INTEGRATIONS.filter(i => i.status === "planned").length}</div>
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((int, i) => {
            const status = STATUS_COLORS[int.status]
            return (
              <div key={i} className="bg-card rounded-xl border p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <int.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <Badge className={status.color + " text-xs"}>{status.label}</Badge>
                </div>
                <div className="font-bold mb-1">{int.name}</div>
                <div className="text-xs text-muted-foreground mb-3">{int.desc}</div>
                <div className="flex gap-2">
                  {int.status === "active" ? (
                    <Button variant="outline" size="sm" className="flex-1"><Settings className="w-3 h-3 mr-1" /> Sozlash</Button>
                  ) : int.status === "ready" ? (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Plug className="w-3 h-3 mr-1" /> Yoqish</Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1" disabled>Tez kunda</Button>
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
