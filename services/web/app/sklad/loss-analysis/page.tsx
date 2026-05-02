"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, Calendar, Download, Package, TrendingDown, Bug, Skull } from "lucide-react"
import Link from "next/link"

type LossRow = {
  id: number; date: string; sku: string; product: string;
  qty: number; unitCost: number; totalLoss: number;
  reason: "expired" | "damaged" | "stolen" | "broken_pack" | "shrinkage";
  responsible: string; warehouse: string;
}

const LOSSES: LossRow[] = [
  { id: 1, date: "2026-05-02", sku: "BJ-050-MOL", product: "Bonjur 50g", qty: 24, unitCost: 4_500, totalLoss: 108_000, reason: "expired", responsible: "Ombor", warehouse: "Yashnobod" },
  { id: 2, date: "2026-05-01", sku: "CC-1500-CL", product: "Coca-Cola 1.5L", qty: 6, unitCost: 14_000, totalLoss: 84_000, reason: "damaged", responsible: "Yetkazib beruvchi", warehouse: "Sergeli" },
  { id: 3, date: "2026-04-30", sku: "PEC-300-YU", product: "Pechenye Yubileynoye", qty: 12, unitCost: 6_500, totalLoss: 78_000, reason: "expired", responsible: "Ombor", warehouse: "Yashnobod" },
  { id: 4, date: "2026-04-28", sku: "VOD-1L-PR", product: "Voda Premium 1L", qty: 18, unitCost: 3_500, totalLoss: 63_000, reason: "broken_pack", responsible: "Ombor", warehouse: "Bektemir" },
  { id: 5, date: "2026-04-27", sku: "CHA-008-DI", product: "Chay Dilmah", qty: 4, unitCost: 12_000, totalLoss: 48_000, reason: "stolen", responsible: "?", warehouse: "Yashnobod" },
  { id: 6, date: "2026-04-25", sku: "SK-1000-OR", product: "Sok Apelsin 1L", qty: 8, unitCost: 11_000, totalLoss: 88_000, reason: "expired", responsible: "Ombor", warehouse: "Sergeli" },
  { id: 7, date: "2026-04-22", sku: "BIS-150-TR", product: "Biskvit Triton", qty: 6, unitCost: 5_500, totalLoss: 33_000, reason: "shrinkage", responsible: "Inventarizatsiya", warehouse: "Yashnobod" },
  { id: 8, date: "2026-04-20", sku: "CB-075-CHO", product: "Choco-Boom 75g", qty: 14, unitCost: 9_000, totalLoss: 126_000, reason: "damaged", responsible: "Ekspeditor", warehouse: "Bektemir" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const REASON: Record<string, { label: string; color: string; icon: any }> = {
  expired: { label: "⏰ Muddati o'tdi", color: "bg-amber-100 text-amber-700", icon: Calendar },
  damaged: { label: "🔨 Buzilgan", color: "bg-rose-100 text-rose-700", icon: Bug },
  stolen: { label: "🚨 O'g'irlangan", color: "bg-rose-200 text-rose-800", icon: Skull },
  broken_pack: { label: "📦 Qadoq buzilgan", color: "bg-orange-100 text-orange-700", icon: Package },
  shrinkage: { label: "📉 Yo'qotish (shrinkage)", color: "bg-blue-100 text-blue-700", icon: TrendingDown },
}

export default function LossAnalysisPage() {
  const totalLoss = LOSSES.reduce((s, l) => s + l.totalLoss, 0)
  const totalQty = LOSSES.reduce((s, l) => s + l.qty, 0)

  const byReason = Object.entries(REASON).map(([key, info]) => ({
    key, label: info.label, color: info.color,
    count: LOSSES.filter(l => l.reason === key).length,
    sum: LOSSES.filter(l => l.reason === key).reduce((s, l) => s + l.totalLoss, 0),
  })).sort((a, b) => b.sum - a.sum)

  const byWarehouse = Array.from(new Set(LOSSES.map(l => l.warehouse))).map(w => ({
    warehouse: w,
    sum: LOSSES.filter(l => l.warehouse === w).reduce((s, l) => s + l.totalLoss, 0),
    count: LOSSES.filter(l => l.warehouse === w).length,
  }))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Yo'qotish tahlili (loss analysis)</h1>
            <p className="text-sm text-slate-500">{LOSSES.length} ta voqea · jami yo'qotish {fmt(totalLoss)} so'm · 14-kunlik davr</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 14-kun</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-rose-50 border-rose-200">
            <Skull className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Jami yo'qotish</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalLoss / 1000)}k</div>
            <div className="text-xs text-slate-500 mt-1">so'm</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Package className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Yo'qolgan tovar</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalQty)}</div>
            <div className="text-xs text-slate-500 mt-1">dona</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <AlertTriangle className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Voqealar soni</div>
            <div className="text-2xl font-bold mt-1">{LOSSES.length}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <TrendingDown className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Eng katta sabab</div>
            <div className="text-base font-bold mt-1">{byReason[0].label.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+\s*/u, "").slice(0, 12)}</div>
            <div className="text-xs text-slate-500">{fmt(byReason[0].sum / 1000)}k so'm</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Sabab bo'yicha yo'qotish</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {byReason.map(r => (
              <div key={r.key} className={`p-4 rounded-lg ${r.color}`}>
                <div className="text-xs font-bold mb-2">{r.label}</div>
                <div className="text-2xl font-bold font-mono">{r.count}</div>
                <div className="text-xs mt-1">{fmt(r.sum / 1000)}k so'm</div>
                <div className="mt-2 h-1 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-current opacity-50" style={{ width: `${(r.sum / totalLoss) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Ombor bo'yicha taqsimot</h2>
          <div className="space-y-2">
            {byWarehouse.sort((a, b) => b.sum - a.sum).map(w => (
              <div key={w.warehouse} className="flex items-center gap-3">
                <span className="w-32 text-sm font-semibold">📦 {w.warehouse}</span>
                <div className="flex-1 h-7 bg-slate-100 rounded relative">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-400 to-rose-600 rounded flex items-center justify-end pr-2"
                    style={{ width: `${(w.sum / totalLoss) * 100}%` }}>
                    <span className="text-xs text-white font-bold">{fmt(w.sum / 1000)}k</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 w-16 text-right">{w.count} voqea</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Voqealar jurnali</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 text-left">Sana</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Miqdor</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Birlik narx</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Yo'qotish</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Sabab</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Mas'ul</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Ombor</th>
                </tr>
              </thead>
              <tbody>
                {LOSSES.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 font-mono text-xs">{l.date}</td>
                    <td className="border border-slate-300 py-2 px-2">
                      <div className="font-semibold">{l.product}</div>
                      <div className="text-xs text-slate-500 font-mono">{l.sku}</div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{l.qty}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-xs">{fmt(l.unitCost)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-rose-700">−{fmt(l.totalLoss)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${REASON[l.reason].color}`}>{REASON[l.reason].label}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-xs">{l.responsible}</td>
                    <td className="border border-slate-300 py-2 px-2 text-xs">{l.warehouse}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={4} className="border border-slate-300 py-2 px-2 text-right">Итого:</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">−{fmt(totalLoss)}</td>
                  <td colSpan={3} className="border border-slate-300"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
