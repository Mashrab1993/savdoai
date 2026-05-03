"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; qoldiq: number; sotish_narxi: number; olish_narxi?: number }
type TovarResp = { total: number; items: Tovar[] }
type SavdoResp = { total: number }

export default function PromoEffectivenessPage() {
  const { isAuthenticated } = useAuth()
  const { data: tovarResp } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=200" : null)
  const { data: savdoResp } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=1" : null)
  const tovars = tovarResp?.items ?? []
  // Tovarlar with high qoldiq vs low qoldiq — promo candidates
  const overstocked = tovars.filter(t => t.qoldiq > 100).sort((a, b) => b.qoldiq - a.qoldiq).slice(0, 20)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promo effektivlik</h1>
            <p className="text-base text-slate-500 mt-1">
              Aksiya samaradorligi — qaysi tovarlar promo'ga muhtoj
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Promo modul</h3>
              <p className="text-sm text-amber-800 mt-1">
                Hozirda real promo/aksiya yozish funksiyasi rivojlantirilmoqda.
                Quyida ortiqcha qoldiqli tovarlar — promo'ga eng mos kandidatlar.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold">Promo kandidatlari (qoldiq &gt; 100)</h3>
            <p className="text-sm text-slate-500">
              {overstocked.length} ta ortiqcha qoldiqli tovar · Jami qoldiq qiymati:
              <span className="font-semibold ml-1">
                {formatCurrency(overstocked.reduce((s, t) => s + t.qoldiq * Number(t.olish_narxi || 0), 0))}
              </span>
            </p>
          </div>
          {overstocked.length === 0 ? (
            <p className="p-6 text-center text-slate-500">✅ Ortiqcha qoldiqli tovar yo'q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Olish</th>
                    <th className="px-4 py-3 text-right font-semibold">Sotish</th>
                    <th className="px-4 py-3 text-right font-semibold">Marja %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {overstocked.map(t => {
                    const ol = Number(t.olish_narxi || 0)
                    const so = Number(t.sotish_narxi || 0)
                    const marja = ol > 0 ? ((so - ol) / so * 100) : 0
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium">{t.nomi}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold text-amber-700">{t.qoldiq}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">{ol > 0 ? formatCurrency(ol) : "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(so)}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium">{marja.toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
