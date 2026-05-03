"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Kirim = {
  id: number
  sana: string
  tovar_nomi?: string
  miqdor?: number
  birlik?: string
  postavshik_nomi?: string
}
type KirimResp = { items: Kirim[]; total: number }

export default function LotReportPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KirimResp>(isAuthenticated ? "/api/v1/kirimlar?limit=200" : null)
  const items = data?.items ?? []

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lot hisoboti</h1>
            <p className="text-base text-slate-500 mt-1">
              Tovar partiyalari (kirim asosida)
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha lot yo'q</Card>
        )}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Lot ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-left font-semibold">Postavshik</th>
                    <th className="px-4 py-3 text-right font-semibold">Miqdor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><Package className="w-4 h-4 text-slate-400" /></td>
                      <td className="px-4 py-2 font-mono text-slate-500 text-xs">LOT-{k.id}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">{new Date(k.sana).toLocaleDateString("uz-UZ")}</td>
                      <td className="px-4 py-2 font-medium">{k.tovar_nomi || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{k.postavshik_nomi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{k.miqdor ?? "—"} {k.birlik || ""}</td>
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
