"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type SavdoRow = { id: number; sana: string; klient_id?: number; klient_ismi?: string }
type SavdoResp = { total: number; items: SavdoRow[] }

export default function CohortPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<SavdoResp>(isAuthenticated ? "/api/v1/savdolar?limit=1000" : null)
  const items = data?.items ?? []

  // Cohort: birinchi xarid oyi -> keyingi oylar faolligi
  const klientFirstMonth: Record<string, string> = {}  // klient_id -> "YYYY-MM"
  const klientMonths: Record<string, Set<string>> = {}  // klient_id -> {months}

  items.forEach(s => {
    if (!s.klient_id) return
    const k = String(s.klient_id)
    const m = s.sana.slice(0, 7)
    if (!klientFirstMonth[k] || m < klientFirstMonth[k]) {
      klientFirstMonth[k] = m
    }
    if (!klientMonths[k]) klientMonths[k] = new Set()
    klientMonths[k].add(m)
  })

  // Build cohort matrix: cohort_month × month_offset → klient count
  const cohortKlients: Record<string, string[]> = {}  // cohort_month -> [klient_ids]
  Object.entries(klientFirstMonth).forEach(([k, m]) => {
    if (!cohortKlients[m]) cohortKlients[m] = []
    cohortKlients[m].push(k)
  })

  const cohortMonths = Object.keys(cohortKlients).sort().slice(-6)  // last 6
  const allMonths = Array.from(new Set(items.map(s => s.sana.slice(0, 7)))).sort().slice(-6)

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cohort tahlili (retention)</h1>
            <p className="text-base text-slate-500 mt-1">
              Birinchi xarid oyiga ko'ra klientlar qanchasi keyingi oylarda qaytib keldi
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && cohortMonths.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Yetarli ma'lumot yo'q. Bir necha oylik sotuv kerak cohort tahlili uchun.
          </Card>
        )}

        {cohortMonths.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Cohort (1-xarid oyi)</th>
                    <th className="px-4 py-3 text-right font-semibold">Klientlar</th>
                    {allMonths.map(m => (
                      <th key={m} className="px-3 py-3 text-center font-semibold">{m.slice(5)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cohortMonths.map(c => {
                    const klients = cohortKlients[c] || []
                    return (
                      <tr key={c} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600" />
                          {c}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold">{klients.length}</td>
                        {allMonths.map(m => {
                          if (m < c) return <td key={m} className="px-3 py-2 text-center text-slate-300">—</td>
                          const active = klients.filter(k => klientMonths[k]?.has(m)).length
                          const pct = klients.length > 0 ? (active / klients.length) * 100 : 0
                          return (
                            <td key={m} className="px-3 py-2 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                pct >= 50 ? "bg-emerald-100 text-emerald-700" :
                                pct >= 25 ? "bg-amber-100 text-amber-700" :
                                pct > 0 ? "bg-rose-100 text-rose-700" :
                                "bg-slate-100 text-slate-400"
                              }`}>
                                {pct > 0 ? `${pct.toFixed(0)}%` : "0"}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
