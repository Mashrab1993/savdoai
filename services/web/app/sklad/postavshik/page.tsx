"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Kirim = {
  id: number
  sana: string
  postavshik_nomi?: string
  jami?: number
}
type KirimResp = { items: Kirim[]; total: number }

export default function PostavshikPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KirimResp>(isAuthenticated ? "/api/v1/kirimlar?limit=500" : null)

  // Group by postavshik
  const byPost: Record<string, { soni: number; jami: number; oxirgi: string }> = {}
  for (const k of data?.items ?? []) {
    const name = k.postavshik_nomi || "Noma'lum"
    if (!byPost[name]) byPost[name] = { soni: 0, jami: 0, oxirgi: k.sana }
    byPost[name].soni++
    byPost[name].jami += Number(k.jami || 0)
    if (k.sana > byPost[name].oxirgi) byPost[name].oxirgi = k.sana
  }
  const postlist = Object.entries(byPost).sort((a, b) => b[1].jami - a[1].jami)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Postavshiklar</h1>
            <p className="text-base text-slate-500 mt-1">
              {postlist.length} ta postavshik · Jami: <span className="font-semibold tabular-nums">{formatCurrency(postlist.reduce((s, [, v]) => s + v.jami, 0))}</span>
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && postlist.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha postavshik yo'q. Kirim qilganingizda paydo bo'ladi.
          </Card>
        )}

        {postlist.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Postavshik</th>
                    <th className="px-4 py-3 text-right font-semibold">Kirim soni</th>
                    <th className="px-4 py-3 text-right font-semibold">Jami summa</th>
                    <th className="px-4 py-3 text-right font-semibold">Oxirgi kirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {postlist.map(([name, info]) => (
                    <tr key={name} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        {name}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{info.soni}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(info.jami)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                        {new Date(info.oxirgi).toLocaleDateString("uz-UZ")}
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
