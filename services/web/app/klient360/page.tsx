"use client"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  User, Phone, MapPin, Calendar, TrendingUp, Package,
  CreditCard, DollarSign, Search, AlertCircle, Trophy,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"
import Client360View, { type Client360 } from "@/components/dashboard/client-360-view"

type Klient360Data = {
  klient: {
    id: number; ism: string; telefon?: string; manzil?: string;
    kategoriya?: string; kredit_limit?: number; jami_sotib?: number;
    jami_xaridlar?: number; xarid_soni?: number;
    oxirgi_sotuv?: string; yaratilgan?: string; eslatma?: string;
  }
  qarz_balans: {
    jami_qarz?: number; jami_tolangan?: number;
    aktiv_qarz?: number; aktiv_soni?: number; yopilgan_soni?: number;
  }
  sotuv_stats: {
    soni?: number; jami?: number; tolangan?: number;
    ortacha_chek?: number; oxirgi_sotuv?: string; birinchi_sotuv?: string;
  }
  top_tovarlar: Array<{
    tovar_nomi: string; kategoriya?: string; miqdor: number;
    jami: number; sotuv_soni: number; oxirgi?: string;
  }>
  oxirgi_sotuvlar: Array<{
    id: number; sana: string; jami: number; tolangan: number;
    qarz: number; tovar_soni: number;
  }>
  oylik_trend: Array<{ oy: string; soni: number; jami: number }>
  rfm: {
    R: number; F: number; M: number; segment: string;
    recency_days: number; frequency: number; monetary: number;
  } | null
}

const SEGMENT_COLORS: Record<string, { bg: string; label: string; icon: string }> = {
  Champions: { bg: "bg-amber-100 text-amber-800 border-amber-300", label: "Champion (VIP)", icon: "🏆" },
  Loyal:     { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Loyal", icon: "💚" },
  Potential: { bg: "bg-sky-100 text-sky-800 border-sky-300", label: "Potential", icon: "🌱" },
  "At Risk": { bg: "bg-orange-100 text-orange-800 border-orange-300", label: "At Risk", icon: "⚠️" },
  Lost:      { bg: "bg-gray-200 text-gray-700 border-gray-300", label: "Lost", icon: "💀" },
}

export default function Klient360Page() {
  const [klientId, setKlientId] = useState("")
  const [data, setData] = useState<Klient360Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()

  const yukla = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true); setError("")
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/klient360/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        setError(res.status === 404 ? "Klient topilmadi" : "Xatolik yuz berdi")
        setData(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = searchParams?.get("id")
    if (id) { setKlientId(id); yukla(id) }
  }, [searchParams, yukla])

  const k      = data?.klient
  const q      = data?.qarz_balans
  const stats  = data?.sotuv_stats
  const rfm    = data?.rfm
  const seg    = rfm ? SEGMENT_COLORS[rfm.segment] : null

  // Max value for trend chart normalization
  const maxTrend = Math.max(1, ...(data?.oylik_trend || []).map(t => Number(t.jami)))

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-7 h-7 text-emerald-600" /> Klient 360°
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            SalesDoc darajasida klient profili — RFM, tarix, prognoz
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Klient ID kiriting"
              value={klientId}
              onChange={e => setKlientId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && yukla(klientId)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => yukla(klientId)} disabled={!klientId || loading}>
            {loading ? "Yuklanmoqda..." : "Ko'rish"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {data && k && (
          <Client360View
            client={{
              id:             k.id,
              ism:            k.ism,
              telefon:        k.telefon,
              manzil:         k.manzil,
              kategoriya:     k.kategoriya,
              jami_xaridlar:  Number(k.jami_xaridlar ?? k.jami_sotib ?? data.sotuv_stats?.jami ?? 0),
              xarid_soni:     Number(k.xarid_soni ?? data.sotuv_stats?.soni ?? 0),
              ortacha_chek:   Number(data.sotuv_stats?.ortacha_chek ?? 0),
              joriy_qarz:     Number(data.qarz_balans?.aktiv_qarz ?? 0),
              kredit_limit:   Number(k.kredit_limit ?? 0),
              birinchi_sotuv: data.sotuv_stats?.birinchi_sotuv,
              oxirgi_sotuv:   k.oxirgi_sotuv ?? data.sotuv_stats?.oxirgi_sotuv,
              rfm_segment:
                data.rfm?.segment === "Champions"  ? "champions" :
                data.rfm?.segment === "Loyal"      ? "loyal" :
                data.rfm?.segment === "Potential"  ? "potential" :
                data.rfm?.segment === "At Risk"    ? "at_risk" :
                data.rfm?.segment === "Lost"       ? "lost" :
                data.rfm                            ? "new" :
                                                     undefined,
              rfm_score:      data.rfm ? { R: data.rfm.R, F: data.rfm.F, M: data.rfm.M } : undefined,
              oxirgi_sotuvlar: (data.oxirgi_sotuvlar || []).map(o => ({
                id:         o.id,
                sana:       o.sana,
                jami:       Number(o.jami || 0),
                tovar_soni: Number(o.tovar_soni || 0),
              })),
              top_tovarlar:   (data.top_tovarlar || []).map(t => ({
                nomi:   t.tovar_nomi,
                jami:   Number(t.jami || 0),
                miqdor: Number(t.miqdor || 0),
              })),
              oylik_trend:    (data.oylik_trend || []).map(m => ({
                oy:   m.oy,
                jami: Number(m.jami || 0),
              })),
            }}
          />
        )}

        {data && k && false && (
          <div className="space-y-5">
            {/* Header Card (legacy — kept hidden for reference) */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                    {(k.ism || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{k.ism}</h2>
                    <div className="text-sm opacity-90 flex items-center gap-3 mt-1 flex-wrap">
                      {k.telefon && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{k.telefon}</span>}
                      {k.manzil && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{k.manzil}</span>}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Klient #{k.id} · {k.kategoriya || "oddiy"}
                      {stats?.birinchi_sotuv && ` · birinchi xarid ${new Date(stats.birinchi_sotuv).toLocaleDateString("uz-UZ")}`}
                    </div>
                  </div>
                </div>
                {seg && rfm && (
                  <div className={`px-4 py-3 rounded-xl border-2 bg-white/10 backdrop-blur border-white/30 text-center`}>
                    <div className="text-3xl">{seg.icon}</div>
                    <div className="text-sm font-bold mt-1">{seg.label}</div>
                    <div className="text-xs opacity-75 mt-1">R{rfm.R} F{rfm.F} M{rfm.M}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <DollarSign className="w-4 h-4" /> Jami xarid
                </div>
                <div className="text-xl font-bold mt-1">{formatCurrency(Number(stats?.jami || 0))}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {stats?.soni || 0} ta sotuv
                </div>
              </div>
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <TrendingUp className="w-4 h-4" /> O&apos;rtacha chek
                </div>
                <div className="text-xl font-bold mt-1">{formatCurrency(Number(stats?.ortacha_chek || 0))}</div>
              </div>
              <div className={`bg-card border rounded-xl p-4 ${Number(q?.aktiv_qarz || 0) > 0 ? "border-red-300" : ""}`}>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CreditCard className="w-4 h-4" /> Aktiv qarz
                </div>
                <div className={`text-xl font-bold mt-1 ${Number(q?.aktiv_qarz || 0) > 0 ? "text-red-600" : ""}`}>
                  {formatCurrency(Number(q?.aktiv_qarz || 0))}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {q?.aktiv_soni || 0} ta aktiv / {q?.yopilgan_soni || 0} ta yopilgan
                </div>
              </div>
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Calendar className="w-4 h-4" /> Oxirgi sotuv
                </div>
                <div className="text-sm font-bold mt-1">
                  {stats?.oxirgi_sotuv ? new Date(stats.oxirgi_sotuv).toLocaleDateString("uz-UZ") : "—"}
                </div>
                {rfm && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {rfm.recency_days} kun oldin
                  </div>
                )}
              </div>
            </div>

            {/* 2-column: Top products + Monthly trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top tovarlar */}
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold">Top 10 sotib olgan tovarlar</h3>
                </div>
                <div className="divide-y">
                  {(data.top_tovarlar || []).length === 0 && (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      Hali tovarlar yo&apos;q
                    </div>
                  )}
                  {(data.top_tovarlar || []).map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{t.tovar_nomi}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {t.kategoriya} · {Number(t.miqdor).toFixed(0)} dona · {t.sotuv_soni} marta
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold font-mono shrink-0">
                        {formatCurrency(Number(t.jami))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 12-oylik trend */}
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold">12 oylik trend</h3>
                </div>
                <div className="p-4 space-y-2">
                  {(data.oylik_trend || []).length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Ma&apos;lumot yetarli emas
                    </div>
                  )}
                  {(data.oylik_trend || []).map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-16">{t.oy}</span>
                      <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden relative">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all"
                          style={{ width: `${(Number(t.jami) / maxTrend) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-semibold">
                          {formatCurrency(Number(t.jami))}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{t.soni}×</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Oxirgi sotuvlar jadvali */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-600" />
                <h3 className="font-semibold">Oxirgi 20 ta sotuv</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-center">Tovar</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead className="text-right">To&apos;landi</TableHead>
                    <TableHead className="text-right">Qarz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.oxirgi_sotuvlar || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Sotuvlar yo&apos;q
                      </TableCell>
                    </TableRow>
                  ) : (data.oxirgi_sotuvlar || []).map(s => {
                    const qarz = Number(s.qarz || 0)
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">#{s.id}</TableCell>
                        <TableCell className="text-sm">
                          {s.sana ? new Date(s.sana).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="text-center text-xs">{s.tovar_soni}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {formatCurrency(Number(s.jami))}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-600">
                          {formatCurrency(Number(s.tolangan))}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${qarz > 0 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                          {qarz > 0 ? formatCurrency(qarz) : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {rfm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <div className="font-bold mb-1">RFM tahlil:</div>
                <div>
                  <b>R (Recency)</b> — oxirgi xarid {rfm.recency_days} kun oldin (ball: {rfm.R}/5)<br />
                  <b>F (Frequency)</b> — {rfm.frequency} marta xarid qilgan (ball: {rfm.F}/5)<br />
                  <b>M (Monetary)</b> — jami {formatCurrency(rfm.monetary)} sarflagan (ball: {rfm.M}/5)
                </div>
                <Badge className="mt-2">Segment: {rfm.segment}</Badge>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
