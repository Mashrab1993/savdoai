"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Crown, Award, Search, Download, AlertCircle, Eye, ShoppingBag, Camera, MapPin } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Agent = { id: number; name: string; region: string; visit: number; visitPlan: number; sotuv: number; sotuvPlan: number; sku: number; foto: number }

const MOCK: Agent[] = [
  { id: 1, name: "Nurmatov A.", region: "Sergeli", visit: 624, visitPlan: 720, sotuv: 142_800_000, sotuvPlan: 150_000_000, sku: 84, foto: 412 },
  { id: 2, name: "Karimov S.", region: "Yashnobod", visit: 568, visitPlan: 680, sotuv: 98_400_000, sotuvPlan: 130_000_000, sku: 76, foto: 386 },
  { id: 3, name: "Rasulov B.", region: "Samarqand", visit: 542, visitPlan: 600, sotuv: 86_200_000, sotuvPlan: 100_000_000, sku: 68, foto: 324 },
  { id: 4, name: "Yusupov D.", region: "Buxoro", visit: 456, visitPlan: 540, sotuv: 72_400_000, sotuvPlan: 90_000_000, sku: 64, foto: 286 },
  { id: 5, name: "Toxirov M.", region: "Sergeli (junior)", visit: 384, visitPlan: 480, sotuv: 48_600_000, sotuvPlan: 75_000_000, sku: 56, foto: 218 },
  { id: 6, name: "Aminov R.", region: "Andijon", visit: 312, visitPlan: 420, sotuv: 38_400_000, sotuvPlan: 60_000_000, sku: 48, foto: 184 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function rank(a: Agent): number {
  const visitPct = a.visit / a.visitPlan * 100
  const sotuvPct = a.sotuv / a.sotuvPlan * 100
  return Math.round((visitPct * 0.3 + sotuvPct * 0.5 + (a.sku / 100) * 100 * 0.2))
}

export default function AgentReportPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<Agent[]>(isAuthenticated ? "/api/v1/hisobot/agent" : null)
  const data = (api && Array.isArray(api) && api.length) ? api : MOCK
  const usingMock = !api || !Array.isArray(api) || !api.length
  const [search, setSearch] = useState("")

  const ranked = [...data].map(a => ({ ...a, rank: rank(a) })).sort((a, b) => b.rank - a.rank)
  const filtered = ranked.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))

  const totalSotuv = data.reduce((s, a) => s + a.sotuv, 0)
  const totalVisit = data.reduce((s, a) => s + a.visit, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Agentlar reytingi</h1>
            <p className="text-base text-slate-500 mt-1">Aprel 2026 · {data.length} agent · Jami: {fmt(totalSotuv / 1_000_000)} M so'm · {totalVisit} visit</p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ranked.slice(0, 3).map((a, i) => {
            const Icon = i === 0 ? Crown : Award
            const colors = ["from-amber-50 to-amber-100/50 border-amber-300 text-amber-600", "from-slate-50 to-slate-100/50 border-slate-300 text-slate-600", "from-orange-50 to-orange-100/50 border-orange-300 text-orange-600"]
            return (
              <Card key={a.id} className={`p-5 border-2 bg-gradient-to-br ${colors[i]}`}>
                <div className="flex items-start justify-between mb-2">
                  <Icon className="w-7 h-7 bg-white p-1.5 rounded-xl shadow-sm" />
                  <div className="text-right">
                    <span className="text-3xl font-bold opacity-50">#{i + 1}</span>
                    <div className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded ${a.rank >= 90 ? "bg-emerald-200 text-emerald-800" : a.rank >= 75 ? "bg-amber-200 text-amber-800" : "bg-rose-200 text-rose-800"}`}>
                      {a.rank}/100
                    </div>
                  </div>
                </div>
                <Link href={`/komanda/${a.id}`} className="text-base font-bold text-slate-900 hover:underline">{a.name}</Link>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.region}</div>
                <div className="text-xl font-bold text-slate-900 mt-2">{fmt(a.sotuv / 1_000_000)} M so'm</div>
                <div className="text-xs text-slate-600 mt-1">{a.visit} visit · {Math.round(a.sotuv / a.visit / 1000)}K so'm/visit</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Agent..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">#</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Agent</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Region</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Visit %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv %</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv summasi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">SKU</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Foto</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Reyting</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const idx = ranked.findIndex(r => r.id === a.id)
                  const visitPct = (a.visit / a.visitPlan * 100)
                  const sotuvPct = (a.sotuv / a.sotuvPlan * 100)
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-2">
                        <Link href={`/komanda/${a.id}`} className="font-semibold text-emerald-700 hover:underline">{a.name}</Link>
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{a.region}</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${visitPct >= 90 ? "text-emerald-700" : visitPct >= 75 ? "text-amber-700" : "text-rose-700"}`}>
                        {a.visit}/{a.visitPlan} ({visitPct.toFixed(0)}%)
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${sotuvPct >= 90 ? "text-emerald-700" : sotuvPct >= 75 ? "text-amber-700" : "text-rose-700"}`}>
                        {sotuvPct.toFixed(0)}%
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(a.sotuv)}</td>
                      <td className="py-3 px-2 text-right font-mono">{a.sku}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600 inline-flex items-center justify-end gap-1 w-full">
                        <Camera className="w-3 h-3" /> {a.foto}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`inline-block px-3 py-1 rounded-md font-bold text-sm ${a.rank >= 90 ? "bg-emerald-100 text-emerald-800" : a.rank >= 75 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                          {a.rank}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
