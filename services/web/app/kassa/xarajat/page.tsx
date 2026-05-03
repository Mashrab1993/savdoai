"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Receipt } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type FoydaResp = {
  xarajatlar: number
  tushum: number
}
type PnlResp = {
  xarajat_kategoriyalar?: Array<{ nomi: string; summa: number }>
}

export default function XarajatPage() {
  const { isAuthenticated } = useAuth()
  const { data: foyda } = useApi<FoydaResp>(isAuthenticated ? "/api/v1/hisobot/foyda?kunlar=30" : null)
  const { data: pnl } = useApi<PnlResp>(isAuthenticated ? "/api/v1/hisobot/pnl?kunlar=30" : null)
  const cats = pnl?.xarajat_kategoriyalar || []
  const total = cats.reduce((s, c) => s + Number(c.summa || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Xarajatlar</h1>
            <p className="text-base text-slate-500 mt-1">
              Operatsion xarajatlar oxirgi 30 kun
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-rose-200 bg-rose-50/40">
            <div className="text-xs uppercase font-semibold text-rose-700">Jami xarajat</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">{formatCurrency(Number(foyda?.xarajatlar || total))}</div>
            <div className="text-xs text-slate-500 mt-1">Oxirgi 30 kun</div>
          </Card>
          <Card className="p-5 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Xarajat / Tushum</div>
            <div className="text-3xl font-bold text-blue-800 tabular-nums">
              {foyda && foyda.tushum > 0 ? `${(Number(foyda.xarajatlar) / Number(foyda.tushum) * 100).toFixed(1)}%` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">Tushum nisbatida</div>
          </Card>
        </div>

        {cats.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b">
              <h3 className="font-semibold">Kategoriya bo'yicha</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Kategoriya</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                    <th className="px-4 py-3 text-right font-semibold">Foiz</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cats.map((c, i) => {
                    const sum = Number(c.summa || 0)
                    const pct = total > 0 ? (sum / total) * 100 : 0
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2"><Receipt className="w-4 h-4 text-slate-400" /></td>
                        <td className="px-4 py-2 font-medium">{c.nomi}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-700">{formatCurrency(sum)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
