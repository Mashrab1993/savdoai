"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingBag, Download, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type PnlData = {
  daromad?: number
  tannarx?: number
  yalpi_foyda?: number
  xarajatlar?: { kategoriya: string; summa: number }[]
  sof_foyda?: number
}

const MOCK: Required<PnlData> = {
  daromad: 412_800_000,
  tannarx: 248_400_000,
  yalpi_foyda: 164_400_000,
  xarajatlar: [
    { kategoriya: "Ish haqi", summa: 36_500_000 },
    { kategoriya: "Arenda", summa: 6_000_000 },
    { kategoriya: "Yoqilg'i", summa: 4_800_000 },
    { kategoriya: "Komunal", summa: 1_240_000 },
    { kategoriya: "Reklama", summa: 850_000 },
    { kategoriya: "Boshqa", summa: 2_400_000 },
  ],
  sof_foyda: 112_610_000,
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function FoydaPage() {
  const { isAuthenticated } = useAuth()
  const { data: api, loading } = useApi<PnlData>(isAuthenticated ? "/api/v1/hisobot/pnl" : null)
  const data = (api && api.daromad) ? { ...MOCK, ...api } : MOCK
  const usingMock = !api || !api.daromad

  const totalXarajat = data.xarajatlar.reduce((s, x) => s + x.summa, 0)
  const yalpiMarja = (data.yalpi_foyda / data.daromad * 100)
  const sofMarja = (data.sof_foyda / data.daromad * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Foyda hisoboti (P&L)</h1>
            <p className="text-base text-slate-500 mt-1">Aprel 2026 · Daromad → Tannarx → Yalpi foyda → Xarajatlar → Sof foyda</p>
          </div>
          {loading && <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">Yuklanmoqda...</span>}
          {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">● Real-time API</span>}
          {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">DAROMAD (Sotuv)</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{fmt(data.daromad)}</div>
            <div className="text-xs text-slate-600 mt-1">so'm · 100% baza</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <DollarSign className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">YALPI FOYDA</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{fmt(data.yalpi_foyda)}</div>
            <div className="text-xs text-blue-700 mt-1 font-semibold">Marja: {yalpiMarja.toFixed(1)}%</div>
          </Card>
          <Card className={`p-5 border-2 ${data.sof_foyda > 0 ? "bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300" : "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300"}`}>
            {data.sof_foyda > 0 ? <TrendingUp className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" /> : <TrendingDown className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />}
            <div className={`text-xs font-bold ${data.sof_foyda > 0 ? "text-violet-700" : "text-rose-700"}`}>SOF FOYDA</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{fmt(data.sof_foyda)}</div>
            <div className={`text-xs mt-1 font-semibold ${data.sof_foyda > 0 ? "text-violet-700" : "text-rose-700"}`}>Marja: {sofMarja.toFixed(1)}%</div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-6">Foyda va Zarar (P&L) Hisoboti</h2>

          <div className="space-y-1">
            <PnlRow label="DAROMAD (Net Revenue)" value={data.daromad} bold positive />
            <PnlRow label="(−) Tannarx (COGS)" value={-data.tannarx} indent={1} negative />
            <div className="my-2 h-px bg-slate-200" />
            <PnlRow label="YALPI FOYDA (Gross Profit)" value={data.yalpi_foyda} bold positive />
            <div className="text-xs text-slate-500 italic ml-6 mb-3">Marja: {yalpiMarja.toFixed(1)}%</div>

            <div className="text-sm font-bold text-rose-700 uppercase pt-3 pb-1">(−) OPERATSIYA XARAJATLARI</div>
            {data.xarajatlar.map(x => (
              <PnlRow key={x.kategoriya} label={x.kategoriya} value={-x.summa} indent={1} negative />
            ))}
            <PnlRow label="Jami xarajatlar" value={-totalXarajat} bold negative />

            <div className="my-2 h-1 bg-slate-300" />
            <PnlRow label="SOF FOYDA (Net Profit)" value={data.sof_foyda} bold positive={data.sof_foyda > 0} negative={data.sof_foyda < 0} hl />
            <div className={`text-xs italic ml-6 ${data.sof_foyda > 0 ? "text-emerald-700" : "text-rose-700"} font-semibold`}>
              Sof marja: {sofMarja.toFixed(1)}% · {data.sof_foyda > 0 ? "Pozitiv natija ✓" : "Zarar ✗"}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-base font-bold mb-3">Xarajat tarkibi</h3>
            <div className="space-y-2">
              {data.xarajatlar.map(x => {
                const pct = (x.summa / totalXarajat * 100)
                return (
                  <div key={x.kategoriya}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{x.kategoriya}</span>
                      <span className="font-mono font-bold">{fmt(x.summa)} <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-bold mb-3">Foyda dekompozitsiyasi</h3>
            <div className="space-y-3">
              <FoydaBar label="Daromad" value={data.daromad} max={data.daromad} color="bg-emerald-500" />
              <FoydaBar label="Tannarx" value={data.tannarx} max={data.daromad} color="bg-rose-400" />
              <FoydaBar label="Yalpi foyda" value={data.yalpi_foyda} max={data.daromad} color="bg-blue-500" />
              <FoydaBar label="Operatsiya xarajat" value={totalXarajat} max={data.daromad} color="bg-orange-500" />
              <FoydaBar label="SOF FOYDA" value={data.sof_foyda} max={data.daromad} color="bg-violet-600" highlight />
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function PnlRow({ label, value, indent = 0, bold, positive, negative, hl }: { label: string; value: number; indent?: number; bold?: boolean; positive?: boolean; negative?: boolean; hl?: boolean }) {
  const color = positive ? "text-emerald-700" : negative ? "text-rose-700" : "text-slate-700"
  return (
    <div className={`flex items-center justify-between py-1 px-2 ${hl ? "bg-emerald-50 rounded" : ""}`}>
      <span className={`${bold ? "font-bold" : ""} ${color}`} style={{ paddingLeft: `${indent * 24}px` }}>{label}</span>
      <span className={`font-mono ${bold ? "text-lg font-bold" : "text-sm"} ${color}`}>{value < 0 ? "−" : ""}{fmt(Math.abs(value))}</span>
    </div>
  )
}

function FoydaBar({ label, value, max, color, highlight }: { label: string; value: number; max: number; color: string; highlight?: boolean }) {
  const pct = (Math.abs(value) / max * 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`${highlight ? "font-bold" : "font-medium"}`}>{label}</span>
        <span className={`font-mono font-bold ${highlight ? "text-violet-700 text-base" : ""}`}>{fmt(value)}</span>
      </div>
      <div className={`h-2 bg-slate-100 rounded-full overflow-hidden ${highlight ? "h-3 ring-2 ring-violet-200" : ""}`}>
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
