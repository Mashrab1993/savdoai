"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, FileText, Printer } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Klient = { id: number; ism: string; jami_sotib?: number; qarz?: number }
type KlientResp = { total: number; items: Klient[] }
type SotuvRow = { id: number; sana: string; jami: number; tolangan?: number; qarz?: number }
type SavdoResp = { total: number; items: SotuvRow[] }

export default function AktSverkiPage() {
  const { isAuthenticated } = useAuth()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data: klientResp } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=200" : null)
  const { data: sotuvResp } = useApi<SavdoResp>(
    selectedId ? `/api/v1/savdolar?klient_id=${selectedId}&limit=100` : null
  )

  const klients = klientResp?.items ?? []
  const sotuvlar = sotuvResp?.items ?? []
  const selected = klients.find(k => k.id === selectedId)
  const totalJami = sotuvlar.reduce((s, x) => s + Number(x.jami || 0), 0)
  const totalTolangan = sotuvlar.reduce((s, x) => s + Number(x.tolangan || 0), 0)
  const totalQarz = totalJami - totalTolangan

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Akt sverki</h1>
            <p className="text-base text-slate-500 mt-1">
              Klient bilan hisob-kitoblar tarixi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
          {selected && (
            <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded flex items-center gap-2">
              <Printer className="w-4 h-4" /> Pechat
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Klient tanlang</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {klients.map(k => (
                <button
                  key={k.id}
                  onClick={() => setSelectedId(k.id)}
                  className={`w-full text-left p-2 rounded text-sm ${selectedId === k.id ? "bg-emerald-100 text-emerald-700 font-medium" : "hover:bg-slate-100"}`}
                >
                  {k.ism}
                  {(k.qarz ?? 0) > 0 && <span className="block text-xs text-rose-600">qarz: {formatCurrency(Number(k.qarz))}</span>}
                </button>
              ))}
            </div>
          </Card>

          <div className="lg:col-span-3">
            {!selected ? (
              <Card className="p-12 text-center text-slate-500">
                ← Klient tanlang akt-sverki ko'rish uchun
              </Card>
            ) : (
              <>
                <Card className="p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold">{selected.ism}</h2>
                      <p className="text-sm text-slate-500">Akt-sverki: {sotuvlar.length} ta sotuv</p>
                    </div>
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div>
                      <div className="text-xs text-slate-500">Jami xarid</div>
                      <div className="text-xl font-bold">{formatCurrency(totalJami)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">To'langan</div>
                      <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalTolangan)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Qarz</div>
                      <div className={`text-xl font-bold ${totalQarz > 0 ? "text-rose-700" : "text-slate-500"}`}>
                        {formatCurrency(totalQarz)}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">№</th>
                          <th className="px-4 py-3 text-left font-semibold">Sana</th>
                          <th className="px-4 py-3 text-right font-semibold">Jami</th>
                          <th className="px-4 py-3 text-right font-semibold">To'landi</th>
                          <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sotuvlar.map((s, i) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                            <td className="px-4 py-2 tabular-nums">{new Date(s.sana).toLocaleDateString("uz-UZ")}</td>
                            <td className="px-4 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(s.jami))}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(Number(s.tolangan || 0))}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-rose-700">
                              {Number(s.qarz || 0) > 0 ? formatCurrency(Number(s.qarz)) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
