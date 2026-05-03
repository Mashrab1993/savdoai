"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Me = { id: number; ism?: string; dokon_nomi?: string }

export default function MaintenancePage() {
  const { isAuthenticated } = useAuth()
  const { data: me } = useApi<Me>(isAuthenticated ? "/api/v1/me" : null)
  return (
    <AdminLayout>
      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maintenance rejim</h1>
            <p className="text-base text-slate-500 mt-1">
              Sozlamalar bo'limi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Settings className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Maintenance rejim moduli</h3>
              <p className="text-sm text-blue-800 mt-1">
                Bu sozlama bo'limi rivojlantirilmoqda. Hozir asosiy sozlamalar /profile va /sozlamalar/diler'da bor.
              </p>
              {me && <p className="text-xs text-blue-700 mt-2">Akkaunt: <strong>{me.dokon_nomi || me.ism || "—"}</strong> (ID: {me.id})</p>}
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/sozlamalar"><Card className="p-4 hover:shadow-md cursor-pointer"><div className="font-semibold text-sm">← Sozlamalar</div></Card></Link>
          <Link href="/profile"><Card className="p-4 hover:shadow-md cursor-pointer"><div className="font-semibold text-sm">Profil</div></Card></Link>
          <Link href="/dashboard"><Card className="p-4 hover:shadow-md cursor-pointer"><div className="font-semibold text-sm">Dashboard</div></Card></Link>
        </div>
      </div>
    </AdminLayout>
  )
}
