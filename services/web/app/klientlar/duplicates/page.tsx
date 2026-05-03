"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle, Users } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string; telefon?: string; manzil?: string }
type KlientResp = { total: number; items: Klient[] }

export default function DuplicatesPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=500" : null)

  const klients = data?.items ?? []
  // Detect possible duplicates by similar names (lowercase, trim) or same phone
  const groups: Record<string, Klient[]> = {}
  klients.forEach(k => {
    const norm = (k.ism || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 20)
    if (!groups[norm]) groups[norm] = []
    groups[norm].push(k)
  })
  const duplicates = Object.entries(groups).filter(([, v]) => v.length > 1)

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klient dublikatlari</h1>
            <p className="text-base text-slate-500 mt-1">
              O'xshash nom yoki telefon bilan klientlar — birlashtirish kerak bo'lishi mumkin
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-blue-200 bg-blue-50/40">
            <div className="text-xs uppercase font-semibold text-blue-700">Jami klient</div>
            <div className="text-3xl font-bold text-blue-800 tabular-nums">{klients.length}</div>
          </Card>
          <Card className="p-4 border-amber-200 bg-amber-50/40">
            <div className="text-xs uppercase font-semibold text-amber-700">Shubhali guruh</div>
            <div className="text-3xl font-bold text-amber-800 tabular-nums">{duplicates.length}</div>
          </Card>
          <Card className="p-4 border-rose-200 bg-rose-50/40">
            <div className="text-xs uppercase font-semibold text-rose-700">Dublikat klient</div>
            <div className="text-3xl font-bold text-rose-800 tabular-nums">
              {duplicates.reduce((s, [, v]) => s + v.length, 0)}
            </div>
          </Card>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}

        {!loading && duplicates.length === 0 && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            ✅ Dublikat topilmadi — hamma klient unikal
          </Card>
        )}

        {duplicates.length > 0 && (
          <div className="space-y-4">
            {duplicates.map(([key, group]) => (
              <Card key={key} className="p-4 border-amber-200">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">"{group[0].ism.slice(0, 40)}..." — {group.length} ta o'xshash</div>
                  </div>
                </div>
                <div className="space-y-2 ml-8">
                  {group.map(k => (
                    <Link key={k.id} href={`/klientlar/${k.id}`}>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium">{k.ism}</div>
                            <div className="text-xs text-slate-500">ID: {k.id} · {k.telefon || "telefon yo'q"} · {k.manzil || "manzil yo'q"}</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
