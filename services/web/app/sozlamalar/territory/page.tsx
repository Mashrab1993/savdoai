"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, MapPin, Search, Edit2, Trash2, Users, Building2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const TERRITORIES = [
  { id: 1, name: "Toshkent shahri", region: "Toshkent", clients: 412, agents: 12, sklad: 2, color: "emerald" },
  { id: 2, name: "Toshkent — Sergeli", region: "Toshkent", clients: 84, agents: 3, sklad: 1, color: "emerald" },
  { id: 3, name: "Toshkent — Yashnobod", region: "Toshkent", clients: 68, agents: 2, sklad: 0, color: "emerald" },
  { id: 4, name: "Toshkent — Mirzo Ulug'bek", region: "Toshkent", clients: 56, agents: 2, sklad: 1, color: "emerald" },
  { id: 5, name: "Toshkent — Yunusobod", region: "Toshkent", clients: 48, agents: 1, sklad: 0, color: "emerald" },
  { id: 6, name: "Toshkent — Chilonzor", region: "Toshkent", clients: 72, agents: 2, sklad: 0, color: "emerald" },
  { id: 7, name: "Toshkent — Olmazor", region: "Toshkent", clients: 42, agents: 1, sklad: 0, color: "emerald" },
  { id: 8, name: "Toshkent — Bektemir", region: "Toshkent", clients: 28, agents: 1, sklad: 0, color: "emerald" },
  { id: 9, name: "Samarqand shahri", region: "Samarqand", clients: 184, agents: 8, sklad: 1, color: "blue" },
  { id: 10, name: "Samarqand — Pasdarg'om", region: "Samarqand", clients: 32, agents: 1, sklad: 0, color: "blue" },
  { id: 11, name: "Samarqand — Urgut", region: "Samarqand", clients: 28, agents: 1, sklad: 0, color: "blue" },
  { id: 12, name: "Buxoro shahri", region: "Buxoro", clients: 96, agents: 4, sklad: 1, color: "violet" },
  { id: 13, name: "Buxoro — Kogon", region: "Buxoro", clients: 24, agents: 1, sklad: 0, color: "violet" },
  { id: 14, name: "Andijon shahri", region: "Andijon", clients: 64, agents: 3, sklad: 1, color: "amber" },
  { id: 15, name: "Farg'ona shahri", region: "Farg'ona", clients: 72, agents: 3, sklad: 1, color: "rose" },
  { id: 16, name: "Namangan shahri", region: "Namangan", clients: 58, agents: 2, sklad: 0, color: "cyan" },
  { id: 17, name: "Qarshi shahri", region: "Qashqadaryo", clients: 42, agents: 2, sklad: 0, color: "lime" },
  { id: 18, name: "Termiz shahri", region: "Surxondaryo", clients: 28, agents: 1, sklad: 0, color: "indigo" },
  { id: 19, name: "Nukus shahri", region: "Qoraqalpog'iston", clients: 36, agents: 2, sklad: 0, color: "orange" },
  { id: 20, name: "Urgench shahri", region: "Xorazm", clients: 32, agents: 1, sklad: 0, color: "fuchsia" },
]

export default function TerritoryPage() {
  const [search, setSearch] = useState("")
  const [activeRegion, setActiveRegion] = useState<string | null>(null)

  const filtered = TERRITORIES.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    const matchRegion = !activeRegion || t.region === activeRegion
    return matchSearch && matchRegion
  })

  const regions = Array.from(new Set(TERRITORIES.map(t => t.region)))
  const totalClients = TERRITORIES.reduce((s, t) => s + t.clients, 0)
  const totalAgents = TERRITORIES.reduce((s, t) => s + t.agents, 0)
  const totalSklad = TERRITORIES.reduce((s, t) => s + t.sklad, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Territoriya (Hududlar)</h1>
            <p className="text-base text-slate-500 mt-1">{TERRITORIES.length} ta hudud · {regions.length} ta viloyat · {totalClients} klient</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi hudud</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <MapPin className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Hududlar</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{TERRITORIES.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Klientlar</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{totalClients}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Users className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Agentlar</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{totalAgents}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Building2 className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Sklad</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{totalSklad}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hudud..." className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveRegion(null)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md ${!activeRegion ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Hammasi
              </button>
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeRegion === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(t => (
              <Card key={t.id} className={`p-4 hover:shadow-md transition-all border-2 bg-${t.color}-50 border-${t.color}-200 group`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${t.color}-200 text-${t.color}-700 flex items-center justify-center`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5">
                      <span className={`text-${t.color}-700 font-semibold`}>{t.region}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{t.name}</h3>
                    <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                      <div><span className="text-slate-500">Klient:</span> <span className="font-bold text-slate-700">{t.clients}</span></div>
                      <div><span className="text-slate-500">Agent:</span> <span className="font-bold text-slate-700">{t.agents}</span></div>
                      <div><span className="text-slate-500">Sklad:</span> <span className="font-bold text-slate-700">{t.sklad}</span></div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <button onClick={() => toast.info(`${t.name} tahrirlanmoqda`)} className="p-1 hover:bg-blue-100 rounded">
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button onClick={() => toast.error(`${t.name} o'chirildi`)} className="p-1 hover:bg-rose-100 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
