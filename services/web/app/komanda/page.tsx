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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Komanda <span className="italic text-[#C75D3C]">jurnali</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Agentlar, Supervайzerlar, Ekspeditorlar — Real-time device sync
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/komanda/leaderboard">
                <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                  🏆 Leaderboard
                </button>
              </Link>
              <Button size="lg" style={{ background: "#C75D3C" }}>
                <Plus className="w-5 h-5" /> Yangi xodim
              </Button>
            </div>
          </div>

          {/* Role tabs */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-x-auto">
            <div className="flex border-b border-[#E8E0D3]">
              {ROLE_TABS.map((t, i) => {
                const Icon = t.icon
                const isActive = i === 0
                return (
                  <button
                    key={t.key}
                    className={`flex items-center gap-2 px-6 py-4 font-medium ${isActive ? "border-b-2 border-[#C75D3C] text-[#C75D3C] bg-[#FCE9DD]/30" : "text-[#6B5B4D] hover:bg-[#FAF7F2]"}`}
                  >
                    <Icon className="w-5 h-5" />
                    {t.label}
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-[#C75D3C] text-white" : "bg-[#E8E0D3] text-[#6B5B4D]"}`}>
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
              <Card key={a.login} className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-medium" style={{ background: "linear-gradient(135deg, #C75D3C 0%, #E27B5C 100%)", fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {a.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-[#1A1A1A] truncate" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {a.name}
                    </h3>
                    <p className="text-sm text-[#9C8A6E] truncate">@{a.login} · {a.phone}</p>
                  </div>
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full ${a.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-[#9C8A6E]"}`} />
                </div>

                <div className="space-y-2 pb-3 border-b border-[#F0EAE0]">
                  <div className="flex items-center gap-2 text-sm text-[#6B5B4D]">
                    <Smartphone className="w-4 h-4 flex-shrink-0 text-[#9C8A6E]" />
                    <span className="truncate">{a.device}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B5B4D]">
                    <Activity className="w-4 h-4 flex-shrink-0 text-[#9C8A6E]" />
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
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: 'rose'|'amber' }) {
  const c = color === 'rose' ? 'text-[#C75D3C]' : color === 'amber' ? 'text-[#D97706]' : 'text-[#1A1A1A]'
  return (
    <div className="text-center">
      <div className={`text-xl font-medium tabular-nums ${c}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{label}</div>
    </div>
  )
}
