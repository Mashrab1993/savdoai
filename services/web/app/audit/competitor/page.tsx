"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, Eye, Tag, BarChart3, Camera } from "lucide-react"
import Link from "next/link"

type CompetitorRow = {
  id: number; product: string; ourSku: string;
  ourPrice: number; ourFacing: number;
  competitor: string; compPrice: number; compFacing: number;
  difference: number; recommendation: "lower" | "raise" | "match" | "ok";
}

const COMPETITORS: CompetitorRow[] = [
  { id: 1, product: "Coca-Cola 1.5L", ourSku: "CC-1500-CL", ourPrice: 18_000, ourFacing: 12, competitor: "Pepsi 1.5L", compPrice: 16_500, compFacing: 14, difference: 1500, recommendation: "lower" },
  { id: 2, product: "Choco-Boom 75g", ourSku: "CB-075-CHO", ourPrice: 12_000, ourFacing: 18, competitor: "Snickers 75g", compPrice: 14_000, compFacing: 16, difference: -2000, recommendation: "ok" },
  { id: 3, product: "Bonjur Молочный 50g", ourSku: "BJ-050-MOL", ourPrice: 6_000, ourFacing: 10, competitor: "Kit-Kat 50g", compPrice: 7_500, compFacing: 8, difference: -1500, recommendation: "raise" },
  { id: 4, product: "Sok Apelsin 1L", ourSku: "SK-1000-OR", ourPrice: 14_000, ourFacing: 8, competitor: "Don Simon 1L", compPrice: 13_500, compFacing: 12, difference: 500, recommendation: "match" },
  { id: 5, product: "Pechenye Yubileynoye", ourSku: "PEC-300-YU", ourPrice: 8_400, ourFacing: 6, competitor: "Oreo 300g", compPrice: 11_500, compFacing: 10, difference: -3100, recommendation: "ok" },
  { id: 6, product: "Voda Premium 1L", ourSku: "VOD-1L-PR", ourPrice: 4_500, ourFacing: 14, competitor: "Aqua Vita 1L", compPrice: 4_200, compFacing: 16, difference: 300, recommendation: "match" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const REC_LABEL: Record<string, string> = {
  lower: "↓ Pasaytirish",
  raise: "↑ Ko'tarish",
  match: "= Tenglashtirish",
  ok: "✓ OK",
}
const REC_COLOR: Record<string, string> = {
  lower: "bg-[#F5E5D6] text-[#C75D3C]",
  raise: "bg-emerald-50 text-emerald-700",
  match: "bg-[#FCE9DD] text-[#D97706]",
  ok: "bg-blue-50 text-blue-700",
}

export default function CompetitorAuditPage() {
  const ourTotalFacing = COMPETITORS.reduce((s, c) => s + c.ourFacing, 0)
  const compTotalFacing = COMPETITORS.reduce((s, c) => s + c.compFacing, 0)
  const ourFacingShare = Math.round((ourTotalFacing / (ourTotalFacing + compTotalFacing)) * 100)

  const lowerCount = COMPETITORS.filter(c => c.recommendation === "lower").length
  const raiseCount = COMPETITORS.filter(c => c.recommendation === "raise").length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Raqobatchilar <span className="italic text-[#C75D3C]">tahlili</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{COMPETITORS.length} ta tovar po'rsi · narx va facing taqqoslash</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Hafta</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={BarChart3} accent="#10B981" label="Bizning facing" value={ourTotalFacing.toString()} />
            <KpiCard icon={BarChart3} accent="#C75D3C" label="Raqobat facing" value={compTotalFacing.toString()} />
            <KpiCard icon={Eye} accent="#3B82F6" label="Bizning ulush" value={`${ourFacingShare}%`} />
            <KpiCard icon={Tag} accent="#D97706" label="Narx tuzatishlar" value={`↓${lowerCount} ↑${raiseCount}`} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Po'rsalar (head-to-head)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bizning tovar</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Narx</th>
                    <th className="py-2.5 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Facing</th>
                    <th className="py-2.5 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">VS</th>
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Raqobat</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Narxi</th>
                    <th className="py-2.5 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Facing</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Δ narx</th>
                    <th className="py-2.5 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tavsiya</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITORS.map(c => (
                    <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{c.product}</div>
                        <div className="text-xs text-[#9C8A6E] font-mono">{c.ourSku}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700">{fmt(c.ourPrice)}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-medium text-[#1A1A1A]">{c.ourFacing}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: c.ourFacing }).slice(0, 8).map((_, i) => (
                              <div key={i} className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-[#9C8A6E] font-medium">VS</td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{c.competitor}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]">{fmt(c.compPrice)}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-medium text-[#1A1A1A]">{c.compFacing}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: c.compFacing }).slice(0, 8).map((_, i) => (
                              <div key={i} className="w-1.5 h-3 bg-[#C75D3C] rounded-sm" />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-medium ${c.difference > 0 ? "text-[#C75D3C]" : c.difference < 0 ? "text-emerald-700" : "text-[#9C8A6E]"}`}>
                        {c.difference > 0 ? "+" : ""}{fmt(c.difference)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${REC_COLOR[c.recommendation]}`}>
                          {REC_LABEL[c.recommendation]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}><Camera className="w-5 h-5 text-[#C75D3C]" /> Foto-dalillar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {COMPETITORS.slice(0, 6).map((c, i) => (
                <div key={i} className="aspect-square rounded-2xl flex flex-col items-center justify-center text-[#9C8A6E] relative overflow-hidden group border border-[#E8E0D3]" style={{ background: "linear-gradient(135deg, #F0EAE0 0%, #FAF7F2 100%)" }}>
                  <Camera className="w-12 h-12 opacity-30" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white p-2 text-xs">
                    <div className="font-medium truncate">{c.product}</div>
                    <div className="opacity-70">vs {c.competitor}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
