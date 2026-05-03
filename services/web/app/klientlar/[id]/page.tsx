"use client"
import { useState, use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft, ShoppingBag, MapPin, AlertCircle, DollarSign,
  Phone, Building2, Calendar
} from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KlientProfil = {
  id: number
  ism: string
  telefon?: string
  manzil?: string
  segment?: string
  jami_sotib?: number
  xarid_soni?: number
  oxirgi_sotuv?: string
  kredit_limit?: number
  qarz?: number
  yaratilgan?: string
}

type SotuvRow = {
  id: number
  sana: string
  jami: number
  tolangan?: number
  qarz?: number
  holat?: string
}
type SavdoResp = { total: number; items: SotuvRow[] }

export default function KlientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const klientId = Number(id)
  const { isAuthenticated } = useAuth()
  const { data: klient, loading } = useApi<KlientProfil>(
    isAuthenticated && klientId ? `/api/v1/klient/${klientId}/profil` : null
  )
  const { data: sotuvlar } = useApi<SavdoResp>(
    isAuthenticated && klientId ? `/api/v1/savdolar?klient_id=${klientId}&limit=20` : null
  )

  const items = sotuvlar?.items ?? []
  const [tab, setTab] = useState<"orders" | "debts">("orders")

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {loading ? "Yuklanmoqda..." : (klient?.ism || `Klient #${klientId}`)}
            </h1>
            <p className="text-base text-slate-500 mt-1">
              ID: {klientId}{klient?.segment ? ` · ${klient.segment}` : ""}
            </p>
          </div>
          <Link href={`/sotuv/yangi?klient_id=${klientId}`}>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded">+ Yangi sotuv</button>
          </Link>
        </div>

        {!isAuthenticated && (
          <Card className="p-6 text-center">
            <p className="text-amber-700 mb-3">Login kerak</p>
            <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded inline-block">Login</Link>
          </Card>
        )}

        {klient && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Telefon" value={klient.telefon || "—"} icon={Phone} />
              <Stat label="Manzil" value={klient.manzil || "—"} icon={MapPin} />
              <Stat label="Jami xarid" value={formatCurrency(Number(klient.jami_sotib || 0))} icon={DollarSign} accent="emerald" />
              <Stat label="Xarid soni" value={String(klient.xarid_soni ?? 0)} icon={ShoppingBag} accent="blue" />
            </div>

            {(klient.qarz ?? 0) > 0 && (
              <Card className="p-4 bg-rose-50 border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                  <div>
                    <div className="font-semibold text-rose-900">Klient qarz</div>
                    <div className="text-sm text-rose-700">Hozirda to'lanmagan summa</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-700 tabular-nums">{formatCurrency(Number(klient.qarz || 0))}</div>
              </Card>
            )}

            {klient.kredit_limit && klient.kredit_limit > 0 && (
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-900">Kredit limit:</span>
                  <span className="font-bold text-amber-900 tabular-nums">{formatCurrency(Number(klient.kredit_limit))}</span>
                </div>
              </Card>
            )}

            <div className="border-b border-slate-200 flex gap-1">
              <button
                onClick={() => setTab("orders")}
                className={`px-4 py-2 font-medium ${tab === "orders" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-slate-500"}`}
              >
                Sotuvlar ({items.length})
              </button>
              <button
                onClick={() => setTab("debts")}
                className={`px-4 py-2 font-medium ${tab === "debts" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-slate-500"}`}
              >
                Qarzlar
              </button>
            </div>

            {tab === "orders" && (
              <Card>
                {items.length === 0 ? (
                  <p className="p-6 text-center text-slate-500">Hozircha sotuv yo'q</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Sana</th>
                          <th className="px-4 py-3 text-right font-semibold">Jami</th>
                          <th className="px-4 py-3 text-right font-semibold">To'langan</th>
                          <th className="px-4 py-3 text-right font-semibold">Qarz</th>
                          <th className="px-4 py-3 text-left font-semibold">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-600 tabular-nums">
                              {new Date(s.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(s.jami))}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(Number(s.tolangan || 0))}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-rose-700">
                              {Number(s.qarz || 0) > 0 ? formatCurrency(Number(s.qarz)) : "—"}
                            </td>
                            <td className="px-4 py-2 text-xs">
                              <span className="px-2 py-0.5 bg-slate-100 rounded">{s.holat || "yangi"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {tab === "debts" && (
              <Card className="p-6 text-center text-slate-500">
                {(klient.qarz ?? 0) === 0 ? "✅ Qarz yo'q" : `Jami qarz: ${formatCurrency(Number(klient.qarz || 0))}`}
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent?: "emerald" | "blue" }) {
  const colors = { emerald: "text-emerald-700", blue: "text-blue-700", default: "text-slate-700" }
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase font-semibold text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className={`text-lg font-semibold ${colors[accent || "default"]} truncate`}>{value}</div>
    </Card>
  )
}
