"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Package, Tag } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type Tovar = {
  id: number
  nomi: string
  kategoriya?: string
  birlik?: string
  olish_narxi?: number
  sotish_narxi: number
  min_sotish_narxi?: number
  qoldiq: number
  min_qoldiq?: number
  brend?: string
  shtrix_kod?: string
  artikul?: string
  kod?: string
  ikpu_kod?: string
  hajm?: number
  ogirlik?: number
  blokda_soni?: number
  korobkada_soni?: number
  yaroqlilik_muddati?: number
  tavsif?: string
  faol?: boolean
  yaratilgan?: string
}

export default function TovarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const tovarId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data: tovar, loading, error } = useApi<Tovar>(
    isAuthenticated && tovarId ? `/api/v1/tovar/${tovarId}` : null
  )

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {loading ? "Yuklanmoqda..." : (tovar?.nomi || `Tovar #${tovarId}`)}
            </h1>
            <p className="text-base text-slate-500 mt-1">
              ID: {tovarId}{tovar?.kategoriya ? ` · ${tovar.kategoriya}` : ""}
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {error && <Card className="p-4 bg-rose-50 border-rose-200 text-rose-800">Xato: {error}</Card>}

        {tovar && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Qoldiq" value={`${tovar.qoldiq} ${tovar.birlik || ""}`} icon={Package} accent={tovar.qoldiq > 0 ? "emerald" : "rose"} />
              <Stat label="Min qoldiq" value={String(tovar.min_qoldiq ?? 0)} icon={Package} accent="amber" />
              <Stat label="Olish narxi" value={tovar.olish_narxi ? formatCurrency(Number(tovar.olish_narxi)) : "—"} icon={Tag} accent="blue" />
              <Stat label="Sotish narxi" value={formatCurrency(Number(tovar.sotish_narxi))} icon={Tag} accent="emerald" />
            </div>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Tovar tafsilotlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <Field label="Brend" value={tovar.brend} />
                <Field label="Kategoriya" value={tovar.kategoriya} />
                <Field label="Birlik" value={tovar.birlik} />
                <Field label="Faol" value={tovar.faol === false ? "Yo'q" : "Ha"} />
                <Field label="Shtrix kod" value={tovar.shtrix_kod} />
                <Field label="Artikul" value={tovar.artikul} />
                <Field label="Ichki kod" value={tovar.kod} />
                <Field label="IKPU" value={tovar.ikpu_kod} />
                <Field label="Min sotish narxi" value={tovar.min_sotish_narxi ? formatCurrency(Number(tovar.min_sotish_narxi)) : ""} />
                <Field label="Hajm (l)" value={tovar.hajm ? String(tovar.hajm) : ""} />
                <Field label="Og'irlik (kg)" value={tovar.ogirlik ? String(tovar.ogirlik) : ""} />
                <Field label="Blokda" value={tovar.blokda_soni ? String(tovar.blokda_soni) : ""} />
                <Field label="Korobkada" value={tovar.korobkada_soni ? String(tovar.korobkada_soni) : ""} />
                <Field label="Yaroqlilik (kun)" value={tovar.yaroqlilik_muddati ? String(tovar.yaroqlilik_muddati) : ""} />
              </div>
              {tovar.tavsif && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs uppercase font-semibold text-slate-500 mb-1">Tavsif</div>
                  <p className="text-sm text-slate-700">{tovar.tavsif}</p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: "emerald" | "rose" | "amber" | "blue" }) {
  const colors = {
    emerald: "border-emerald-200 text-emerald-700",
    rose: "border-rose-200 text-rose-700",
    amber: "border-amber-200 text-amber-700",
    blue: "border-blue-200 text-blue-700",
  }
  return (
    <Card className={`p-4 border-2 ${colors[accent]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase font-semibold text-slate-500">{label}</span>
        <Icon className="w-4 h-4 opacity-50" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <div className="text-xs uppercase font-semibold text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  )
}
