"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, ShoppingBag, Wallet, FileText, AlertTriangle, Phone } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

const DEBT_DETAILS = [
  { id: 1024, type: "order", date: "2026-05-02", days: 0, sum: 1_240_000, paid: 800_000, debt: 440_000, due: "2026-05-12", desc: "Zakaz #1024" },
  { id: 1018, type: "order", date: "2026-04-28", days: 4, sum: 2_840_000, paid: 1_800_000, debt: 1_040_000, due: "2026-05-08", desc: "Zakaz #1018" },
  { id: 1012, type: "order", date: "2026-04-25", days: 7, sum: 1_580_000, paid: 800_000, debt: 780_000, due: "2026-05-05", desc: "Zakaz #1012" },
  { id: 982, type: "order", date: "2026-04-08", days: 24, sum: 5_240_000, paid: 4_500_000, debt: 740_000, due: "2026-04-18", desc: "Zakaz #982 (kechikkan)" },
  { id: 932, type: "order", date: "2026-03-15", days: 48, sum: 2_400_000, paid: 0, debt: 2_400_000, due: "2026-03-25", desc: "Zakaz #932 (juda kechikkan)" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function severityFor(days: number) {
  if (days >= 30) return { label: "KRITIK", chip: "bg-[#F5E5D6] text-[#C75D3C]", text: "text-[#C75D3C]" }
  if (days >= 15) return { label: "Kechikkan", chip: "bg-[#FCE9DD] text-[#D97706]", text: "text-[#D97706]" }
  if (days >= 7) return { label: "Diqqat", chip: "bg-[#FCE9DD] text-[#D97706]", text: "text-[#D97706]" }
  return { label: "Vaqtida", chip: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" }
}

export default function ClientDolgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const totalDebt = DEBT_DETAILS.reduce((s, d) => s + d.debt, 0)
  const overdueDebt = DEBT_DETAILS.filter(d => d.days > 0).reduce((s, d) => s + d.debt, 0)
  const criticalDebt = DEBT_DETAILS.filter(d => d.days >= 30).reduce((s, d) => s + d.debt, 0)
  const oldestDebt = Math.max(...DEBT_DETAILS.map(d => d.days))

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient <span className="italic text-[#C75D3C]">qarzlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · Jami qarz: <span className="font-medium text-[#C75D3C]">{fmt(totalDebt)} so'm</span></p>
            </div>
            <Link href={`/klientlar/${id}/oplata`}>
              <Button className="gap-2 text-white" style={{ background: "#C75D3C" }}><Wallet className="w-4 h-4" /> To'lov qabul qilish</Button>
            </Link>
          </div>

          {criticalDebt > 0 && (
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F5E5D6" }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: "#C75D3C" }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C]">KRITIK QARZ MAVJUD</div>
                  <p className="text-sm text-[#6B5B4D] mt-2">
                    30+ kun kechikkan qarz: <span className="font-medium text-[#1A1A1A]">{fmt(criticalDebt)} so'm</span>.
                    Eng eski qarz <span className="font-medium text-[#1A1A1A]">{oldestDebt} kun</span> oldin.
                  </p>
                  <p className="text-sm text-[#6B5B4D] mt-1">Klient bilan bog'laning va to'lov muddatini kelishing.</p>
                </div>
                <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Phone className="w-4 h-4" /> Qo'ng'iroq</Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <AlertCircle className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>Jami qarz</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalDebt)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">so'm · {DEBT_DETAILS.length} ta operatsiya</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingDown className="w-5 h-5 mb-2" style={{ color: "#D97706" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#D97706" }}>Kechikkan</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(overdueDebt)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{(overdueDebt / totalDebt * 100).toFixed(1)}% jamidan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#D97706" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <FileText className="w-5 h-5 mb-2" style={{ color: "#D97706" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#D97706" }}>Eng eski</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{oldestDebt} kun</div>
              <div className="text-xs text-[#9C8A6E] mt-1">kritik chegara: 30 kun</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#D97706" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#1D4ED8" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#1D4ED8" }}>Limit</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>10.0 M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">so'm · {((10_000_000 - totalDebt) / 10_000_000 * 100).toFixed(0)}% bo'sh</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" style={{ color: "#C75D3C" }} />
              <h2 className="text-xl font-light text-[#1A1A1A]" style={SERIF}>Qarz <span className="italic text-[#C75D3C]">tafsiloti</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Manba</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">To'landi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qoldiq qarz</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Muddat</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kun</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {DEBT_DETAILS.map(d => {
                    const sev = severityFor(d.days)
                    return (
                      <tr key={d.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2">
                          <Link href={`/zakazlar/${d.id}`} className="flex items-center gap-2 font-medium text-[#C75D3C] hover:underline">
                            <ShoppingBag className="w-4 h-4" /> {d.desc}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-[#6B5B4D] font-mono text-xs">{d.date}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(d.sum)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700">{fmt(d.paid)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-[#C75D3C]" style={SERIF}>{fmt(d.debt)}</td>
                        <td className="py-3 px-2 text-[#9C8A6E] font-mono text-xs">{d.due}</td>
                        <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${sev.text}`}>{d.days > 0 ? `+${d.days}` : "—"}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sev.chip}`}>
                            {sev.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Button size="sm" variant="outline" className="text-xs border-[#E8E0D3] text-[#6B5B4D]">To'lov</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2] font-medium">
                    <td colSpan={2} className="py-3 px-2 text-[#1A1A1A]">Jami:</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(DEBT_DETAILS.reduce((s, d) => s + d.sum, 0))}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{fmt(DEBT_DETAILS.reduce((s, d) => s + d.paid, 0))}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]" style={SERIF}>{fmt(totalDebt)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
