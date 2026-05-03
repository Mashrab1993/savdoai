"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, FileText, Printer } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type SotuvRow = { id: number; sana: string; jami: number; holat?: string }
type SavdoResp = { total: number; items: SotuvRow[] }
type Klient = { id: number; ism: string }

export default function KlientDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const klientId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data: sotuvlar, loading } = useApi<SavdoResp>(
    isAuthenticated && klientId ? `/api/v1/savdolar?klient_id=${klientId}&limit=200` : null
  )
  const { data: klient } = useApi<Klient>(
    isAuthenticated && klientId ? `/api/v1/klient/${klientId}/profil` : null
  )
  const items = sotuvlar?.items ?? []

  const printSelected = (id: number) => window.open(`/zakazlar/print?ids=${id}`, "_blank")

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${klientId}`} className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hujjatlar</h1>
            <p className="text-base text-slate-500 mt-1">
              {klient?.ism || `Klient #${klientId}`}: barcha sotuv hujjatlari ({items.length})
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Hujjat №</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                    <th className="px-4 py-3 text-left font-semibold">Holat</th>
                    <th className="px-4 py-3 text-right font-semibold">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><FileText className="w-4 h-4 text-slate-400" /></td>
                      <td className="px-4 py-2 font-mono">SOTUV-{s.id}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-600">{new Date(s.sana).toLocaleDateString("uz-UZ")}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(s.jami))}</td>
                      <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{s.holat || "yangi"}</span></td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => printSelected(s.id)} className="text-emerald-700 hover:underline text-xs flex items-center gap-1 ml-auto">
                          <Printer className="w-3 h-3" /> Pechat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha hujjat yo'q</Card>
        )}
      </div>
    </AdminLayout>
  )
}
