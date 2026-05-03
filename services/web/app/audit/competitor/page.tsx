"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string; manzil?: string }
type KlientResp = { total: number; items: Klient[] }

export default function CompetitorPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=50" : null)
  const klients = data?.items ?? []
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Raqobatchi audit</h1>
            <p className="text-base text-slate-500 mt-1">Audit moduli — Raqobatchi audit{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Camera className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Raqobatchi audit moduli</h3>
              <p className="text-sm text-blue-800 mt-1">Bu funksiya bot orqali rivojlantirilmoqda. Hozir {klients.length} ta klient mavjud.</p>
            </div>
          </div>
        </Card>
        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {klients.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b"><h3 className="font-semibold">Klientlar ({klients.length})</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
              {klients.slice(0, 30).map(k => (
                <Link key={k.id} href={`/klientlar/${k.id}`}>
                  <div className="p-3 bg-slate-50 hover:bg-emerald-50 rounded text-sm truncate">
                    <div className="font-medium">{k.ism}</div>
                    <div className="text-xs text-slate-500 truncate">{k.manzil || "—"}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
