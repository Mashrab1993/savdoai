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
  lower: "bg-rose-100 text-rose-700",
  raise: "bg-emerald-100 text-emerald-700",
  match: "bg-amber-100 text-amber-700",
  ok: "bg-blue-100 text-blue-700",
}

export default function CompetitorAuditPage() {
  const ourTotalFacing = COMPETITORS.reduce((s, c) => s + c.ourFacing, 0)
  const compTotalFacing = COMPETITORS.reduce((s, c) => s + c.compFacing, 0)
  const ourFacingShare = Math.round((ourTotalFacing / (ourTotalFacing + compTotalFacing)) * 100)

  const lowerCount = COMPETITORS.filter(c => c.recommendation === "lower").length
  const raiseCount = COMPETITORS.filter(c => c.recommendation === "raise").length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Raqobatchilar tahlili</h1>
            <p className="text-sm text-slate-500">{COMPETITORS.length} ta tovar po'rsi · narx va facing taqqoslash</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Hafta</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <BarChart3 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Bizning facing</div>
            <div className="text-2xl font-bold mt-1">{ourTotalFacing}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <BarChart3 className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Raqobat facing</div>
            <div className="text-2xl font-bold mt-1">{compTotalFacing}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Eye className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Bizning ulush</div>
            <div className="text-2xl font-bold mt-1">{ourFacingShare}%</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Tag className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Narx tuzatishlar</div>
            <div className="text-2xl font-bold mt-1">↓{lowerCount} ↑{raiseCount}</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Po'rsalar (head-to-head taqqoslash)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 text-left">Bizning tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Bizning narx</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Bizning facing</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">VS</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Raqobat tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Raqobat narxi</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Raqobat facing</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Δ narx</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Tavsiya</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-3 px-2">
                      <div className="font-semibold">{c.product}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.ourSku}</div>
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(c.ourPrice)}</td>
                    <td className="border border-slate-300 py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono font-bold">{c.ourFacing}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: c.ourFacing }).slice(0, 8).map((_, i) => (
                            <div key={i} className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-center text-slate-400 font-bold">VS</td>
                    <td className="border border-slate-300 py-3 px-2">
                      <div className="font-semibold">{c.competitor}</div>
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-right font-mono font-bold text-rose-700">{fmt(c.compPrice)}</td>
                    <td className="border border-slate-300 py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono font-bold">{c.compFacing}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: c.compFacing }).slice(0, 8).map((_, i) => (
                            <div key={i} className="w-1.5 h-3 bg-rose-500 rounded-sm" />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className={`border border-slate-300 py-3 px-2 text-right font-mono font-bold ${c.difference > 0 ? "text-rose-700" : c.difference < 0 ? "text-emerald-700" : "text-slate-500"}`}>
                      {c.difference > 0 ? "+" : ""}{fmt(c.difference)}
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${REC_COLOR[c.recommendation]}`}>
                        {REC_LABEL[c.recommendation]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-blue-600" /> Foto-dalillar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {COMPETITORS.slice(0, 6).map((c, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group">
                <Camera className="w-12 h-12 opacity-30" />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white p-2 text-xs">
                  <div className="font-semibold truncate">{c.product}</div>
                  <div className="opacity-70">vs {c.competitor}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
