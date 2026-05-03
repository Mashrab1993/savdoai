"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Camera, Box } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Tovar = { id: number; nomi: string; brend?: string; qoldiq: number }
type TovarResp = { total: number; items: Tovar[] }

export default function FacingPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=100" : null)
  const tovars = data?.items ?? []

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facing audit</h1>
            <p className="text-base text-slate-500 mt-1">
              Tovar javondagi joylashuvi — merchandising kontrol
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Camera className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Facing audit moduli</h3>
              <p className="text-sm text-blue-800 mt-1">
                Bot orqali agent do'konga borib, mahsulotni javondagi facing'ni rasm + soni bilan yozadi.
                Hozir tovarlar ro'yxati real, audit yozish funksiyasi bot tomonida tayyor.
              </p>
            </div>
          </div>
        </Card>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {tovars.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b">
              <h3 className="font-semibold">Auditdagi tovarlar ({tovars.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {tovars.slice(0, 30).map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded flex items-center gap-3">
                  <Box className="w-5 h-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{t.nomi}</div>
                    <div className="text-xs text-slate-500">{t.brend || "—"}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${t.qoldiq > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {t.qoldiq > 0 ? `${t.qoldiq}` : "0"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
