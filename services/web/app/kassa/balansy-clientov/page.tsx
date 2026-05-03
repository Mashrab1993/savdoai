"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Klient = {
  id: number
  ism: string
  telefon?: string
  jami_sotib?: number
  qarz?: number
}
type KlientResp = { total: number; items: Klient[] }

export default function KlientBalansPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=500" : null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "debt" | "ok">("all")

  const klients = data?.items ?? []
  const filtered = klients.filter(k => {
    const q = search.toLowerCase()
    if (q && !(k.ism || "").toLowerCase().includes(q)) return false
    if (filter === "debt" && (k.qarz ?? 0) <= 0) return false
    if (filter === "ok" && (k.qarz ?? 0) > 0) return false
    return true
  })

  const totalDebt = klients.reduce((s, k) => s + Number(k.qarz || 0), 0)
  const totalSold = klients.reduce((s, k) => s + Number(k.jami_sotib || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klient balanslari</h1>
            <p className="text-base text-slate-500 mt-1">
              {klients.length} ta klient · Jami xarid: <span className="font-semibold tabular-nums">{formatCurrency(totalSold)}</span> · Qarz: <span className="font-semibold text-rose-700 tabular-nums">{formatCurrency(totalDebt)}</span>
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="Klient nomi..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
            </div>
            <button onClick={() => setFilter("all")} className={`px-3 py-2 rounded text-sm ${filter === "all" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Hammasi</button>
            <button onClick={() => setFilter("debt")} className={`px-3 py-2 rounded text-sm ${filter === "debt" ? "bg-rose-600 text-white" : "bg-slate-100"}`}>Faqat qarz</button>
            <button onClick={() => setFilter("ok")} className={`px-3 py-2 rounded text-sm ${filter === "ok" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Toza balans</button>
          </div>
        </Card>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && filtered.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-left font-semibold">Telefon</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami xarid</th>
                    <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                    <th className="px-4 py-3 text-right font-semibold">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(k => (
                    <tr key={k.id} className={`hover:bg-slate-50 ${(k.qarz ?? 0) > 0 ? "bg-rose-50/30" : ""}`}>
                      <td className="px-4 py-2 font-medium">
                        <Link href={`/klientlar/${k.id}`} className="hover:text-emerald-700">{k.ism}</Link>
                      </td>
                      <td className="px-4 py-2 text-slate-600 tabular-nums">{k.telefon || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(k.jami_sotib || 0))}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-700">
                        {Number(k.qarz || 0) > 0 ? formatCurrency(Number(k.qarz)) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {(k.qarz ?? 0) > 0 ? (
                          <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded">Qarzdor</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">✓ Toza</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
