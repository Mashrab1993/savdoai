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

const REASON: Record<string, { label: string; bg: string; text: string; accent: string }> = {
  expired: { label: "⏰ Muddati o'tdi", bg: "bg-[#FCE9DD]", text: "text-[#D97706]", accent: "#D97706" },
  damaged: { label: "🔨 Buzilgan", bg: "bg-[#F5E5D6]", text: "text-[#C75D3C]", accent: "#C75D3C" },
  stolen: { label: "🚨 O'g'irlangan", bg: "bg-[#F5E5D6]", text: "text-[#A8351F]", accent: "#A8351F" },
  broken_pack: { label: "📦 Qadoq buzilgan", bg: "bg-[#FCE9DD]", text: "text-[#D97706]", accent: "#D97706" },
  shrinkage: { label: "📉 Yo'qotish", bg: "bg-blue-50", text: "text-blue-700", accent: "#3B82F6" },
}

export default function LossAnalysisPage() {
  const totalLoss = LOSSES.reduce((s, l) => s + l.totalLoss, 0)
  const totalQty = LOSSES.reduce((s, l) => s + l.qty, 0)

  const byReason = Object.entries(REASON).map(([key, info]) => ({
    key, label: info.label, accent: info.accent,
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Yo'qotish <span className="italic text-[#C75D3C]">tahlili</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{LOSSES.length} ta voqea · jami yo'qotish <span className="font-medium text-[#C75D3C] tabular-nums">{fmt(totalLoss)} so'm</span> · 14-kunlik davr</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 14-kun</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Skull} accent="#C75D3C" label="Jami yo'qotish" value={`${fmt(totalLoss / 1000)}k`} sub="so'm" />
            <KpiCard icon={Package} accent="#D97706" label="Yo'qolgan tovar" value={fmt(totalQty)} sub="dona" />
            <KpiCard icon={AlertTriangle} accent="#3B82F6" label="Voqealar soni" value={LOSSES.length.toString()} sub="bu davrda" />
            <KpiCard icon={TrendingDown} accent="#7C3AED" label="Eng katta sabab" value={byReason[0].label.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+\s*/u, "").slice(0, 12)} sub={`${fmt(byReason[0].sum / 1000)}k so'm`} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Sabab bo'yicha yo'qotish</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {byReason.map(r => (
                <div key={r.key} className="p-4 rounded-2xl bg-white border" style={{ borderColor: `${r.accent}40` }}>
                  <div className="text-xs font-medium mb-2" style={{ color: r.accent }}>{r.label}</div>
                  <div className="text-3xl font-medium font-mono tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{r.count}</div>
                  <div className="text-xs text-[#6B5B4D] mt-1">{fmt(r.sum / 1000)}k so'm</div>
                  <div className="mt-2 h-1 bg-[#F0EAE0] rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${(r.sum / totalLoss) * 100}%`, background: r.accent }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Ombor bo'yicha taqsimot</h2>
            <div className="space-y-2">
              {byWarehouse.sort((a, b) => b.sum - a.sum).map(w => (
                <div key={w.warehouse} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-[#1A1A1A]">📦 {w.warehouse}</span>
                  <div className="flex-1 h-7 bg-[#F0EAE0] rounded-md relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-2"
                      style={{ width: `${(w.sum / totalLoss) * 100}%`, background: "linear-gradient(90deg, #C75D3C 0%, #E27B5C 100%)" }}>
                      <span className="text-xs text-white font-medium tabular-nums">{fmt(w.sum / 1000)}k</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#9C8A6E] w-16 text-right">{w.count} voqea</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Voqealar jurnali</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Birlik narx</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Yo'qotish</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sabab</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Mas'ul</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ombor</th>
                  </tr>
                </thead>
                <tbody>
                  {LOSSES.map(l => (
                    <tr key={l.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-mono text-xs text-[#6B5B4D]">{l.date}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{l.product}</div>
                        <div className="text-xs text-[#9C8A6E] font-mono">{l.sku}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{l.qty}</td>
                      <td className="py-3 px-2 text-right font-mono text-xs text-[#6B5B4D]">{fmt(l.unitCost)}</td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>−{fmt(l.totalLoss)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${REASON[l.reason].bg} ${REASON[l.reason].text}`}>{REASON[l.reason].label}</span>
                      </td>
                      <td className="py-3 px-2 text-xs text-[#6B5B4D]">{l.responsible}</td>
                      <td className="py-3 px-2 text-xs text-[#6B5B4D]">{l.warehouse}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] border-t border-[#E8E0D3]">
                    <td colSpan={4} className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Итого:</td>
                    <td className="py-3 px-2 text-right font-mono text-[#C75D3C] font-medium" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>−{fmt(totalLoss)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
