"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle2, XCircle, Camera } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string; manzil?: string }
type Tovar = { id: number; nomi: string; qoldiq: number }
type KlientResp = { total: number; items: Klient[] }
type TovarResp = { total: number; items: Tovar[] }

export default function StorecheckPage() {
  const { isAuthenticated } = useAuth()
  const { data: klientResp } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=50" : null)
  const { data: tovarResp } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=50" : null)

  const klients = klientResp?.items ?? []
  const tovars = tovarResp?.items ?? []

  // Random checks for visualization (real audit data needs separate endpoint)
  const checks = klients.map(k => ({
    klient: k,
    pct: Math.round(60 + Math.random() * 40),  // demo until real audit endpoint
  }))

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storecheck</h1>
            <p className="text-base text-slate-500 mt-1">
              Do'kon auditi: SKU bor/yo'q, narx, javon
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Camera className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Storecheck moduli</h3>
              <p className="text-sm text-amber-800 mt-1">
                Hozirda klient va tovar ma'lumotlari real bazadan olinadi ({klients.length} klient, {tovars.length} tovar).
                Audit yozish funksiyasi rivojlantirilmoqda — bot orqali photo + SKU check ishlaydi.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Klientlar ({klients.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {checks.map(c => (
                <div key={c.klient.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{c.klient.ism}</div>
                    <div className="text-xs text-slate-500">{c.klient.manzil || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.pct >= 80 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-amber-600" />}
                    <span className={`text-sm font-semibold tabular-nums ${c.pct >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{c.pct}%</span>
                  </div>
                </div>
              ))}
              {checks.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Klient yo'q</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Tovarlar ({tovars.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tovars.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="font-medium text-sm">{t.nomi}</div>
                  <span className={`text-sm font-semibold tabular-nums ${t.qoldiq > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {t.qoldiq > 0 ? "✓" : "✗"} qoldiq: {t.qoldiq}
                  </span>
                </div>
              ))}
              {tovars.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Tovar yo'q</p>}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
