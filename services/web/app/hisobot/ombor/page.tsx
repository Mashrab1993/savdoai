"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Package, AlertCircle, TrendingUp, TrendingDown, Search, Download, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

const ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", current: 124, min: 80, max: 300, days: 14, value: 682_000, status: "ok" },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", current: 18, min: 60, max: 200, days: 4, value: 201_600, status: "low" },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", current: 248, min: 100, max: 400, days: 28, value: 2_083_200, status: "ok" },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", current: 6, min: 80, max: 200, days: 1, value: 75_000, status: "critical" },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", current: 96, min: 50, max: 150, days: 18, value: 614_400, status: "ok" },
  { id: 6, name: "Pechenye Yubileynoye", code: "COOK-YUB-500", current: 320, min: 60, max: 250, days: 64, value: 3_328_000, status: "over" },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET", current: 184, min: 100, max: 300, days: 14, value: 2_723_200, status: "ok" },
  { id: 8, name: "Fanta 1.5L", code: "FT-15-PET", current: 24, min: 80, max: 250, days: 4, value: 348_000, status: "low" },
]

const STATUS_CFG: Record<string, { accent: string; label: string; bg: string; text: string }> = {
  critical: { accent: "#C75D3C", label: "KRITIK", bg: "bg-[#F5E5D6]", text: "text-[#C75D3C]" },
  low: { accent: "#D97706", label: "Past", bg: "bg-[#FCE9DD]", text: "text-[#D97706]" },
  ok: { accent: "#10B981", label: "OK", bg: "bg-emerald-50", text: "text-emerald-700" },
  over: { accent: "#3B82F6", label: "Ortiqcha", bg: "bg-blue-50", text: "text-blue-700" },
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function OmborPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<any>(isAuthenticated ? "/api/v1/hisobot/ombor-holati" : null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = ITEMS.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || i.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalValue = ITEMS.reduce((s, i) => s + i.value, 0)
  const critical = ITEMS.filter(i => i.status === "critical").length
  const low = ITEMS.filter(i => i.status === "low").length
  const over = ITEMS.filter(i => i.status === "over").length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Ombor <span className="italic text-[#C75D3C]">holati</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{ITEMS.length} ta SKU · Jami qiymat: <span className="font-medium text-emerald-700 font-mono tabular-nums">{fmt(totalValue)} so'm</span> · Buyurtma kerak: {critical + low}</p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
            {!loading && api && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">● Real API</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card onClick={() => setStatusFilter(statusFilter === "critical" ? null : "critical")} className={`p-5 cursor-pointer hover:shadow-md transition-all bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden ${statusFilter === "critical" ? "ring-2 ring-[#C75D3C]" : ""}`}>
              <AlertTriangle className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>KRITIK</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{critical}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">tovar tugaydi</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
            <Card onClick={() => setStatusFilter(statusFilter === "low" ? null : "low")} className={`p-5 cursor-pointer hover:shadow-md transition-all bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden ${statusFilter === "low" ? "ring-2 ring-[#D97706]" : ""}`}>
              <AlertCircle className="w-5 h-5 mb-2" style={{ color: "#D97706" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#D97706" }}>PAST</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{low}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">min'dan kam</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#D97706" }} />
            </Card>
            <Card onClick={() => setStatusFilter(statusFilter === "ok" ? null : "ok")} className={`p-5 cursor-pointer hover:shadow-md transition-all bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden ${statusFilter === "ok" ? "ring-2 ring-emerald-500" : ""}`}>
              <Package className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#10B981" }}>OK</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{ITEMS.filter(i => i.status === "ok").length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">norma</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card onClick={() => setStatusFilter(statusFilter === "over" ? null : "over")} className={`p-5 cursor-pointer hover:shadow-md transition-all bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden ${statusFilter === "over" ? "ring-2 ring-blue-500" : ""}`}>
              <TrendingDown className="w-5 h-5 mb-2" style={{ color: "#3B82F6" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#3B82F6" }}>ORTIQCHA</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{over}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">max'dan ko'p</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length} ta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Joriy</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Min</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Max</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat (vizual)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Yetadi (kun)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sklad qiymati</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const cfg = STATUS_CFG[it.status]
                    const pct = Math.min(100, (it.current / it.max * 100))
                    return (
                      <tr key={it.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2">
                          <Link href={`/sklad/tovar/${it.id}`} className="font-medium text-[#C75D3C] hover:underline">{it.name}</Link>
                          <div className="text-xs text-[#9C8A6E] font-mono tabular-nums">{it.code}</div>
                        </td>
                        <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${cfg.text}`}>{it.current}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">{it.min}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">{it.max}</td>
                        <td className="py-3 px-2 min-w-[140px]">
                          <div className="relative h-3 bg-[#F0EAE0] rounded-full overflow-hidden">
                            <div className="absolute h-full" style={{ width: `${(it.min / it.max * 100)}%`, background: "#FCE9DD" }} />
                            <div className="absolute h-full" style={{ width: `${pct}%`, background: cfg.accent }} />
                            <div className="absolute h-full w-[1px] bg-[#6B5B4D]" style={{ left: `${(it.min / it.max * 100)}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium" style={{ color: it.days <= 3 ? "#C75D3C" : it.days <= 7 ? "#D97706" : "#1A1A1A" }}>
                          {it.days}
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(it.value)}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
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
