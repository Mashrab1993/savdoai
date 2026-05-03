"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = {
  id: number
  nomi: string
  kod?: string
  artikul?: string
  brend?: string
  kategoriya?: string
  qoldiq: number
  min_qoldiq?: number
  birlik?: string
  sotish_narxi: number
  olish_narxi?: number
}

type TovarResp = { total: number; items: Tovar[] }

export default function QoldiqPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out" | "negative">("all")

  const items: Tovar[] = data?.items ?? []
  const filtered = items.filter(t => {
    const q = search.toLowerCase()
    const matches = !q || (t.nomi || "").toLowerCase().includes(q) || (t.kod || "").includes(q) || (t.artikul || "").includes(q)
    if (!matches) return false
    if (filter === "low") return t.qoldiq > 0 && t.qoldiq <= (t.min_qoldiq || 0)
    if (filter === "out") return t.qoldiq === 0
    if (filter === "negative") return t.qoldiq < 0
    return true
  })

  const total = items.length
  const low = items.filter(t => t.qoldiq > 0 && t.qoldiq <= (t.min_qoldiq || 0)).length
  const out = items.filter(t => t.qoldiq === 0).length
  const negative = items.filter(t => t.qoldiq < 0).length
  const totalStockValue = items.reduce((s, t) => s + (t.qoldiq * Number(t.olish_narxi || 0)), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sklad qoldiq</h1>
            <p className="text-base text-slate-500 mt-1">
              {total} ta tovar · Ombor qiymati: <span className="font-semibold tabular-nums">{formatCurrency(totalStockValue)}</span>
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Jami SKU" value={String(total)} icon={Package} accent="emerald" />
          <Stat label="Kam qoldiq" value={String(low)} icon={AlertTriangle} accent="amber" alert={low > 0} />
          <Stat label="Tugagan" value={String(out)} icon={AlertTriangle} accent="rose" alert={out > 0} />
          <Stat label="Manfiy" value={String(negative)} icon={AlertTriangle} accent="rose" alert={negative > 0} />
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="Nom, kod, artikul..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
            </div>
            <button onClick={() => setFilter("all")} className={`px-3 py-2 rounded text-sm ${filter === "all" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Hammasi</button>
            <button onClick={() => setFilter("low")} className={`px-3 py-2 rounded text-sm ${filter === "low" ? "bg-amber-600 text-white" : "bg-slate-100"}`}>Kam qoldiq</button>
            <button onClick={() => setFilter("out")} className={`px-3 py-2 rounded text-sm ${filter === "out" ? "bg-rose-600 text-white" : "bg-slate-100"}`}>Tugagan</button>
            <button onClick={() => setFilter("negative")} className={`px-3 py-2 rounded text-sm ${filter === "negative" ? "bg-rose-700 text-white" : "bg-slate-100"}`}>Manfiy</button>
          </div>
        </Card>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && filtered.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-left font-semibold">Kod</th>
                    <th className="px-4 py-3 text-left font-semibold">Brend</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Min</th>
                    <th className="px-4 py-3 text-right font-semibold">Olish</th>
                    <th className="px-4 py-3 text-right font-semibold">Sotish</th>
                    <th className="px-4 py-3 text-right font-semibold">Qiymati</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.slice(0, 200).map(t => {
                    const isLow = t.qoldiq > 0 && t.qoldiq <= (t.min_qoldiq || 0)
                    const isOut = t.qoldiq === 0
                    const isNeg = t.qoldiq < 0
                    return (
                      <tr key={t.id} className={`hover:bg-slate-50 ${isOut ? "bg-rose-50/50" : isLow ? "bg-amber-50/30" : isNeg ? "bg-rose-100/50" : ""}`}>
                        <td className="px-4 py-2 font-medium">{t.nomi}</td>
                        <td className="px-4 py-2 text-slate-500 text-xs">{t.kod || t.artikul || "—"}</td>
                        <td className="px-4 py-2 text-slate-600">{t.brend || "—"}</td>
                        <td className={`px-4 py-2 text-right tabular-nums font-bold ${isNeg ? "text-rose-700" : isOut ? "text-rose-600" : isLow ? "text-amber-700" : "text-slate-900"}`}>
                          {t.qoldiq} {t.birlik || ""}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">{t.min_qoldiq ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">{t.olish_narxi ? formatCurrency(Number(t.olish_narxi)) : "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-700">{formatCurrency(Number(t.sotish_narxi))}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium text-emerald-700">
                          {formatCurrency(t.qoldiq * Number(t.olish_narxi || 0))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > 200 && (
              <div className="p-3 text-center text-sm text-slate-500 border-t">
                Birinchi 200 tovar ko'rsatildi (jami: {filtered.length})
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, icon: Icon, accent, alert }: { label: string; value: string; icon: React.ElementType; accent: "emerald" | "amber" | "rose"; alert?: boolean }) {
  const colors = {
    emerald: "border-emerald-200 text-emerald-700",
    amber: "border-amber-200 text-amber-700",
    rose: "border-rose-200 text-rose-700",
  }
  return (
    <Card className={`p-4 border-2 ${colors[accent]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase font-semibold text-slate-500">{label}</span>
        <Icon className={`w-5 h-5 ${alert ? "animate-pulse" : "opacity-50"}`} />
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
    </Card>
  )
}
