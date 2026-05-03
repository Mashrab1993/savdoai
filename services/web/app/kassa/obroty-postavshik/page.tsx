"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KassaStats = { jami_kirim: string; jami_chiqim: string; jami_balans: string; bugun_kirim: string; bugun_chiqim: string; bugun_balans: string }

export default function ObrotyPostavshikPage() {
  const { isAuthenticated } = useAuth()
  const { data } = useApi<KassaStats>(isAuthenticated ? "/api/v1/kassa/stats" : null)
  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Postavshik aylanmasi</h1>
            <p className="text-base text-slate-500 mt-1">Kassa — Postavshik aylanmasi{!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}</p>
          </div>
        </div>
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-5 border-emerald-200 bg-emerald-50/40"><div className="text-xs uppercase font-semibold text-emerald-700">Jami kirim</div><div className="text-2xl font-bold text-emerald-800 tabular-nums">{formatCurrency(Number(data.jami_kirim || 0))}</div></Card>
            <Card className="p-5 border-rose-200 bg-rose-50/40"><div className="text-xs uppercase font-semibold text-rose-700">Jami chiqim</div><div className="text-2xl font-bold text-rose-800 tabular-nums">{formatCurrency(Number(data.jami_chiqim || 0))}</div></Card>
            <Card className="p-5 border-blue-200 bg-blue-50/40"><div className="text-xs uppercase font-semibold text-blue-700">Balans</div><div className="text-2xl font-bold text-blue-800 tabular-nums">{formatCurrency(Number(data.jami_balans || 0))}</div></Card>
          </div>
        )}
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Postavshik aylanmasi moduli</h3>
              <p className="text-sm text-blue-800 mt-1">Real-time kassa ma'lumotlari yuqorida. Batafsil pul oqimi tahlili rivojlantirilmoqda.</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
