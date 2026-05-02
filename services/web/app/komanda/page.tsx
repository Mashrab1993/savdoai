"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Award, Truck, Plus, Smartphone, Activity } from "lucide-react"
import Link from "next/link"

const AGENTS = [
  { name: "Babadjanova Nargiza", login: "nargiza", phone: "+998 90 111 11 11", device: "TECNO BG (Android 13)", last_sync: "2 daq oldin", status: "online" },
  { name: "Berdiyev Rahmatillo", login: "berdiy", phone: "+998 90 222 22 22", device: "TECNO BG", last_sync: "5 daq oldin", status: "online" },
  { name: "BORIEV MIRJALOL", login: "boriev", phone: "+998 90 333 33 33", device: "Samsung VANILLA_ICE_CREAM", last_sync: "1 soat oldin", status: "offline" },
  { name: "Sayitqulov Mashrab", login: "sayit", phone: "+998 90 444 44 44", device: "TECNO LX1", last_sync: "Hozir", status: "online" },
  { name: "ДАВЛАТ", login: "davlat", phone: "+998 90 555 55 55", device: "Samsung VANILLA_ICE_CREAM", last_sync: "3 daq oldin", status: "online" },
  { name: "Турсунов Жамшид", login: "tursun", phone: "+998 90 666 66 66", device: "TECNO BG", last_sync: "30 daq oldin", status: "offline" },
]

const ROLE_TABS = [
  { key: "agent", label: "Agentlar", count: 6, icon: Users },
  { key: "supervisor", label: "Supervайzerlar", count: 2, icon: Award },
  { key: "expeditor", label: "Ekspeditorlar", count: 5, icon: Truck },
]

export default function KomandaPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Komanda</h1>
            <p className="text-base text-slate-500 mt-1">Agentlar, Supervайzerlar, Ekspeditorlar — Real-time device sync</p>
          </div>
          <Button size="lg">
            <Plus className="w-5 h-5" /> Yangi xodim
          </Button>
        </div>

        {/* Role tabs */}
        <Card className="overflow-x-auto">
          <div className="flex border-b border-slate-200">
            {ROLE_TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  className="flex items-center gap-2 px-6 py-4 border-b-2 border-emerald-600 text-emerald-700 font-medium first:bg-emerald-50/50"
                >
                  <Icon className="w-5 h-5" />
                  {t.label}
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {t.count}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Agents grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {AGENTS.map(a => (
            <Card key={a.login} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                  {a.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{a.name}</h3>
                  <p className="text-sm text-slate-500 truncate">@{a.login} · {a.phone}</p>
                </div>
                <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                  a.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                }`} />
              </div>

              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Smartphone className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{a.device}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span>Sync: {a.last_sync}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3">
                <Stat label="Visit" value="261" />
                <Stat label="Bajardi" value="0" color="rose" />
                <Stat label="Otkaz" value="18" color="amber" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: 'rose'|'amber' }) {
  const c = color === 'rose' ? 'text-rose-600' : color === 'amber' ? 'text-amber-600' : 'text-slate-900'
  return (
    <div className="text-center">
      <div className={`text-xl font-bold tabular-nums ${c}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
