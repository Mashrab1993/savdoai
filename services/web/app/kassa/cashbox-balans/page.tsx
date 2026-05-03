"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Wallet, Banknote, CreditCard, ArrowRightLeft, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type KassaStats = {
  bugun_kirim: string
  bugun_chiqim: string
  bugun_balans: string
  jami_balans: string
  naqd_balans: string
  karta_balans: string
  otkazma_balans: string
}

export default function CashboxBalansPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading, error } = useApi<KassaStats>(isAuthenticated ? "/api/v1/kassa/stats" : null)

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kassa balansi</h1>
            <p className="text-base text-slate-500 mt-1">Real-time kassa qoldig'i — naqd, karta, o'tkazma</p>
          </div>
        </div>

        {!isAuthenticated && (
          <Card className="p-6 text-center border-amber-200 bg-amber-50">
            <p className="text-amber-700">Tizimga kiring — kassa ma'lumotlari ko'rsatiladi</p>
            <Link href="/login" className="mt-3 inline-block px-4 py-2 bg-amber-600 text-white rounded">Login</Link>
          </Card>
        )}

        {loading && <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>}
        {error && <Card className="p-4 bg-rose-50 border-rose-200 text-rose-800">Xato: {error}</Card>}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BalansCard label="Naqd pul" value={formatCurrency(Number(data.naqd_balans || 0))} icon={Banknote} color="emerald" desc="Kassa ichidagi naqd" />
              <BalansCard label="Karta" value={formatCurrency(Number(data.karta_balans || 0))} icon={CreditCard} color="blue" desc="Karta orqali kelgan" />
              <BalansCard label="Bank o'tkazmasi" value={formatCurrency(Number(data.otkazma_balans || 0))} icon={ArrowRightLeft} color="purple" desc="Bank o'tkazmalari" />
            </div>

            <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">JAMI BALANS (barcha vaqt)</div>
                  <div className="text-4xl font-bold text-emerald-800 tabular-nums mt-1">{formatCurrency(Number(data.jami_balans || 0))}</div>
                </div>
                <Wallet className="w-16 h-16 text-emerald-300" />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3">Bugungi harakat</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Kirim</div>
                  <div className="text-2xl font-semibold text-emerald-700 tabular-nums">{formatCurrency(Number(data.bugun_kirim || 0))}</div>
                </div>
                <div>
                  <div className="text-slate-500">Chiqim</div>
                  <div className="text-2xl font-semibold text-rose-700 tabular-nums">{formatCurrency(Number(data.bugun_chiqim || 0))}</div>
                </div>
                <div>
                  <div className="text-slate-500">Sof balans</div>
                  <div className={`text-2xl font-semibold tabular-nums ${Number(data.bugun_balans) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatCurrency(Number(data.bugun_balans || 0))}
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

function BalansCard({ label, value, icon: Icon, color, desc }: { label: string; value: string; icon: React.ElementType; color: "emerald" | "blue" | "purple"; desc: string }) {
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50/50 text-blue-800",
    purple: "border-purple-200 bg-purple-50/50 text-purple-800",
  }
  return (
    <Card className={`p-5 border-2 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm uppercase tracking-wide font-semibold opacity-70">{label}</span>
        <Icon className="w-6 h-6 opacity-50" />
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs mt-1 opacity-60">{desc}</div>
    </Card>
  )
}
