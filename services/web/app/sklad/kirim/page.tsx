"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, ArrowLeft, ArrowDownToLine } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Kirim = {
  id: number
  sana: string
  tovar_nomi?: string
  postavshik_nomi?: string
  miqdor?: number
  birlik?: string
  jami?: number
}
type KirimResp = { items: Kirim[]; total: number }

export default function KirimPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState("")
  const { data, loading } = useApi<KirimResp>(isAuthenticated ? "/api/v1/kirimlar?limit=300" : null)

  const items = data?.items ?? []
  const filtered = items.filter(k => {
    const q = search.toLowerCase()
    if (!q) return true
    return (k.tovar_nomi || "").toLowerCase().includes(q) || (k.postavshik_nomi || "").toLowerCase().includes(q)
  })
  const totalSum = filtered.reduce((s, k) => s + Number(k.jami || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Kirim (Postuplenie)</h1>
              <p className="text-base text-slate-500 mt-1">
                {filtered.length} ta yozuv · Jami: <span className="font-semibold tabular-nums">{formatCurrency(totalSum)}</span>
                {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
              </p>
            </div>
          </div>
          <Link href="/sklad/kirim/yangi">
            <Button><Plus className="w-4 h-4" /> Yangi kirim</Button>
          </Link>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input placeholder="Tovar nomi yoki postavshik..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
          </div>
        </Card>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && filtered.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha kirim yo'q. <Link href="/sklad/kirim/yangi" className="text-emerald-600 underline">Birinchi kirim qiling</Link>
          </Card>
        )}

        {filtered.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-emerald-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-left font-semibold">Postavshik</th>
                    <th className="px-4 py-3 text-right font-semibold">Miqdor</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><ArrowDownToLine className="w-4 h-4 text-emerald-600" /></td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">
                        {new Date(k.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-2 font-medium">{k.tovar_nomi || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{k.postavshik_nomi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{k.miqdor ?? "—"} {k.birlik || ""}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(Number(k.jami || 0))}</td>
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
