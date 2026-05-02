"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

type Item = { sku: string; product: string; qty: number; revenue: number }

const ITEMS: Item[] = [
  { sku: "CB-075-CHO", product: "Choco-Boom 75g", qty: 4820, revenue: 57_840_000 },
  { sku: "CC-1500-CL", product: "Coca-Cola 1.5L", qty: 2840, revenue: 51_120_000 },
  { sku: "BJ-050-MOL", product: "Bonjur Молочный 50g", qty: 6200, revenue: 37_200_000 },
  { sku: "SK-1000-OR", product: "Sok Apelsin 1L", qty: 1840, revenue: 25_760_000 },
  { sku: "PEC-300-YU", product: "Pechenye Yubileynoye", qty: 2160, revenue: 18_144_000 },
  { sku: "VOD-1L-PR", product: "Voda Premium 1L", qty: 3200, revenue: 14_400_000 },
  { sku: "CHA-008-DI", product: "Chay Dilmah", qty: 980, revenue: 11_760_000 },
  { sku: "BIS-150-TR", product: "Biskvit Triton", qty: 1240, revenue: 6_820_000 },
  { sku: "MIL-200-DE", product: "Milky Way 200g", qty: 720, revenue: 5_184_000 },
  { sku: "CRA-150-OL", product: "Crackers Olive", qty: 540, revenue: 3_240_000 },
  { sku: "JEL-100-FR", product: "Jelly Fruit Mix", qty: 480, revenue: 2_400_000 },
  { sku: "NUT-200-AL", product: "Nuts Almond", qty: 240, revenue: 1_920_000 },
  { sku: "DUM-001-KE", product: "Dumlama Stick", qty: 380, revenue: 1_140_000 },
  { sku: "CON-050-MI", product: "Confetti Mini", qty: 280, revenue: 840_000 },
  { sku: "CAR-100-DR", product: "Caramel Drops", qty: 180, revenue: 540_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const ABC_ACCENT = { A: "#10B981", B: "#D97706", C: "#9C8A6E" }
const ABC_BG = { A: "bg-emerald-500", B: "bg-[#D97706]", C: "bg-[#9C8A6E]" }

export default function AbcAnalysisPage() {
  const sorted = [...ITEMS].sort((a, b) => b.revenue - a.revenue)
  const totalRevenue = sorted.reduce((s, i) => s + i.revenue, 0)

  let cumulative = 0
  const enriched = sorted.map((item, i) => {
    cumulative += item.revenue
    const cumPct = (cumulative / totalRevenue) * 100
    let abc: "A" | "B" | "C"
    if (cumPct <= 80) abc = "A"
    else if (cumPct <= 95) abc = "B"
    else abc = "C"
    return { ...item, rank: i + 1, cumPct: Math.round(cumPct * 10) / 10, sharePct: Math.round((item.revenue / totalRevenue) * 1000) / 10, abc }
  })

  const aClass = enriched.filter(e => e.abc === "A")
  const bClass = enriched.filter(e => e.abc === "B")
  const cClass = enriched.filter(e => e.abc === "C")

  const aShare = Math.round((aClass.reduce((s, e) => s + e.revenue, 0) / totalRevenue) * 100)
  const bShare = Math.round((bClass.reduce((s, e) => s + e.revenue, 0) / totalRevenue) * 100)
  const cShare = Math.round((cClass.reduce((s, e) => s + e.revenue, 0) / totalRevenue) * 100)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                ABC <span className="italic text-[#C75D3C]">tahlili (Pareto)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{ITEMS.length} ta SKU · 80/15/5 qoidasiga ko'ra klassifikatsiya</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 1-oy</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ClassCard letter="A" label="VIP — Yulduz tovarlar" count={aClass.length} share={aShare} totalCount={ITEMS.length} accent={ABC_ACCENT.A} hint="💡 Asosiy diqqat. Doim mavjud bo'lsin, premium polkada, marketing prioritet." />
            <ClassCard letter="B" label="O'rta sotiluvchilar" count={bClass.length} share={bShare} totalCount={ITEMS.length} accent={ABC_ACCENT.B} hint="💡 Kuzatish davom etsin, A ga ko'tarish strategiyalari." />
            <ClassCard letter="C" label="Past sotiluvchilar" count={cClass.length} share={cShare} totalCount={ITEMS.length} accent={ABC_ACCENT.C} hint="💡 Tahlil qiling — kerakmi? Aralashga, yo'naltirishga, yoki olib tashlashga." />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <TrendingUp className="w-5 h-5 text-[#C75D3C]" /> Pareto egri chizig'i
            </h2>
            <div className="relative h-64">
              <div className="absolute inset-0 flex items-end gap-1">
                {enriched.map(e => {
                  const heightPct = (e.revenue / sorted[0].revenue) * 100
                  return (
                    <div
                      key={e.sku}
                      className={`flex-1 transition-all hover:opacity-80 ${ABC_BG[e.abc]}`}
                      style={{ height: `${heightPct}%` }}
                      title={`${e.product}: ${fmt(e.revenue)}`}
                    />
                  )
                })}
              </div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${enriched.length} 100`} preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#C75D3C"
                  strokeWidth="0.4"
                  points={enriched.map((e, i) => `${i + 0.5},${100 - e.cumPct}`).join(" ")}
                />
              </svg>
              <div className="absolute right-0 top-0 text-xs">
                <div className="flex items-center gap-1 text-[#C75D3C] font-medium">
                  <span className="w-3 h-0.5 bg-[#C75D3C] inline-block" /> Cumulative %
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#9C8A6E] text-center">
              Bar = SKU tushum · Chiziq = Cumulative % (Pareto curve)
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>SKU tasnifi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Rank</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ulush %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Cum %</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sinf</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(e => (
                    <tr key={e.sku} className={`border-b border-[#F0EAE0] hover:bg-[#FAF7F2] ${e.abc === "A" ? "bg-emerald-50/40" : e.abc === "B" ? "bg-[#FCE9DD]/30" : ""}`}>
                      <td className="py-2 px-2 font-medium text-[#9C8A6E]">{e.rank}</td>
                      <td className="py-2 px-2 font-mono text-xs text-[#1A1A1A]">{e.sku}</td>
                      <td className="py-2 px-2 font-medium text-[#1A1A1A]">{e.product}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#6B5B4D]">{fmt(e.qty)}</td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(e.revenue)}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#1A1A1A]">{e.sharePct}%</td>
                      <td className="py-2 px-2 text-right font-mono text-[#6B5B4D]">{e.cumPct}%</td>
                      <td className="py-2 px-2 text-center">
                        <span className="inline-flex w-7 h-7 rounded font-medium text-base items-center justify-center text-white" style={{ background: ABC_ACCENT[e.abc], fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {e.abc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[#C75D3C]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C]">PARETO QOIDASI (80/20)</div>
                <p className="text-sm text-[#1A1A1A] mt-1">
                  Sizning ushbu davrdagi natijangiz: <span className="font-medium">{aClass.length} ta SKU</span> ({Math.round((aClass.length / ITEMS.length) * 100)}%)
                  {" "}tushumning <span className="font-medium">{aShare}%</span>ini olib kelmoqda.
                  {aShare >= 75 ? " Pareto qoidasiga mos keladi — A-sinf prioritet." : " A-sinfga e'tibor qaratish kerak."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function ClassCard({ letter, label, count, share, totalCount, accent, hint }: { letter: string; label: string; count: number; share: number; totalCount: number; accent: string; hint: string }) {
  return (
    <Card className="p-5 bg-white border-2 shadow-sm rounded-2xl relative overflow-hidden" style={{ borderColor: `${accent}55` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-4xl font-medium" style={{ color: accent, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{letter}</span>
        <span className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label.split(" — ")[0]}</span>
      </div>
      <div className="text-base font-medium text-[#1A1A1A] mb-1">{label.split(" — ")[1] || label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums" style={{ color: accent, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{count} SKU</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{share}% tushum · {Math.round((count / totalCount) * 100)}% tovardan</div>
      <div className="mt-3 text-xs text-[#6B5B4D]">{hint}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
