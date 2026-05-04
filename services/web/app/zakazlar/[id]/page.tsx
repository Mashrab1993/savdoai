"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Copy, ChevronRight, CheckCircle, Clock, Package, Truck, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"
import { api, ApiError } from "@/lib/api"
import { toast } from "sonner"

type SavdoDetail = {
  id: number
  klient_ismi?: string
  klient_telefon?: string
  klient_manzil?: string
  klient_id?: number
  jami: number
  tolangan?: number
  qarz?: number
  sana: string
  izoh?: string
  holat?: string
  document_number?: string
  tip_zayavki?: string
  tovarlar?: Array<{ id?: number; tovar_nomi: string; miqdor: number; birlik?: string; sotish_narxi: number; jami: number; qaytarilgan?: number }>
}

type WorkflowResp = {
  transitions: Record<string, string[]>
  labels: Record<string, string>
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  yangi: Clock,
  tasdiqlangan: CheckCircle,
  yigilmoqda: Package,
  otgruzka: Truck,
  yetkazildi: CheckCircle,
  yopiq: CheckCircle,
  bekor: X,
}

const STATUS_FLOW = ["yangi", "tasdiqlangan", "yigilmoqda", "otgruzka", "yetkazildi", "yopiq"]

export default function ZakazDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const sotuvId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data: s, loading, refetch } = useApi<SavdoDetail>(
    isAuthenticated && sotuvId ? `/api/v1/savdo/${sotuvId}` : null
  )
  const { data: workflow } = useApi<WorkflowResp>(
    isAuthenticated ? "/api/v1/savdo-holat-workflow" : null
  )

  const [changing, setChanging] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const currentStatus = (s?.holat || "yangi") as string
  const allowed = workflow?.transitions[currentStatus] || []

  const changeStatus = async (newStatus: string) => {
    setChanging(true)
    try {
      await api.post(`/api/v1/savdo/${sotuvId}/holat`, { holat: newStatus })
      toast.success(`Holat: ${workflow?.labels[newStatus] || newStatus}`)
      refetch()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    } finally {
      setChanging(false)
    }
  }

  const duplicate = async () => {
    setDuplicating(true)
    try {
      const res = await api.post<{ id: number; document_number?: string }>(`/api/v1/savdo/${sotuvId}/duplicate`)
      toast.success(`Nusxa: #${res.id}${res.document_number ? ` (${res.document_number})` : ""}`)
      window.location.href = `/zakazlar/${res.id}`
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    } finally {
      setDuplicating(false)
    }
  }

  const isFlowStatus = STATUS_FLOW.includes(currentStatus)
  const currentStepIndex = STATUS_FLOW.indexOf(currentStatus)

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/zakazlar" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Zakaz #{sotuvId}
                {s?.document_number && <span className="ml-2 text-base text-slate-500 font-mono">({s.document_number})</span>}
              </h1>
              <p className="text-base text-slate-500 mt-1">{s?.klient_ismi || "—"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={duplicate} disabled={duplicating}>
              {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Nusxalash
            </Button>
            <Link href={`/zakazlar/print?ids=${sotuvId}`} target="_blank">
              <Button><Printer className="w-4 h-4" /> Pechat</Button>
            </Link>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {s && (
          <>
            {/* STATUS TIMELINE */}
            {isFlowStatus && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Holat (Status)</h3>
                  {allowed.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {allowed.map((next) => {
                        const Icon = STATUS_ICONS[next] || ChevronRight
                        const isBekor = next === "bekor"
                        return (
                          <Button
                            key={next}
                            size="sm"
                            variant={isBekor ? "outline" : "default"}
                            onClick={() => changeStatus(next)}
                            disabled={changing}
                            className={isBekor ? "text-rose-700 border-rose-200 hover:bg-rose-50" : ""}
                          >
                            {changing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                            → {workflow?.labels[next] || next}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Visual timeline */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {STATUS_FLOW.map((step, idx) => {
                    const Icon = STATUS_ICONS[step] || Clock
                    const isPast = idx < currentStepIndex
                    const isCurrent = idx === currentStepIndex
                    const isFuture = idx > currentStepIndex
                    return (
                      <div key={step} className="flex items-center gap-2 flex-shrink-0">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          isCurrent ? "bg-emerald-600 text-white border-emerald-600 shadow-md" :
                          isPast ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{workflow?.labels[step] || step}</span>
                        </div>
                        {idx < STATUS_FLOW.length - 1 && (
                          <ChevronRight className={`w-4 h-4 ${isPast ? "text-emerald-400" : "text-slate-300"}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* BEKOR holatda */}
            {currentStatus === "bekor" && (
              <Card className="p-5 bg-rose-50 border-rose-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <X className="w-6 h-6 text-rose-600" />
                    <div>
                      <h3 className="font-semibold text-rose-800">Bekor qilingan</h3>
                      {s.izoh && <p className="text-sm text-rose-700 mt-1">{s.izoh}</p>}
                    </div>
                  </div>
                  {workflow?.transitions["bekor"]?.includes("yangi") && (
                    <Button variant="outline" onClick={() => changeStatus("yangi")} disabled={changing}>
                      Tiklash → Yangi
                    </Button>
                  )}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-xs uppercase font-semibold text-slate-500">Jami</div>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(Number(s.jami))}</div>
              </Card>
              <Card className="p-4 border-emerald-200">
                <div className="text-xs uppercase font-semibold text-emerald-700">To'langan</div>
                <div className="text-2xl font-bold text-emerald-700 tabular-nums">{formatCurrency(Number(s.tolangan || 0))}</div>
              </Card>
              <Card className="p-4 border-rose-200">
                <div className="text-xs uppercase font-semibold text-rose-700">Qarz</div>
                <div className="text-2xl font-bold text-rose-700 tabular-nums">{formatCurrency(Number(s.qarz || 0))}</div>
              </Card>
            </div>

            {s.tovarlar && s.tovarlar.length > 0 && (
              <Card>
                <div className="px-5 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Tovarlar ({s.tovarlar.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Tovar</th>
                        <th className="px-4 py-3 text-right font-semibold">Miqdor</th>
                        {s.tovarlar.some(t => Number(t.qaytarilgan || 0) > 0) && (
                          <th className="px-4 py-3 text-right font-semibold text-rose-600">Qaytarilgan</th>
                        )}
                        <th className="px-4 py-3 text-right font-semibold">Narx</th>
                        <th className="px-4 py-3 text-right font-semibold">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {s.tovarlar.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">{t.tovar_nomi}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{t.miqdor} {t.birlik || ""}</td>
                          {s.tovarlar?.some(x => Number(x.qaytarilgan || 0) > 0) && (
                            <td className="px-4 py-2 text-right tabular-nums text-rose-600">
                              {Number(t.qaytarilgan || 0) > 0 ? t.qaytarilgan : "—"}
                            </td>
                          )}
                          <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(t.sotish_narxi))}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(Number(t.jami))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {s.izoh && currentStatus !== "bekor" && (
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="text-xs uppercase font-semibold text-amber-700">Izoh</div>
                <div className="text-sm">{s.izoh}</div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
