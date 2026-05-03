"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KassaTarixRow = {
  id: number
  sana: string
  turi?: string
  summa: number
  izoh?: string
  klient_ismi?: string
}

type KassaTarix = { items: KassaTarixRow[]; total: number }

export default function SaldoPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading, error } = useApi<KassaTarix>(isAuthenticated ? "/api/v1/kassa/tarix?limit=200" : null)

  const items = data?.items ?? []
  let running = 0
  const rows = items.slice().reverse().map(it => {
    const sum = Number(it.summa || 0)
    if ((it.turi || "").toLowerCase() === "kirim") running += sum
    else running -= sum
    return { ...it, balans: running }
  }).reverse()

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saldo</h1>
            <p className="text-base text-slate-500 mt-1">
              Kassa balansi har operatsiyadan keyin
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {error && <Card className="p-4 bg-rose-50 border-rose-200 text-rose-800">Xato: {error}</Card>}

        {!loading && rows.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha kassa harakati yo'q</Card>
        )}

        {rows.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">№</th>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">Turi</th>
                    <th className="px-4 py-3 text-left font-semibold">Klient</th>
                    <th className="px-4 py-3 text-right font-semibold">Summa</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-700">
                        {new Date(r.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          (r.turi || "").toLowerCase() === "kirim"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}>
                          {r.turi || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 truncate max-w-[200px]">{r.klient_ismi || r.izoh || "—"}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-medium ${
                        (r.turi || "").toLowerCase() === "kirim" ? "text-emerald-700" : "text-rose-700"
                      }`}>
                        {(r.turi || "").toLowerCase() === "kirim" ? "+" : "−"}{formatCurrency(Math.abs(Number(r.summa || 0)))}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold">
                        {formatCurrency(r.balans)}
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
