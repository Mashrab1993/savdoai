"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Crown, Award, Search, Download, AlertCircle, Camera, MapPin } from "lucide-react"
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

  const RANK_ACCENT = ["#D97706", "#9C8A6E", "#C75D3C"]

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Agentlar <span className="italic text-[#C75D3C]">reytingi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Aprel 2026 · {data.length} agent · Jami: <span className="text-[#1A1A1A] tabular-nums">{fmt(totalSotuv / 1_000_000)} M</span> so'm · {totalVisit} visit</p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ranked.slice(0, 3).map((a, i) => {
              const Icon = i === 0 ? Crown : Award
              const accent = RANK_ACCENT[i]
              return (
                <Card key={a.id} className="p-6 bg-white border-2 shadow-sm rounded-2xl relative overflow-hidden" style={{ borderColor: `${accent}55` }}>
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-9 h-9 p-1.5 rounded-2xl text-white shadow-sm" style={{ background: accent }} />
                    <div className="text-right">
                      <span className="text-3xl font-medium opacity-50" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>#{i + 1}</span>
                      <div className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded ${a.rank >= 90 ? "bg-emerald-50 text-emerald-700" : a.rank >= 75 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                        {a.rank}/100
                      </div>
                    </div>
                  </div>
                  <Link href={`/komanda/${a.id}`} className="text-lg font-medium text-[#1A1A1A] hover:text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{a.name}</Link>
                  <div className="text-xs text-[#9C8A6E] mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.region}</div>
                  <div className="text-2xl font-medium text-[#1A1A1A] mt-3 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(a.sotuv / 1_000_000)} M so'm</div>
                  <div className="text-xs text-[#6B5B4D] mt-1">{a.visit} visit · {Math.round(a.sotuv / a.visit / 1000)}K so'm/visit</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Agent..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length} ta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Region</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Visit %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotuv %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotuv summasi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foto</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Reyting</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const idx = ranked.findIndex(r => r.id === a.id)
                    const visitPct = (a.visit / a.visitPlan * 100)
                    const sotuvPct = (a.sotuv / a.sotuvPlan * 100)
                    const colorClass = (p: number) => p >= 90 ? "text-emerald-700" : p >= 75 ? "text-[#D97706]" : "text-[#C75D3C]"
                    return (
                      <tr key={a.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#9C8A6E]">#{idx + 1}</td>
                        <td className="py-3 px-2">
                          <Link href={`/komanda/${a.id}`} className="font-medium text-[#C75D3C] hover:underline">{a.name}</Link>
                        </td>
                        <td className="py-3 px-2 text-[#6B5B4D] text-xs">{a.region}</td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${colorClass(visitPct)}`}>
                          {a.visit}/{a.visitPlan} ({visitPct.toFixed(0)}%)
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${colorClass(sotuvPct)}`}>
                          {sotuvPct.toFixed(0)}%
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(a.sotuv)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{a.sku}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">
                          <span className="inline-flex items-center justify-end gap-1"><Camera className="w-3 h-3" /> {a.foto}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className={`inline-block px-3 py-1 rounded-md font-medium text-sm ${a.rank >= 90 ? "bg-emerald-50 text-emerald-700" : a.rank >= 75 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
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
      </div>
    </AdminLayout>
  )
}
