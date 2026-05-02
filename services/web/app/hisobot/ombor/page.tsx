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

const STATUS_CFG: Record<string, { color: string; label: string; bg: string; text: string }> = {
  critical: { color: "rose", label: "KRITIK", bg: "bg-rose-100", text: "text-rose-700" },
  low: { color: "amber", label: "Past", bg: "bg-amber-100", text: "text-amber-700" },
  ok: { color: "emerald", label: "OK", bg: "bg-emerald-100", text: "text-emerald-700" },
  over: { color: "blue", label: "Ortiqcha", bg: "bg-blue-100", text: "text-blue-700" },
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Ombor holati</h1>
            <p className="text-base text-slate-500 mt-1">{ITEMS.length} ta SKU · Jami qiymat: <span className="font-bold text-emerald-700">{fmt(totalValue)} so'm</span> · Buyurtma kerak: {critical + low}</p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && api && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real API</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card onClick={() => setStatusFilter(statusFilter === "critical" ? null : "critical")} className={`p-4 cursor-pointer hover:shadow-md transition-all border-2 bg-rose-50 border-rose-200 ${statusFilter === "critical" ? "ring-2 ring-offset-2 ring-rose-500" : ""}`}>
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">KRITIK</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{critical}</div>
            <div className="text-xs text-slate-600 mt-0.5">tovar tugaydi</div>
          </Card>
          <Card onClick={() => setStatusFilter(statusFilter === "low" ? null : "low")} className={`p-4 cursor-pointer hover:shadow-md transition-all border-2 bg-amber-50 border-amber-200 ${statusFilter === "low" ? "ring-2 ring-offset-2 ring-amber-500" : ""}`}>
            <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">PAST</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{low}</div>
            <div className="text-xs text-slate-600 mt-0.5">min'dan kam</div>
          </Card>
          <Card onClick={() => setStatusFilter(statusFilter === "ok" ? null : "ok")} className={`p-4 cursor-pointer hover:shadow-md transition-all border-2 bg-emerald-50 border-emerald-200 ${statusFilter === "ok" ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`}>
            <Package className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">OK</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{ITEMS.filter(i => i.status === "ok").length}</div>
            <div className="text-xs text-slate-600 mt-0.5">norma</div>
          </Card>
          <Card onClick={() => setStatusFilter(statusFilter === "over" ? null : "over")} className={`p-4 cursor-pointer hover:shadow-md transition-all border-2 bg-blue-50 border-blue-200 ${statusFilter === "over" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}>
            <TrendingDown className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">ORTIQCHA</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{over}</div>
            <div className="text-xs text-slate-600 mt-0.5">max'dan ko'p</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Joriy</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Min</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Max</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Holat (vizual)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Yetadi (kun)</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sklad qiymati</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => {
                  const cfg = STATUS_CFG[it.status]
                  const pct = Math.min(100, (it.current / it.max * 100))
                  return (
                    <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <Link href={`/sklad/tovar/${it.id}`} className="font-semibold text-emerald-700 hover:underline">{it.name}</Link>
                        <div className="text-xs text-slate-400 font-mono">{it.code}</div>
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${cfg.text}`}>{it.current}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-500">{it.min}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-500">{it.max}</td>
                      <td className="py-3 px-2 min-w-[140px]">
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute h-full bg-amber-200" style={{ width: `${(it.min / it.max * 100)}%` }} />
                          <div className={`absolute h-full bg-${cfg.color}-500`} style={{ width: `${pct}%` }} />
                          <div className="absolute h-full w-[1px] bg-slate-700" style={{ left: `${(it.min / it.max * 100)}%` }} />
                        </div>
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${it.days <= 3 ? "text-rose-700" : it.days <= 7 ? "text-amber-700" : "text-slate-700"}`}>
                        {it.days}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{fmt(it.value)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
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
    </AdminLayout>
  )
}
