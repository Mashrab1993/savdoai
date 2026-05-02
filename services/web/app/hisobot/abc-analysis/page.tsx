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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">ABC tahlili (Pareto)</h1>
            <p className="text-sm text-slate-500">{ITEMS.length} ta SKU · 80/15/5 qoidasiga ko'ra klassifikatsiya</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 1-oy</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-emerald-50 border-emerald-300 border-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-emerald-700">A</span>
              <span className="text-xs font-bold text-emerald-700">VIP</span>
            </div>
            <div className="text-base font-bold mb-1">Yulduz tovarlar</div>
            <div className="text-2xl font-bold font-mono text-emerald-700">{aClass.length} SKU</div>
            <div className="text-xs text-slate-600 mt-1">{aShare}% tushum · {Math.round((aClass.length / ITEMS.length) * 100)}% tovardan</div>
            <div className="mt-3 text-xs text-slate-700">
              💡 Asosiy diqqat. Doim mavjud bo'lsin, premium polkada, marketing prioritet.
            </div>
          </Card>
          <Card className="p-5 bg-amber-50 border-amber-300 border-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-amber-700">B</span>
              <span className="text-xs font-bold text-amber-700">O'RTA</span>
            </div>
            <div className="text-base font-bold mb-1">O'rta sotiluvchilar</div>
            <div className="text-2xl font-bold font-mono text-amber-700">{bClass.length} SKU</div>
            <div className="text-xs text-slate-600 mt-1">{bShare}% tushum · {Math.round((bClass.length / ITEMS.length) * 100)}% tovardan</div>
            <div className="mt-3 text-xs text-slate-700">
              💡 Kuzatish davom etsin, A ga ko'tarish strategiyalari.
            </div>
          </Card>
          <Card className="p-5 bg-slate-100 border-slate-300 border-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-slate-700">C</span>
              <span className="text-xs font-bold text-slate-700">PAST</span>
            </div>
            <div className="text-base font-bold mb-1">Past sotiluvchilar</div>
            <div className="text-2xl font-bold font-mono text-slate-700">{cClass.length} SKU</div>
            <div className="text-xs text-slate-600 mt-1">{cShare}% tushum · {Math.round((cClass.length / ITEMS.length) * 100)}% tovardan</div>
            <div className="mt-3 text-xs text-slate-700">
              💡 Tahlil qiling — kerakmi? Aralashga, yo'naltirishga, yoki olib tashlashga.
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Pareto egri chizig'i
          </h2>
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end gap-1">
              {enriched.map((e, i) => {
                const heightPct = (e.revenue / sorted[0].revenue) * 100
                return (
                  <div
                    key={e.sku}
                    className={`flex-1 transition-all hover:opacity-80 ${
                      e.abc === "A" ? "bg-emerald-500" : e.abc === "B" ? "bg-amber-500" : "bg-slate-400"
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${e.product}: ${fmt(e.revenue)}`}
                  />
                )
              })}
            </div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${enriched.length} 100`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgb(225 29 72)"
                strokeWidth="0.4"
                points={enriched.map((e, i) => `${i + 0.5},${100 - e.cumPct}`).join(" ")}
              />
            </svg>
            <div className="absolute right-0 top-0 text-xs">
              <div className="flex items-center gap-1 text-rose-600 font-bold">
                <span className="w-3 h-0.5 bg-rose-600 inline-block" /> Cumulative %
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">
            Bar = SKU tushum · Chiziq = Cumulative % (Pareto curve)
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">SKU tasnifi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Rank</th>
                  <th className="py-3 px-2">SKU</th>
                  <th className="py-3 px-2">Tovar</th>
                  <th className="py-3 px-2 text-right">Miqdor</th>
                  <th className="py-3 px-2 text-right">Tushum</th>
                  <th className="py-3 px-2 text-right">Ulush %</th>
                  <th className="py-3 px-2 text-right">Cumulative %</th>
                  <th className="py-3 px-2 text-center">Sinf</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(e => (
                  <tr key={e.sku} className={`border-b border-slate-100 hover:bg-slate-50 ${e.abc === "A" ? "bg-emerald-50/30" : e.abc === "B" ? "bg-amber-50/30" : ""}`}>
                    <td className="py-2 px-2 font-bold text-slate-400">{e.rank}</td>
                    <td className="py-2 px-2 font-mono text-xs">{e.sku}</td>
                    <td className="py-2 px-2 font-semibold">{e.product}</td>
                    <td className="py-2 px-2 text-right font-mono">{fmt(e.qty)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(e.revenue)}</td>
                    <td className="py-2 px-2 text-right font-mono">{e.sharePct}%</td>
                    <td className="py-2 px-2 text-right font-mono">{e.cumPct}%</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block w-7 h-7 rounded font-bold text-base flex items-center justify-center text-white ${
                        e.abc === "A" ? "bg-emerald-500" : e.abc === "B" ? "bg-amber-500" : "bg-slate-400"
                      }`} style={{ display: "inline-flex" }}>
                        {e.abc}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800">📊 Pareto qoidasi (80/20)</h3>
              <p className="text-sm text-slate-700 mt-1">
                Sizning ushbu davrdagi natijangiz: <span className="font-bold">{aClass.length} ta SKU</span> ({Math.round((aClass.length / ITEMS.length) * 100)}%)
                {" "}tushumning <span className="font-bold">{aShare}%</span>ini olib kelmoqda.
                {aShare >= 75 ? " Pareto qoidasiga mos keladi — A-sinf prioritet." : " A-sinfga e'tibor qaratish kerak."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
