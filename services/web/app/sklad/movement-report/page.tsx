"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KirimRow = {
  id: number
  sana: string
  tovar_nomi?: string
  miqdor?: number
  birlik?: string
  narx?: number
  jami?: number
  postavshik_nomi?: string
}

type KirimResp = { items: KirimRow[]; total: number }

export default function MovementReportPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KirimResp>(isAuthenticated ? "/api/v1/kirimlar?limit=100" : null)

  const items = data?.items ?? []
  const totalQty = items.reduce((s, k) => s + Number(k.miqdor || 0), 0)
  const totalSum = items.reduce((s, k) => s + Number(k.jami || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Harakat hisoboti</h1>
            <p className="text-base text-slate-500 mt-1">
              Sklad kirim/chiqim tarixi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-emerald-200 bg-emerald-50/40">
            <div className="text-xs uppercase font-semibold text-emerald-700">Kirim soni</div>
            <div className="text-3xl font-bold text-emerald-800 tabular-nums">{items.length}</div>
          </Card>
          <Card className="p-4 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Jami miqdor</div>
            <div className="text-3xl font-bold text-blue-800 tabular-nums">{totalQty.toLocaleString("ru-RU")}</div>
          </Card>
          <Card className="p-4 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">Jami summa</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{formatCurrency(totalSum)}</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && items.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha sklad harakati yo'q. <Link href="/sklad/kirim" className="text-emerald-600 underline">Kirim qiling</Link>
          </Card>
        )}

        {items.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-12"></th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                    <th className="px-4 py-3 text-left font-semibold">Postavshik</th>
                    <th className="px-4 py-3 text-right font-semibold">Miqdor</th>
                    <th className="px-4 py-3 text-right font-semibold">Narx</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><ArrowDownToLine className="w-4 h-4 text-emerald-600" /></td>
                      <td className="px-4 py-2 text-sm tabular-nums text-slate-600">
                        {new Date(k.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-2 font-medium">{k.tovar_nomi || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{k.postavshik_nomi || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{k.miqdor ?? "—"} {k.birlik || ""}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">{k.narx ? formatCurrency(Number(k.narx)) : "—"}</td>
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
