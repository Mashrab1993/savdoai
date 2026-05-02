"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, ShoppingBag, Wallet, FileText, AlertTriangle, Phone } from "lucide-react"
import Link from "next/link"

const DEBT_DETAILS = [
  { id: 1024, type: "order", date: "2026-05-02", days: 0, sum: 1_240_000, paid: 800_000, debt: 440_000, due: "2026-05-12", desc: "Zakaz #1024" },
  { id: 1018, type: "order", date: "2026-04-28", days: 4, sum: 2_840_000, paid: 1_800_000, debt: 1_040_000, due: "2026-05-08", desc: "Zakaz #1018" },
  { id: 1012, type: "order", date: "2026-04-25", days: 7, sum: 1_580_000, paid: 800_000, debt: 780_000, due: "2026-05-05", desc: "Zakaz #1012" },
  { id: 982, type: "order", date: "2026-04-08", days: 24, sum: 5_240_000, paid: 4_500_000, debt: 740_000, due: "2026-04-18", desc: "Zakaz #982 (kechikkan)" },
  { id: 932, type: "order", date: "2026-03-15", days: 48, sum: 2_400_000, paid: 0, debt: 2_400_000, due: "2026-03-25", desc: "Zakaz #932 (juda kechikkan)" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function severityFor(days: number) {
  if (days >= 30) return { color: "rose", label: "KRITIK", text: "text-rose-700", bg: "bg-rose-100" }
  if (days >= 15) return { color: "orange", label: "Kechikkan", text: "text-orange-700", bg: "bg-orange-100" }
  if (days >= 7) return { color: "amber", label: "Diqqat", text: "text-amber-700", bg: "bg-amber-100" }
  return { color: "emerald", label: "Vaqtida", text: "text-emerald-700", bg: "bg-emerald-100" }
}

export default function ClientDolgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const totalDebt = DEBT_DETAILS.reduce((s, d) => s + d.debt, 0)
  const overdueDebt = DEBT_DETAILS.filter(d => d.days > 0).reduce((s, d) => s + d.debt, 0)
  const criticalDebt = DEBT_DETAILS.filter(d => d.days >= 30).reduce((s, d) => s + d.debt, 0)
  const oldestDebt = Math.max(...DEBT_DETAILS.map(d => d.days))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Klient qarzlari · #{id}</h1>
            <p className="text-base text-slate-500 mt-1">Salom Magazin №1 · Jami qarz: <span className="font-bold text-rose-700">{fmt(totalDebt)} so'm</span></p>
          </div>
          <Link href={`/klientlar/${id}/oplata`}>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Wallet className="w-4 h-4" /> To'lov qabul qilish</Button>
          </Link>
        </div>

        {criticalDebt > 0 && (
          <Card className="p-5 border-2 border-rose-300 bg-gradient-to-r from-rose-50 to-rose-100/50">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-12 h-12 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-rose-900">⚠ KRITIK QARZ MAVJUD</h2>
                <p className="text-sm text-rose-800 mt-1">
                  30+ kun kechikkan qarz: <span className="font-bold">{fmt(criticalDebt)} so'm</span>.
                  Eng eski qarz <span className="font-bold">{oldestDebt} kun</span> oldin.
                </p>
                <p className="text-sm text-rose-700 mt-2">Klient bilan bog'laning va to'lov muddatini kelishing.</p>
              </div>
              <Button variant="outline" className="gap-2 border-rose-300 text-rose-700"><Phone className="w-4 h-4" /> Qo'ng'iroq</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300 border-2">
            <AlertCircle className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-rose-700">Jami qarz</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalDebt)}</div>
            <div className="text-xs text-slate-600 mt-1">so'm · {DEBT_DETAILS.length} ta operatsiya</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-300 border-2">
            <TrendingDown className="w-7 h-7 text-orange-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-orange-700">Kechikkan</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(overdueDebt)}</div>
            <div className="text-xs text-slate-600 mt-1">{(overdueDebt / totalDebt * 100).toFixed(1)}% jamidan</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 border-2">
            <FileText className="w-7 h-7 text-amber-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-amber-700">Eng eski</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{oldestDebt} kun</div>
            <div className="text-xs text-slate-600 mt-1">kritik chegara: 30 kun</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <TrendingUp className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Limit</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">10.0 M</div>
            <div className="text-xs text-slate-600 mt-1">so'm · {((10_000_000 - totalDebt) / 10_000_000 * 100).toFixed(0)}% bo'sh</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" /> Qarz tafsiloti
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Manba</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Sana</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Summa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">To'landi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Qoldiq qarz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Muddat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Kun</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {DEBT_DETAILS.map(d => {
                  const sev = severityFor(d.days)
                  return (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <Link href={`/zakazlar/${d.id}`} className="flex items-center gap-2 font-semibold text-emerald-700 hover:underline">
                          <ShoppingBag className="w-4 h-4" /> {d.desc}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-slate-700 font-mono text-xs">{d.date}</td>
                      <td className="py-3 px-2 text-right font-mono">{fmt(d.sum)}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-700">{fmt(d.paid)}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">{fmt(d.debt)}</td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-xs">{d.due}</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${sev.text}`}>{d.days > 0 ? `+${d.days}` : "—"}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${sev.bg} ${sev.text}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button size="sm" variant="outline" className="text-xs">To'lov</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-3 px-2">Jami:</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(DEBT_DETAILS.reduce((s, d) => s + d.sum, 0))}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-700">{fmt(DEBT_DETAILS.reduce((s, d) => s + d.paid, 0))}</td>
                  <td className="py-3 px-2 text-right font-mono text-rose-700">{fmt(totalDebt)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
