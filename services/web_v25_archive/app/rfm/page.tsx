"use client"

/**
 * RFM Klient segmentatsiyasi — Champion, Loyal, At Risk, Lost va h.k.
 * API: /api/v1/segment (shared.services.klient_segment)
 */

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import {
  Crown, Gem, TrendingUp, Sparkles, AlertTriangle,
  Moon, XCircle, Search, Users, Phone,
} from "lucide-react"

type SegmentKey = "champion" | "loyal" | "potential" | "new" | "at_risk" | "sleeping" | "lost"

interface KlientRow {
  id: number
  ism: string
  telefon: string | null
  segment: SegmentKey
  segment_nomi: string
  segment_emoji: string
  recency_kun: number | null
  frequency_90: number
  monetary_90: number
  faol_qarz: number
}

interface RFMResponse {
  klientlar: KlientRow[]
  xulosa: Record<SegmentKey, { nomi: string; emoji: string; soni: number; foiz: number }>
  jami: number
}

const SEGMENTS: Record<SegmentKey, {
  label: string
  desc: string
  color: string
  accent: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  champion: { label: "Champion", desc: "Yaqinda, ko'p, katta summa", color: "from-emerald-500 to-green-600", accent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: Crown },
  loyal:    { label: "Loyal",    desc: "Sodiq mijoz — doim oladi",    color: "from-blue-500 to-indigo-600",    accent: "bg-blue-500/15 text-blue-700 dark:text-blue-300",    icon: Gem },
  potential:{ label: "Potential", desc: "Yangi lekin yaxshi", color: "from-cyan-500 to-teal-600", accent: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300", icon: TrendingUp },
  new:      { label: "New",      desc: "Yaqinda kelgan",     color: "from-violet-500 to-purple-600",  accent: "bg-violet-500/15 text-violet-700 dark:text-violet-300",  icon: Sparkles },
  at_risk:  { label: "At Risk",  desc: "Ketib qolish xavfi!", color: "from-orange-500 to-red-500", accent: "bg-red-500/15 text-red-700 dark:text-red-300", icon: AlertTriangle },
  sleeping: { label: "Sleeping", desc: "Uxlayapti — eslating", color: "from-amber-500 to-yellow-600", accent: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: Moon },
  lost:     { label: "Lost",     desc: "Yo'qoldi — qayta jalb", color: "from-slate-500 to-gray-700", accent: "bg-slate-500/15 text-slate-700 dark:text-slate-300", icon: XCircle },
}

const ORDER: SegmentKey[] = ["champion", "loyal", "potential", "new", "at_risk", "sleeping", "lost"]


export default function RFMPage() {
  const [filter, setFilter] = useState<SegmentKey | "all">("all")
  const [search, setSearch] = useState("")

  const { data, loading, error, refetch } = useApi(
    () => api.get<RFMResponse>("/api/v1/segment"),
    [],
  )

  const filtered = useMemo(() => {
    let list = data?.klientlar || []
    if (filter !== "all") list = list.filter(k => k.segment === filter)
    if (search) {
      const n = search.toLowerCase()
      list = list.filter(k => k.ism.toLowerCase().includes(n) || (k.telefon || "").includes(search))
    }
    return list.sort((a, b) => b.monetary_90 - a.monetary_90)
  }, [data, filter, search])

  return (
    <AdminLayout title="RFM Klient segmentatsiyasi">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Users className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">RFM segmentatsiya</h2>
            <p className="text-sm opacity-80 mb-4">
              Recency (oxirgi xarid) × Frequency (qatnash) × Monetary (summa)
              <span className="ml-2 opacity-60">— so&apos;nggi 90 kun</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {ORDER.map((seg) => {
                const m = SEGMENTS[seg]
                const count = data?.xulosa?.[seg]?.soni || 0
                const foiz = data?.xulosa?.[seg]?.foiz || 0
                const Icon = m.icon
                return (
                  <button
                    key={seg}
                    onClick={() => setFilter(seg === filter ? "all" : seg)}
                    className={`text-left p-3 rounded-lg transition-all ${
                      filter === seg ? "bg-white/20 scale-105" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs opacity-90">{m.label}</span>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs opacity-70">{foiz}%</div>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            <div className="flex gap-3 flex-wrap items-center">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Ism yoki telefondan qidirish..."
                  value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")} size="sm">
                Hammasi ({data.jami})
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Recency</TableHead>
                    <TableHead className="text-right">Freq 90k</TableHead>
                    <TableHead className="text-right">Summa 90k</TableHead>
                    <TableHead className="text-right">Qarz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto opacity-30 mb-2" />
                        {search || filter !== "all" ? "Qidiruvga mos klient yo'q" : "Klient yo'q"}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((k, i) => {
                    const m = SEGMENTS[k.segment]
                    return (
                      <TableRow key={k.id}>
                        <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{k.ism}</div>
                          {k.telefon && (
                            <a href={`tel:${k.telefon}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {k.telefon}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={m.accent} title={m.desc}>
                            <m.icon className="w-3 h-3 mr-1 inline" />
                            {m.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {k.recency_kun !== null ? `${k.recency_kun} kun` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {k.frequency_90}×
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(k.monetary_90)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {k.faol_qarz > 0 ? (
                            <span className="text-red-600 font-mono">{formatCurrency(k.faol_qarz)}</span>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                RFM segmentatsiya qanday hisoblanadi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="font-medium mb-1">📅 Recency</div>
                  <div className="text-muted-foreground">Oxirgi xariddan necha kun o&apos;tgani</div>
                </div>
                <div>
                  <div className="font-medium mb-1">🔄 Frequency</div>
                  <div className="text-muted-foreground">So&apos;nggi 90 kunda necha marta kelgan</div>
                </div>
                <div>
                  <div className="font-medium mb-1">💰 Monetary</div>
                  <div className="text-muted-foreground">So&apos;nggi 90 kun jami summa</div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
