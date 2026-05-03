"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, Mail, MapPin, Smartphone, Calendar, TrendingUp, ShoppingBag, Eye, Camera, Award, Edit2 } from "lucide-react"
import Link from "next/link"

const AGENT_DATA: Record<string, any> = {
  "1": {
    name: "Nurmatov A.", role: "agent", region: "Toshkent · Sergeli", phone: "+998935678901", email: "nurmatov@savdoplus.uz",
    device: "Samsung S24 · Android 15", joined: "2024-03-12", status: "online",
    stats: { visits: 28, plan: 28, sotuv: 12_400_000, sotuvPlan: 15_000_000, sku: 84, skuPlan: 90, foto: 26 },
    weekly: [12, 18, 24, 22, 28, 26, 0],
    recent: [
      { type: "sotuv", time: "10:25", desc: "Salom Magazin №1 → 1.24M", icon: ShoppingBag, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { type: "visit", time: "09:45", desc: "Asia Optom — visit + foto", icon: Eye, tone: "bg-blue-50 text-blue-700 border-blue-200" },
      { type: "foto", time: "09:15", desc: "Lider Chakana — 2 ta foto", icon: Camera, tone: "bg-purple-50 text-purple-700 border-purple-200" },
    ]
  }
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const agent = AGENT_DATA[id] || AGENT_DATA["1"]
  const visitPct = (agent.stats.visits / agent.stats.plan * 100)
  const sotuvPct = (agent.stats.sotuv / agent.stats.sotuvPlan * 100)
  const skuPct = (agent.stats.sku / agent.stats.skuPlan * 100)
  const maxWeekly = Math.max(...agent.weekly)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA · AGENT #{id}</div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full text-white flex items-center justify-center font-medium text-2xl shadow-md" style={{ background: "#C75D3C" }}>
                  {agent.name.split(" ")[0][0]}{agent.name.split(" ")[1]?.[0] || ""}
                </div>
                <div>
                  <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {agent.name}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${agent.status === "online" ? "bg-emerald-50 text-emerald-700" : "bg-[#F0EAE0] text-[#6B5B4D]"}`}>
                      {agent.status === "online" ? "Onlayn" : "Oflayn"}
                    </span>
                  </h1>
                  <div className="text-sm text-[#6B5B4D] mt-2 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Award className="w-4 h-4" /> {agent.role.toUpperCase()}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {agent.region}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {agent.joined} dan</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Edit2 className="w-4 h-4" /> Tahrirlash</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <Eye className="w-7 h-7 text-blue-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bugungi visit</div>
              <div className="text-3xl font-light text-[#1A1A1A] mt-1 font-mono tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{agent.stats.visits} <span className="text-base text-[#9C8A6E] font-normal">/ {agent.stats.plan}</span></div>
              <div className="mt-3 h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${visitPct}%` }} />
              </div>
              <div className="text-xs text-blue-700 mt-1 font-medium font-mono tabular-nums">{visitPct.toFixed(0)}% bajarilish</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            </Card>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <ShoppingBag className="w-7 h-7 text-emerald-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bugungi sotuv</div>
              <div className="text-2xl font-light text-[#1A1A1A] mt-1 font-mono tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(agent.stats.sotuv / 1_000_000)}M <span className="text-base text-[#9C8A6E] font-normal">/ {fmt(agent.stats.sotuvPlan / 1_000_000)}M</span></div>
              <div className="mt-3 h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600" style={{ width: `${sotuvPct}%` }} />
              </div>
              <div className="text-xs text-emerald-700 mt-1 font-medium font-mono tabular-nums">{sotuvPct.toFixed(0)}% reja</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            </Card>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <TrendingUp className="w-7 h-7 text-purple-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU mavjudlik</div>
              <div className="text-3xl font-light text-[#1A1A1A] mt-1 font-mono tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{agent.stats.sku} <span className="text-base text-[#9C8A6E] font-normal">/ {agent.stats.skuPlan}</span></div>
              <div className="mt-3 h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: `${skuPct}%` }} />
              </div>
              <div className="text-xs text-purple-700 mt-1 font-medium font-mono tabular-nums">{skuPct.toFixed(0)}% target</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            </Card>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <Camera className="w-7 h-7 text-[#D97706] mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foto-hisobotlar</div>
              <div className="text-3xl font-light text-[#1A1A1A] mt-1 font-mono tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{agent.stats.foto}</div>
              <div className="text-xs text-[#D97706] mt-3 font-medium">o'rtacha 1.0 / visit</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D97706]" />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Hafta visit grafiki</h2>
              <div className="grid grid-cols-7 gap-2 h-48">
                {["Du", "Se", "Cho", "Pa", "Ju", "Sh", "Ya"].map((d, i) => {
                  const v = agent.weekly[i]
                  const h = (v / maxWeekly * 100) || 0
                  return (
                    <div key={d} className="flex flex-col">
                      <div className="flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-md ${i === 6 ? "bg-[#E8E0D3]" : v >= 22 ? "bg-emerald-600" : v >= 14 ? "bg-[#D97706]" : "bg-[#C75D3C]"} transition-all`}
                          style={{ height: `${h}%` }}
                          title={`${v} visit`}
                        />
                      </div>
                      <div className="text-center text-xs text-[#9C8A6E] mt-2 uppercase tracking-wider">{d}</div>
                      <div className="text-center text-sm font-medium font-mono tabular-nums text-[#1A1A1A]">{v}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Kontakt</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg border border-[#F0EAE0]">
                  <Phone className="w-5 h-5 text-emerald-700" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E]">Telefon</div>
                    <div className="font-medium text-[#1A1A1A] font-mono tabular-nums">{agent.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg border border-[#F0EAE0]">
                  <Mail className="w-5 h-5 text-blue-700" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E]">Email</div>
                    <div className="font-medium text-sm text-[#1A1A1A]">{agent.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg border border-[#F0EAE0]">
                  <Smartphone className="w-5 h-5 text-purple-700" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E]">Qurilma</div>
                    <div className="font-medium text-sm text-[#1A1A1A]">{agent.device}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Bugungi faollik</h2>
            <div className="space-y-2">
              {agent.recent.map((r: any, i: number) => {
                const Icon = r.icon
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${r.tone}`}>
                    <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[#1A1A1A]">{r.desc}</div>
                    </div>
                    <div className="text-sm font-mono tabular-nums text-[#9C8A6E]">{r.time}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
