"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string; manzil?: string; telefon?: string }
type KlientResp = { total: number; items: Klient[] }

export default function MarshrutPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=200" : null)
  const klients = data?.items ?? []
  // Group by manzil district (first word)
  const byDistrict: Record<string, Klient[]> = {}
  klients.forEach(k => {
    const district = (k.manzil || "Boshqa").split(/[\s,]/)[0] || "Boshqa"
    if (!byDistrict[district]) byDistrict[district] = []
    byDistrict[district].push(k)
  })
  const districts = Object.entries(byDistrict).sort((a, b) => b[1].length - a[1].length)

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marshrut</h1>
            <p className="text-base text-slate-500 mt-1">
              Hududlar bo'yicha klientlar (agent marshruti)
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {districts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {districts.slice(0, 12).map(([d, kl]) => (
              <Card key={d} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    {d}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">{kl.length} klient</span>
                </div>
                <div className="space-y-1">
                  {kl.slice(0, 5).map(k => (
                    <Link key={k.id} href={`/klientlar/${k.id}`}>
                      <div className="text-sm py-1 px-2 hover:bg-slate-100 rounded truncate">
                        • {k.ism}
                      </div>
                    </Link>
                  ))}
                  {kl.length > 5 && <div className="text-xs text-slate-500 px-2">+ {kl.length - 5} boshqa</div>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && klients.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">Hozircha klient yo'q</Card>
        )}
      </div>
    </AdminLayout>
  )
}
