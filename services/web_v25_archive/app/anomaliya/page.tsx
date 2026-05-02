"use client"

/**
 * AI Anomaliya Detektori — /anomaliya.
 *
 * Oxirgi 7 kun ichida g'ayrioddiy hodisalarni ko'rsatadi:
 * - Zararli sotuv (tannarxdan past)
 * - Katta qarz (>5M)
 * - Kuniga ko'p zayavka bir klientdan
 * - Katta miqdor (>100 dona)
 *
 * Opus 4.7 tahlil qilib qisqa strategiya taklif qiladi.
 */

import { useState, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import {
  AlertTriangle, Shield, TrendingDown, Package, Users,
  Calendar, Sparkles, Zap,
} from "lucide-react"

interface Anomaliya {
  tur: string
  daraja: "yuqori" | "o'rta" | "past"
  id?: number
  document_number?: string
  klient?: string
  sana?: string
  jami?: number
  tannarx?: number
  zarar?: number
  qarz?: number
  tovar?: string
  miqdor?: number
  soni?: number
  sabab: string
}

interface AnomaliyaResponse {
  davr: { sana_dan: string; kunlar: number }
  jami_anomaliya: number
  daraja_bo_yicha: { yuqori: number; o_rta: number; past: number }
  anomaliyalar: Anomaliya[]
  ai_xulosa: string | null
}

const TUR_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; gradient: string }> = {
  zararli_sotuv: { label: "Zararli sotuv",  icon: TrendingDown, gradient: "from-red-500 to-rose-600" },
  katta_qarz:    { label: "Katta qarz",     icon: Users,        gradient: "from-orange-500 to-red-500" },
  kop_zayavka:   { label: "Ko'p zayavka",   icon: Users,        gradient: "from-amber-500 to-yellow-600" },
  katta_miqdor:  { label: "Katta miqdor",   icon: Package,      gradient: "from-blue-500 to-indigo-600" },
}

const DARAJA_COLOR = {
  "yuqori": "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  "o'rta":  "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "past":   "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
}


export default function AnomaliyaPage() {
  const [kunlar, setKunlar] = useState(7)
  const fetcher = useCallback(
    () => api.get<AnomaliyaResponse>(`/api/v1/anomaliya?kunlar=${kunlar}`),
    [kunlar],
  )
  const { data, loading, error, refetch } = useApi(fetcher, [kunlar])

  return (
    <AdminLayout title="AI Anomaliya detektori">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-red-900 via-rose-800 to-orange-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Shield className="w-40 h-40" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">AI Anomaliya detektori</h2>
              <Badge className="bg-white/20 text-white border-white/30">Opus 4.7</Badge>
            </div>
            <p className="text-sm opacity-80 mb-4">
              Biznesdagi g&apos;ayrioddiy hodisalarni AI orqali topadi — zarar, katta qarz, bot zayavka.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[3, 7, 14, 30].map(k => (
                <Button key={k} size="sm"
                  onClick={() => setKunlar(k)}
                  className={`${kunlar === k ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"} text-xs`}>
                  {k} kun
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={String(error)} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-5 bg-gradient-to-br from-slate-700 to-slate-900 text-white border-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 opacity-80" />
                  <span className="text-xs opacity-80">Jami anomaliya</span>
                </div>
                <div className="text-3xl font-bold">{data.jami_anomaliya}</div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-red-500 to-red-700 text-white border-0">
                <div className="text-xs opacity-80 mb-1">🔴 Yuqori xavf</div>
                <div className="text-3xl font-bold">{data.daraja_bo_yicha.yuqori}</div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
                <div className="text-xs opacity-80 mb-1">🟡 O&apos;rta</div>
                <div className="text-3xl font-bold">{data.daraja_bo_yicha.o_rta}</div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                <div className="text-xs opacity-80 mb-1">🔵 Past</div>
                <div className="text-3xl font-bold">{data.daraja_bo_yicha.past}</div>
              </Card>
            </div>

            {/* AI XULOSA */}
            {data.ai_xulosa && (
              <Card className="p-5 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <h3 className="font-bold">Opus 4.7 xulosa va tavsiya</h3>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {data.ai_xulosa}
                </div>
              </Card>
            )}

            {/* ANOMALIYALAR LIST */}
            {data.anomaliyalar.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-green-500/30">
                <Shield className="w-16 h-16 mx-auto text-green-500 mb-3" />
                <h3 className="font-bold text-lg">🎉 Anomaliya topilmadi!</h3>
                <p className="text-sm text-muted-foreground">
                  Oxirgi {kunlar} kun ichida g&apos;ayrioddiy hodisa yo&apos;q.
                  Biznes normal holatda.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Topilgan anomaliyalar ({data.anomaliyalar.length})
                </h3>
                {data.anomaliyalar.map((a, i) => {
                  const m = TUR_META[a.tur] || { label: a.tur, icon: AlertTriangle, gradient: "from-slate-500 to-gray-700" }
                  return (
                    <Card key={i} className="p-4 flex gap-3 items-start hover:shadow-md transition-all">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center flex-shrink-0`}>
                        <m.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="font-semibold flex items-center gap-2 flex-wrap">
                              {m.label}
                              <Badge className={DARAJA_COLOR[a.daraja]}>{a.daraja}</Badge>
                              {a.document_number && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  #{a.document_number}
                                </span>
                              )}
                            </div>
                            {a.klient && (
                              <div className="text-sm text-muted-foreground">
                                👤 {a.klient}
                                {a.sana && (
                                  <span className="ml-2 inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(a.sana).toLocaleDateString("uz-UZ")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">{a.sabab}</div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {a.jami !== undefined && (
                            <span>💰 Jami: {formatCurrency(a.jami)}</span>
                          )}
                          {a.qarz !== undefined && a.qarz > 0 && (
                            <span className="text-red-600">📉 Qarz: {formatCurrency(a.qarz)}</span>
                          )}
                          {a.zarar !== undefined && a.zarar > 0 && (
                            <span className="text-red-600">❌ Zarar: {formatCurrency(a.zarar)}</span>
                          )}
                          {a.miqdor !== undefined && (
                            <span>📦 Miqdor: {a.miqdor}</span>
                          )}
                          {a.soni !== undefined && (
                            <span>🔢 Soni: {a.soni}</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
