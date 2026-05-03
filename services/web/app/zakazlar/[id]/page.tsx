"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SavdoDetail = {
  id: number
  klient_ismi?: string
  klient_telefon?: string
  klient_manzil?: string
  jami: number
  tolangan?: number
  qarz?: number
  sana: string
  izoh?: string
  holat?: string
  tovarlar?: Array<{ tovar_nomi: string; miqdor: number; birlik?: string; sotish_narxi: number; jami: number }>
}

export default function ZakazDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const sotuvId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data: s, loading } = useApi<SavdoDetail>(
    isAuthenticated && sotuvId ? `/api/v1/savdo/${sotuvId}` : null
  )
  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/zakazlar" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Zakaz #{sotuvId}</h1>
              <p className="text-base text-slate-500 mt-1">{s?.klient_ismi || "—"}</p>
            </div>
          </div>
          <Link href={`/zakazlar/print?ids=${sotuvId}`} target="_blank">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded flex items-center gap-2"><Printer className="w-4 h-4" /> Pechat</button>
          </Link>
        </div>
        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {s && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4"><div className="text-xs uppercase font-semibold text-slate-500">Jami</div><div className="text-2xl font-bold tabular-nums">{formatCurrency(Number(s.jami))}</div></Card>
              <Card className="p-4 border-emerald-200"><div className="text-xs uppercase font-semibold text-emerald-700">To'langan</div><div className="text-2xl font-bold text-emerald-700 tabular-nums">{formatCurrency(Number(s.tolangan || 0))}</div></Card>
              <Card className="p-4 border-rose-200"><div className="text-xs uppercase font-semibold text-rose-700">Qarz</div><div className="text-2xl font-bold text-rose-700 tabular-nums">{formatCurrency(Number(s.qarz || 0))}</div></Card>
            </div>
            {s.tovarlar && s.tovarlar.length > 0 && (
              <Card>
                <div className="px-5 py-3 border-b"><h3 className="font-semibold">Tovarlar ({s.tovarlar.length})</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left font-semibold">Tovar</th><th className="px-4 py-3 text-right font-semibold">Miqdor</th><th className="px-4 py-3 text-right font-semibold">Narx</th><th className="px-4 py-3 text-right font-semibold">Summa</th></tr></thead>
                    <tbody className="divide-y">
                      {s.tovarlar.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">{t.tovar_nomi}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{t.miqdor} {t.birlik || ""}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(t.sotish_narxi))}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(Number(t.jami))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {s.izoh && (
              <Card className="p-4 bg-amber-50 border-amber-200"><div className="text-xs uppercase font-semibold text-amber-700">Izoh</div><div className="text-sm">{s.izoh}</div></Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
