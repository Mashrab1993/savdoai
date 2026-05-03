"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string }
type KlientResp = { total: number; items: Klient[] }

export default function PromotionBuilderPage() {
  const { isAuthenticated } = useAuth()
  const { data } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=100" : null)
  const klients = data?.items ?? []
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promo builder</h1>
            <p className="text-base text-slate-500 mt-1">Aksiya tuzish{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Promo builder moduli</h3>
              <p className="text-sm text-blue-800 mt-1">Hozir {klients.length} ta klient mavjud. Modul rivojlantirilmoqda.</p>
            </div>
          </div>
        </Card>
        {klients.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b"><h3 className="font-semibold">Klientlar ({klients.length})</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
              {klients.slice(0, 30).map(k => (
                <Link key={k.id} href={`/klientlar/${k.id}`}>
                  <div className="p-3 bg-slate-50 hover:bg-emerald-50 rounded text-sm font-medium truncate">{k.ism}</div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
