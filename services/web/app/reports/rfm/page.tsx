"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TrendingUp, Users, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { formatCurrency } from "@/lib/format"

type SegmentClient = {
  id: number; ism: string; telefon?: string;
  R: number; F: number; M: number;
  frequency: number; monetary: number; recency_days: number;
  oxirgi?: string;
}

type RfmReport = {
  jami_klient: number
  jami_summa: number
  segmentlar: Record<string, { soni: number; monetary: number; top: SegmentClient[] }>
}

const SEGMENT_META: Record<string, { label: string; color: string; icon: string; tavsiya: string }> = {
  Champions: { label: "Champions (VIP)", color: "from-amber-400 to-amber-600",  icon: "🏆", tavsiya: "Shaxsiy hurmat, maxsus takliflar, exclusive bonus" },
  Loyal:     { label: "Loyal",           color: "from-emerald-400 to-emerald-600", icon: "💚", tavsiya: "Obunaga taklif, bonus ball, referal dasturi" },
  Potential: { label: "Potential",       color: "from-sky-400 to-sky-600",      icon: "🌱", tavsiya: "Chegirma kupon, yangi mahsulot taqdimoti" },
  "At Risk": { label: "At Risk",         color: "from-orange-400 to-orange-600", icon: "⚠️", tavsiya: "Shaxsiy qo'ng'iroq, yo'qotmang!" },
  Lost:      { label: "Lost",            color: "from-slate-400 to-slate-600",    icon: "💀", tavsiya: "Yangi ofer yoki unuting" },
}

const ORDER = ["Champions", "Loyal", "Potential", "At Risk", "Lost"]

export default function ReportsRfmPage() {
  const [data, setData] = useState<RfmReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeSeg, setActiveSeg] = useState("Champions")

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/reports/rfm`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const total = data?.jami_klient || 0
  const segments = data?.segmentlar

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={Users}
          gradient="violet"
          title="RFM Tahlil"
          subtitle="Klient segmentatsiya — Recency, Frequency, Monetary"
        />

        {loading && (
          <div className="flex justify-center p-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
          </div>
        )}
        {error && !loading && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {!loading && !error && data && segments && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> Jami klient (aktiv)
                </div>
                <div className="text-2xl font-bold mt-1">{data.jami_klient}</div>
              </div>
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
                <div className="text-xs text-muted-foreground">Jami sotuv</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(data.jami_summa)}</div>
              </div>
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
                <div className="text-xs text-muted-foreground">VIP ulush</div>
                <div className="text-2xl font-bold mt-1 text-amber-600">
                  {total > 0 ? Math.round((segments.Champions.soni / total) * 100) : 0}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {segments.Champions.soni} Champion
                </div>
              </div>
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
                <div className="text-xs text-muted-foreground">At Risk + Lost</div>
                <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                  {segments["At Risk"].soni + segments.Lost.soni}
                </div>
                <div className="text-[11px] text-muted-foreground">yo&apos;qotish xavfi</div>
              </div>
            </div>

            {/* Segment distribution bars */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Segment taqsimoti</h3>
              <div className="space-y-3">
                {ORDER.map(seg => {
                  const s = segments[seg]
                  const meta = SEGMENT_META[seg]
                  const pct = total > 0 ? (s.soni / total) * 100 : 0
                  const sumPct = data.jami_summa > 0 ? (s.monetary / data.jami_summa) * 100 : 0
                  return (
                    <div key={seg}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xl">{meta.icon}</span>
                          <span className="font-semibold">{meta.label}</span>
                          <Badge variant="outline" className="text-xs">{s.soni} klient ({pct.toFixed(1)}%)</Badge>
                        </div>
                        <div className="text-sm font-mono">{formatCurrency(s.monetary)} ({sumPct.toFixed(1)}%)</div>
                      </div>
                      <div className="h-6 bg-secondary rounded-full overflow-hidden relative">
                        <div
                          className={`h-full bg-gradient-to-r ${meta.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Segment tabs + top 10 drill-down */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="border-b flex flex-wrap">
                {ORDER.map(seg => {
                  const s = segments[seg]
                  return (
                    <button
                      key={seg}
                      onClick={() => setActiveSeg(seg)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                        activeSeg === seg
                          ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {SEGMENT_META[seg].icon} {SEGMENT_META[seg].label}
                      <span className="ml-1 text-xs opacity-60">({s.soni})</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-4 bg-secondary/30 border-b">
                <div className="text-xs text-muted-foreground">Strategik tavsiya:</div>
                <div className="text-sm font-medium mt-1">{SEGMENT_META[activeSeg].tavsiya}</div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead className="hidden md:table-cell">Telefon</TableHead>
                    <TableHead className="text-center">R / F / M</TableHead>
                    <TableHead className="text-right">Xaridlar</TableHead>
                    <TableHead className="text-right">Jami summa</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Oxirgi</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments[activeSeg].top.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Bu segmentda klient yo&apos;q
                      </TableCell>
                    </TableRow>
                  ) : segments[activeSeg].top.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.ism}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {c.telefon || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-xs">
                          R{c.R} F{c.F} M{c.M}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{c.frequency}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(c.monetary)}
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell text-xs text-muted-foreground">
                        {c.recency_days}k oldin
                      </TableCell>
                      <TableCell>
                        <Link href={`/klient360?id=${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-7">360°</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300">
              <div className="font-bold mb-1">Izoh:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>R (Recency)</b> — oxirgi xarid qachon bo&apos;lgan (1..5, 5 eng yaqin)</li>
                <li><b>F (Frequency)</b> — necha marta xarid qilingan</li>
                <li><b>M (Monetary)</b> — jami qancha pul sarflagan</li>
                <li>Segment: R+F+M yig&apos;indisi quintilega bo&apos;lingan</li>
                <li>Aktiv klientlar bilan ishlang — At Risk ga tushib qolmasin</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
