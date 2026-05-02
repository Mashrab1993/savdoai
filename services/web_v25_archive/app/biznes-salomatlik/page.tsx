"use client"

/**
 * Biznes Salomatligi — 0-100 ball bilan umumiy holat.
 * Apple Watch "Rings" ilhom bergan visual ko'rinish.
 */

import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import {
  Heart, TrendingUp, Users, Package, AlertTriangle,
  CheckCircle, Target, Sparkles,
} from "lucide-react"

interface Komponent {
  nomi: string
  ball: number
  max: number
  foiz_info: string
}

interface HealthResponse {
  ball: number
  darajasi: string
  emoji: string
  rang: string
  komponentlar: Komponent[]
  raqamlar: {
    sotuv_shu_hafta: number
    sotuv_otgan_hafta: number
    jami_qarz: number
    jami_oborot_30k: number
    kam_qoldiq_soni: number
    jami_tovar: number
    aktiv_klient_30k: number
    jami_klient: number
    zararli_sotuvlar_7k: number
  }
}

const RANG_META: Record<string, { bg: string; text: string; ring: string; stroke: string }> = {
  emerald: { bg: "from-emerald-500 to-teal-600",    text: "text-emerald-600", ring: "ring-emerald-500", stroke: "stroke-emerald-500" },
  green:   { bg: "from-green-500 to-emerald-600",   text: "text-green-600",   ring: "ring-green-500",   stroke: "stroke-green-500" },
  yellow:  { bg: "from-yellow-500 to-amber-600",    text: "text-yellow-600",  ring: "ring-yellow-500",  stroke: "stroke-yellow-500" },
  orange:  { bg: "from-orange-500 to-red-600",      text: "text-orange-600",  ring: "ring-orange-500",  stroke: "stroke-orange-500" },
  red:     { bg: "from-red-500 to-rose-700",        text: "text-red-600",     ring: "ring-red-500",     stroke: "stroke-red-500" },
}

const KOMP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "Sotuv o'sishi":       TrendingUp,
  "Qarz boshqaruvi":     Users,
  "Tovar qoldiq":        Package,
  "Klient xilma-xilligi": Users,
  "Agent KPI":           Target,
  "Anomaliya yo'qligi":  AlertTriangle,
}


export default function BiznesSalomatlikPage() {
  const { data, loading, error, refetch } = useApi(
    () => api.get<HealthResponse>("/api/v1/biznes_salomatlik"),
    [],
  )

  const rang = data?.rang || "green"
  const meta = RANG_META[rang] || RANG_META.green
  const ball = data?.ball || 0
  const foiz = ball
  const circumference = 2 * Math.PI * 90
  const dash = (foiz / 100) * circumference

  return (
    <AdminLayout title="Biznes Salomatligi">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Heart className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Biznes Salomatligi</h2>
            <p className="text-sm opacity-80">
              Sizning biznesning umumiy holati — 0-100 ball. SalesDoc&apos;da bunday yo&apos;q.
            </p>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={String(error)} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            {/* BIG CIRCLE */}
            <Card className="p-8 flex flex-col items-center bg-gradient-to-br from-card to-muted/30">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle
                    cx="100" cy="100" r="90"
                    fill="none" stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth="12"
                  />
                  <circle
                    cx="100" cy="100" r="90"
                    fill="none" stroke="currentColor"
                    className={meta.stroke}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    style={{ transition: "stroke-dasharray 1.5s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl">{data.emoji}</div>
                  <div className={`text-7xl font-bold ${meta.text}`}>{ball}</div>
                  <div className="text-sm text-muted-foreground">/ 100 ball</div>
                </div>
              </div>
              <Badge className={`mt-4 text-base py-2 px-4 bg-gradient-to-r ${meta.bg} text-white border-0`}>
                {data.darajasi}
              </Badge>
            </Card>

            {/* KOMPONENTLAR */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Ball tarkibi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.komponentlar.map((k, i) => {
                  const Icon = KOMP_ICON[k.nomi] || CheckCircle
                  const foiz = (k.ball / k.max) * 100
                  const c = foiz >= 70 ? "emerald" : foiz >= 40 ? "yellow" : "red"
                  const cm = RANG_META[c]
                  return (
                    <Card key={i} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cm.bg} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">{k.nomi}</div>
                            <div className="text-xs text-muted-foreground">{k.foiz_info}</div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${cm.text}`}>
                          {k.ball}<span className="text-sm text-muted-foreground">/{k.max}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${cm.bg} rounded-full`}
                          style={{ width: `${foiz}%`, transition: "width 1s ease-out" }} />
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* RAQAMLAR */}
            <Card className="p-5">
              <h3 className="font-bold text-lg mb-3">Xom raqamlar (so&apos;ngi 30 kun)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Shu hafta sotuv</div>
                  <div className="font-bold">{formatCurrency(data.raqamlar.sotuv_shu_hafta)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">O&apos;tgan hafta sotuv</div>
                  <div className="font-bold">{formatCurrency(data.raqamlar.sotuv_otgan_hafta)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">30 kun oborot</div>
                  <div className="font-bold">{formatCurrency(data.raqamlar.jami_oborot_30k)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Jami qarz</div>
                  <div className="font-bold text-red-600">{formatCurrency(data.raqamlar.jami_qarz)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Faol klient</div>
                  <div className="font-bold">{data.raqamlar.aktiv_klient_30k} / {data.raqamlar.jami_klient}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Kam qoldiq</div>
                  <div className="font-bold text-orange-600">{data.raqamlar.kam_qoldiq_soni} / {data.raqamlar.jami_tovar}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Zararli sotuv 7k</div>
                  <div className={`font-bold ${data.raqamlar.zararli_sotuvlar_7k > 0 ? "text-red-600" : "text-green-600"}`}>
                    {data.raqamlar.zararli_sotuvlar_7k}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
