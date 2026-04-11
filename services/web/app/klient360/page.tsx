"use client"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Search, AlertCircle } from "lucide-react"
import Client360View from "@/components/dashboard/client-360-view"

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

  const k = data?.klient

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

      </div>
    </AdminLayout>
  )
}
