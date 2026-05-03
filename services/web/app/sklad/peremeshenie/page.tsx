"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Sklad = { id: number; nomi: string; turi?: string; latitude?: number; longitude?: number }
type SkladResp = Sklad[] | { items?: Sklad[] }

export default function PeremeshenIePage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SkladResp>(isAuthenticated ? "/api/v1/skladlar" : null)
  const skladlar: Sklad[] = Array.isArray(data) ? data : (data?.items ?? [])

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Peremeshenie (Transfer)</h1>
            <p className="text-base text-slate-500 mt-1">
              Filial-filial orasida tovar o'tkazish
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Transfer moduli</h3>
              <p className="text-sm text-blue-800 mt-1">
                Bir filialdan boshqa filialga tovarni ko'chirish uchun. Hozir {skladlar.length} ta filial mavjud.
                Bot orqali yoki Mini App'da o'tkazish funksiyasi rivojlantirilmoqda.
              </p>
            </div>
          </div>
        </Card>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skladlar.map(s => (
            <Card key={s.id} className="p-5">
              <div className="font-semibold text-lg">{s.nomi}</div>
              <div className="text-sm text-slate-500 mt-1">{s.turi || "Sklad"}</div>
              {s.latitude && s.longitude && (
                <div className="text-xs text-slate-400 mt-2">
                  📍 {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </div>
              )}
            </Card>
          ))}
        </div>

        {!loading && skladlar.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Filial yo'q. Sozlamalardan filial qo'shing.
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
