"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = { id: number; nomi: string; qoldiq: number; olish_narxi?: number; sotish_narxi: number; brend?: string; kategoriya?: string }
type TovarResp = { total: number; items: Tovar[] }

export default function FinancialReportPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=500" : null)
  const items = data?.items ?? []

  // Calculate total stock value
  const stockValueOlish = items.reduce((s, t) => s + Math.max(0, t.qoldiq) * Number(t.olish_narxi || 0), 0)
  const stockValueSotish = items.reduce((s, t) => s + Math.max(0, t.qoldiq) * Number(t.sotish_narxi || 0), 0)
  const potentialProfit = stockValueSotish - stockValueOlish

  // By category
  const byCat: Record<string, { qty: number; valOlish: number; valSotish: number }> = {}
  items.forEach(t => {
    const cat = t.kategoriya || "Boshqa"
    if (!byCat[cat]) byCat[cat] = { qty: 0, valOlish: 0, valSotish: 0 }
    byCat[cat].qty += Math.max(0, t.qoldiq)
    byCat[cat].valOlish += Math.max(0, t.qoldiq) * Number(t.olish_narxi || 0)
    byCat[cat].valSotish += Math.max(0, t.qoldiq) * Number(t.sotish_narxi || 0)
  })
  const catList = Object.entries(byCat).sort((a, b) => b[1].valOlish - a[1].valOlish)

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sklad moliyaviy hisoboti</h1>
            <p className="text-base text-slate-500 mt-1">
              Ombor qiymati va potensial foyda
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Olish narxi qiymati</div>
            <div className="text-2xl font-bold text-blue-800 tabular-nums">{formatCurrency(stockValueOlish)}</div>
            <div className="text-xs text-slate-500 mt-1">Tannarx asosida</div>
          </Card>
          <Card className="p-5 border-emerald-200 bg-emerald-50/40">
            <div className="text-xs uppercase font-semibold text-emerald-700">Sotish narxi qiymati</div>
            <div className="text-2xl font-bold text-emerald-800 tabular-nums">{formatCurrency(stockValueSotish)}</div>
            <div className="text-xs text-slate-500 mt-1">To'liq sotsa</div>
          </Card>
          <Card className="p-5 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">Potensial foyda</div>
            <div className="text-2xl font-bold text-amber-800 tabular-nums">{formatCurrency(potentialProfit)}</div>
            <div className="text-xs text-slate-500 mt-1">Hammasini sotsa</div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {catList.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b">
              <h3 className="font-semibold">Kategoriya bo'yicha ({catList.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Kategoriya</th>
                    <th className="px-4 py-3 text-right font-semibold">Qoldiq</th>
                    <th className="px-4 py-3 text-right font-semibold">Olish qiymati</th>
                    <th className="px-4 py-3 text-right font-semibold">Sotish qiymati</th>
                    <th className="px-4 py-3 text-right font-semibold">Foyda</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {catList.map(([cat, info]) => (
                    <tr key={cat} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{cat}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{info.qty}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-blue-700">{formatCurrency(info.valOlish)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(info.valSotish)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-bold text-amber-700">{formatCurrency(info.valSotish - info.valOlish)}</td>
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
