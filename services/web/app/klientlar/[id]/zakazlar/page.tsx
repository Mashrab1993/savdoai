"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ShoppingBag, TrendingUp, Calendar, Search, Eye, Plus, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

const ORDERS = [
  { id: 1024, date: "2026-05-02", time: "10:25", agent: "Nurmatov A.", items: 8, sum: 1_240_000, status: "delivered", paid: 1_240_000 },
  { id: 1018, date: "2026-04-28", time: "14:12", agent: "Nurmatov A.", items: 12, sum: 2_840_000, status: "delivered", paid: 2_840_000 },
  { id: 1012, date: "2026-04-25", time: "11:30", agent: "Karimov S.", items: 6, sum: 1_580_000, status: "delivered", paid: 800_000 },
  { id: 1008, date: "2026-04-22", time: "09:45", agent: "Nurmatov A.", items: 14, sum: 3_240_000, status: "delivered", paid: 3_240_000 },
  { id: 1002, date: "2026-04-18", time: "16:20", agent: "Rasulov B.", items: 4, sum: 920_000, status: "cancelled", paid: 0 },
  { id: 996, date: "2026-04-15", time: "12:00", agent: "Nurmatov A.", items: 18, sum: 4_120_000, status: "delivered", paid: 4_120_000 },
  { id: 988, date: "2026-04-12", time: "10:15", agent: "Karimov S.", items: 8, sum: 1_680_000, status: "delivered", paid: 1_680_000 },
  { id: 982, date: "2026-04-08", time: "15:30", agent: "Nurmatov A.", items: 22, sum: 5_240_000, status: "delivered", paid: 4_500_000 },
  { id: 974, date: "2026-04-05", time: "11:45", agent: "Yusupov D.", items: 10, sum: 2_080_000, status: "delivered", paid: 2_080_000 },
  { id: 966, date: "2026-04-02", time: "14:20", agent: "Nurmatov A.", items: 6, sum: 1_120_000, status: "returned", paid: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const STATUS_CFG: Record<string, { label: string; chip: string; icon: any }> = {
  delivered: { label: "Yetkazib berildi", chip: "bg-emerald-50 text-emerald-700",     icon: CheckCircle2 },
  cancelled: { label: "Bekor qilindi",    chip: "bg-[#F5E5D6] text-[#C75D3C]",        icon: XCircle },
  returned:  { label: "Qaytarildi",       chip: "bg-[#FCE9DD] text-[#D97706]",        icon: AlertCircle },
  pending:   { label: "Kutilmoqda",       chip: "bg-blue-50 text-blue-700",           icon: Calendar },
}

export default function ClientOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = ORDERS.filter(o => {
    const matchSearch = !search || String(o.id).includes(search) || o.agent.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalSum = ORDERS.reduce((s, o) => s + o.sum, 0)
  const totalPaid = ORDERS.reduce((s, o) => s + o.paid, 0)
  const totalDebt = totalSum - totalPaid
  const successCount = ORDERS.filter(o => o.status === "delivered").length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient <span className="italic text-[#C75D3C]">zakazlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · {ORDERS.length} ta zakaz · 2026 yilda</p>
            </div>
            <Link href="/sotuv/yangi"><Button className="gap-2 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi zakaz</Button></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <ShoppingBag className="w-5 h-5 mb-2" style={{ color: "#047857" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#047857" }}>Jami zakaz</div>
              <div className="text-3xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{ORDERS.length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{successCount} muvaffaqiyatli</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#1D4ED8" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#1D4ED8" }}>Jami summa</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalSum / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">o'rt: {fmt(Math.round(totalSum / ORDERS.length / 1_000))}K/zakaz</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>To'lab berilgan</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalPaid / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{(totalPaid / totalSum * 100).toFixed(0)}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#8B5CF6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <AlertCircle className="w-5 h-5 mb-2" style={{ color: totalDebt > 0 ? "#C75D3C" : "#6B5B4D" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: totalDebt > 0 ? "#C75D3C" : "#6B5B4D" }}>Qarz</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalDebt / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{(totalDebt / totalSum * 100).toFixed(1)}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: totalDebt > 0 ? "#C75D3C" : "#9C8A6E" }} />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zakaz № yoki agent..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setStatusFilter(null)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${!statusFilter ? "bg-[#1A1A1A] text-white" : "bg-[#F0EAE0] text-[#6B5B4D]"}`}>
                  Hammasi
                </button>
                {Object.entries(STATUS_CFG).filter(([k]) => ORDERS.some(o => o.status === k)).map(([k, c]) => (
                  <button key={k} onClick={() => setStatusFilter(k)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${statusFilter === k ? "bg-[#1A1A1A] text-white" : c.chip}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length} ta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana / Vaqt</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">To'landi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qarz</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const cfg = STATUS_CFG[o.status]
                    const Icon = cfg.icon
                    const debt = o.sum - o.paid
                    return (
                      <tr key={o.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 text-[#9C8A6E] font-mono">#{o.id}</td>
                        <td className="py-3 px-2">
                          <div className="font-mono text-xs text-[#6B5B4D]">{o.date}</div>
                          <div className="text-xs text-[#9C8A6E]">{o.time}</div>
                        </td>
                        <td className="py-3 px-2 text-[#6B5B4D]">{o.agent}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{o.items} pos.</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-[#1A1A1A]">{fmt(o.sum)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{fmt(o.paid)}</td>
                        <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${debt > 0 ? "text-[#C75D3C]" : "text-[#E8E0D3]"}`}>
                          {debt > 0 ? fmt(debt) : "—"}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.chip}`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Link href={`/zakazlar/${o.id}`} className="inline-flex items-center gap-1 text-[#C75D3C] hover:underline text-xs font-medium">
                            <Eye className="w-3.5 h-3.5" /> Ko'rish
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2] font-medium">
                    <td colSpan={3} className="py-3 px-2 text-[#1A1A1A]">Jami: {filtered.length} zakaz</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{filtered.reduce((s, o) => s + o.items, 0)} pos.</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(filtered.reduce((s, o) => s + o.sum, 0))}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{fmt(filtered.reduce((s, o) => s + o.paid, 0))}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]" style={SERIF}>{fmt(filtered.reduce((s, o) => s + (o.sum - o.paid), 0))}</td>
                    <td colSpan={2} />
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
