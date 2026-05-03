"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string; manzil?: string; telefon?: string }
type KlientResp = { total: number; items: Klient[] }

export default function MapsPage() {
  const { isAuthenticated } = useAuth()
  const { data } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=200" : null)
  const klients = data?.items ?? []
  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klient xaritada</h1>
            <p className="text-base text-slate-500 mt-1">{klients.length} ta klient{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        <Card>
          <div className="px-5 py-3 border-b"><h3 className="font-semibold">Klientlar (xarita view rivojlantirilmoqda)</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {klients.slice(0, 60).map(k => (
              <Link key={k.id} href={`/klientlar/${k.id}`}>
                <div className="p-3 bg-slate-50 hover:bg-emerald-50 rounded">
                  <div className="font-medium text-sm flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-600" />{k.ism}</div>
                  <div className="text-xs text-slate-500 truncate">{k.manzil || "—"}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
