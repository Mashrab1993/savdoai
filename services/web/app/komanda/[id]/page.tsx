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
      { type: "sotuv", time: "10:25", desc: "Salom Magazin №1 → 1.24M", icon: ShoppingBag, color: "emerald" },
      { type: "visit", time: "09:45", desc: "Asia Optom — visit + foto", icon: Eye, color: "blue" },
      { type: "foto", time: "09:15", desc: "Lider Chakana — 2 ta foto", icon: Camera, color: "violet" },
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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {agent.name.split(" ")[0][0]}{agent.name.split(" ")[1]?.[0] || ""}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  {agent.name}
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${agent.status === "online" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {agent.status === "online" ? "● Onlayn" : "○ Oflayn"}
                  </span>
                </h1>
                <div className="text-base text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><Award className="w-4 h-4" /> {agent.role.toUpperCase()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {agent.region}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {agent.joined} dan</span>
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" className="gap-2"><Edit2 className="w-4 h-4" /> Tahrirlash</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <Eye className="w-7 h-7 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Bugungi visit</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{agent.stats.visits} <span className="text-base text-slate-500 font-normal">/ {agent.stats.plan}</span></div>
            <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${visitPct}%` }} />
            </div>
            <div className="text-xs text-blue-700 mt-1 font-semibold">{visitPct.toFixed(0)}% bajarilish</div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Bugungi sotuv</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(agent.stats.sotuv / 1_000_000)}M <span className="text-base text-slate-500 font-normal">/ {fmt(agent.stats.sotuvPlan / 1_000_000)}M</span></div>
            <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${sotuvPct}%` }} />
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-semibold">{sotuvPct.toFixed(0)}% reja</div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <TrendingUp className="w-7 h-7 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">SKU mavjudlik</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{agent.stats.sku} <span className="text-base text-slate-500 font-normal">/ {agent.stats.skuPlan}</span></div>
            <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: `${skuPct}%` }} />
            </div>
            <div className="text-xs text-violet-700 mt-1 font-semibold">{skuPct.toFixed(0)}% target</div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 border-2">
            <Camera className="w-7 h-7 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Foto-hisobotlar</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{agent.stats.foto}</div>
            <div className="text-xs text-amber-700 mt-2 font-semibold">o'rtacha 1.0 / visit</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">Hafta visit grafiki</h2>
            <div className="grid grid-cols-7 gap-2 h-48">
              {["Du", "Se", "Cho", "Pa", "Ju", "Sh", "Ya"].map((d, i) => {
                const v = agent.weekly[i]
                const h = (v / maxWeekly * 100) || 0
                return (
                  <div key={d} className="flex flex-col">
                    <div className="flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md ${i === 6 ? "bg-slate-300" : v >= 22 ? "bg-emerald-500" : v >= 14 ? "bg-amber-500" : "bg-rose-400"} transition-all`}
                        style={{ height: `${h}%` }}
                        title={`${v} visit`}
                      />
                    </div>
                    <div className="text-center text-xs text-slate-500 mt-2">{d}</div>
                    <div className="text-center text-sm font-bold">{v}</div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4">Kontakt</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs text-slate-500">Telefon</div>
                  <div className="font-semibold">{agent.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="font-semibold text-sm">{agent.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-violet-600" />
                <div>
                  <div className="text-xs text-slate-500">Qurilma</div>
                  <div className="font-semibold text-sm">{agent.device}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Bugungi faollik</h2>
          <div className="space-y-2">
            {agent.recent.map((r: any, i: number) => {
              const Icon = r.icon
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg bg-${r.color}-50 border border-${r.color}-200`}>
                  <div className={`w-10 h-10 rounded-xl bg-${r.color}-100 text-${r.color}-700 flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{r.desc}</div>
                  </div>
                  <div className="text-sm font-mono text-slate-500">{r.time}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
