"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Download, AlertCircle } from "lucide-react"
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Foyda <span className="italic text-[#C75D3C]">hisoboti (P&L)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Aprel 2026 · Daromad → Tannarx → Yalpi → Xarajatlar → Sof foyda</p>
            </div>
            {loading && <span className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm animate-pulse">Yuklanmoqda...</span>}
            {!loading && !usingMock && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real-time API</span>}
            {!loading && usingMock && <span className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Demo</span>}
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BigCard icon={ShoppingBag} accent="#10B981" label="DAROMAD (Sotuv)" value={fmt(data.daromad)} sub="so'm · 100% baza" />
            <BigCard icon={DollarSign} accent="#3B82F6" label="YALPI FOYDA" value={fmt(data.yalpi_foyda)} sub={`Marja: ${yalpiMarja.toFixed(1)}%`} />
            <BigCard icon={data.sof_foyda > 0 ? TrendingUp : TrendingDown} accent={data.sof_foyda > 0 ? "#C75D3C" : "#C75D3C"} label="SOF FOYDA" value={fmt(data.sof_foyda)} sub={`Marja: ${sofMarja.toFixed(1)}%`} />
          </div>

          <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-6 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Foyda va Zarar (P&L) Hisoboti</h2>

            <div className="space-y-1">
              <PnlRow label="DAROMAD (Net Revenue)" value={data.daromad} bold positive />
              <PnlRow label="(−) Tannarx (COGS)" value={-data.tannarx} indent={1} negative />
              <div className="my-2 h-px bg-[#E8E0D3]" />
              <PnlRow label="YALPI FOYDA (Gross Profit)" value={data.yalpi_foyda} bold positive />
              <div className="text-xs text-[#9C8A6E] italic ml-6 mb-3">Marja: {yalpiMarja.toFixed(1)}%</div>

              <div className="text-xs font-medium text-[#C75D3C] uppercase tracking-[0.15em] pt-3 pb-1">(−) OPERATSIYA XARAJATLARI</div>
              {data.xarajatlar.map(x => (
                <PnlRow key={x.kategoriya} label={x.kategoriya} value={-x.summa} indent={1} negative />
              ))}
              <PnlRow label="Jami xarajatlar" value={-totalXarajat} bold negative />

              <div className="my-2 h-1 bg-[#E8E0D3]" />
              <PnlRow label="SOF FOYDA (Net Profit)" value={data.sof_foyda} bold positive={data.sof_foyda > 0} negative={data.sof_foyda < 0} hl />
              <div className={`text-xs italic ml-6 ${data.sof_foyda > 0 ? "text-emerald-700" : "text-[#C75D3C]"} font-medium`}>
                Sof marja: {sofMarja.toFixed(1)}% · {data.sof_foyda > 0 ? "Pozitiv natija ✓" : "Zarar ✗"}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h3 className="text-lg font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Xarajat tarkibi</h3>
              <div className="space-y-3">
                {data.xarajatlar.map(x => {
                  const pct = (x.summa / totalXarajat * 100)
                  return (
                    <div key={x.kategoriya}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#1A1A1A]">{x.kategoriya}</span>
                        <span className="font-mono font-medium text-[#1A1A1A]">{fmt(x.summa)} <span className="text-[#9C8A6E] font-normal">({pct.toFixed(1)}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-[#F0EAE0] rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #C75D3C 0%, #E27B5C 100%)" }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h3 className="text-lg font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Foyda dekompozitsiyasi</h3>
              <div className="space-y-3">
                <FoydaBar label="Daromad" value={data.daromad} max={data.daromad} color="#10B981" />
                <FoydaBar label="Tannarx" value={data.tannarx} max={data.daromad} color="#C75D3C" />
                <FoydaBar label="Yalpi foyda" value={data.yalpi_foyda} max={data.daromad} color="#3B82F6" />
                <FoydaBar label="Operatsiya xarajat" value={totalXarajat} max={data.daromad} color="#D97706" />
                <FoydaBar label="SOF FOYDA" value={data.sof_foyda} max={data.daromad} color="#7C3AED" highlight />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function BigCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-7 h-7 mb-3" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}

function PnlRow({ label, value, indent = 0, bold, positive, negative, hl }: { label: string; value: number; indent?: number; bold?: boolean; positive?: boolean; negative?: boolean; hl?: boolean }) {
  const color = positive ? "text-emerald-700" : negative ? "text-[#C75D3C]" : "text-[#1A1A1A]"
  return (
    <div className={`flex items-center justify-between py-1.5 px-2 ${hl ? "bg-[#FCE9DD]/40 rounded-lg" : ""}`}>
      <span className={`${bold ? "font-medium" : ""} ${color}`} style={{ paddingLeft: `${indent * 24}px`, fontFamily: bold ? 'ui-serif, Georgia, "Times New Roman", serif' : undefined }}>{label}</span>
      <span className={`font-mono ${bold ? "text-lg font-medium" : "text-sm"} ${color}`} style={bold ? { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } : {}}>{value < 0 ? "−" : ""}{fmt(Math.abs(value))}</span>
    </div>
  )
}

function FoydaBar({ label, value, max, color, highlight }: { label: string; value: number; max: number; color: string; highlight?: boolean }) {
  const pct = (Math.abs(value) / max * 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`${highlight ? "font-medium" : ""} text-[#1A1A1A]`}>{label}</span>
        <span className="font-mono font-medium text-[#1A1A1A]" style={highlight ? { color, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif', fontSize: '1rem' } : {}}>{fmt(value)}</span>
      </div>
      <div className={`bg-[#F0EAE0] rounded-full overflow-hidden ${highlight ? "h-3 ring-2 ring-[#7C3AED]/20" : "h-2"}`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
