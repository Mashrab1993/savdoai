"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { MapPin, FileText, HelpCircle } from "lucide-react"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string; manzil?: string }
type KlientResp = { total: number; items: Klient[] }

export default function SupportPage() {
  const { isAuthenticated } = useAuth()
  const { data } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=50" : null)
  const klients = data?.items ?? []
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yordam</h1>
          <p className="text-base text-slate-500 mt-1">Texnik qo'llab-quvvatlash{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
        </div>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-7 h-7 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Yordam moduli</h3>
              <p className="text-sm text-blue-800 mt-1">Texnik qo'llab-quvvatlash — modul rivojlantirilmoqda. Real ma'lumotlar mavjud: {klients.length} ta klient.</p>
            </div>
          </div>
        </Card>
        {klients.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b"><h3 className="font-semibold">Klientlar</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
              {klients.slice(0, 30).map(k => (
                <div key={k.id} className="p-3 bg-slate-50 rounded">
                  <div className="font-medium text-sm">{k.ism}</div>
                  <div className="text-xs text-slate-500 truncate">{k.manzil || "manzil yo'q"}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
