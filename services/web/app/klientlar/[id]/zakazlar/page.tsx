"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ShoppingBag, TrendingUp, Calendar, Search, Eye, Plus, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

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

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  delivered: { label: "Yetkazib berildi", bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "Bekor qilindi", bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
  returned: { label: "Qaytarildi", bg: "bg-amber-100", text: "text-amber-700", icon: AlertCircle },
  pending: { label: "Kutilmoqda", bg: "bg-blue-100", text: "text-blue-700", icon: Calendar },
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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Klient zakazlari · #{id}</h1>
            <p className="text-base text-slate-500 mt-1">Salom Magazin №1 · {ORDERS.length} ta zakaz · 2026 yilda</p>
          </div>
          <Link href="/sotuv/yangi"><Button className="gap-2"><Plus className="w-4 h-4" /> Yangi zakaz</Button></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami zakaz</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{ORDERS.length}</div>
            <div className="text-xs text-emerald-700 mt-1 font-semibold">{successCount} muvaffaqiyatli</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <TrendingUp className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Jami summa</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalSum / 1_000_000)} M</div>
            <div className="text-xs text-blue-700 mt-1 font-semibold">o'rt: {fmt(Math.round(totalSum / ORDERS.length / 1_000))}K/zakaz</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <CheckCircle2 className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">To'lab berilgan</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalPaid / 1_000_000)} M</div>
            <div className="text-xs text-violet-700 mt-1 font-semibold">{(totalPaid / totalSum * 100).toFixed(0)}%</div>
          </Card>
          <Card className={`p-5 border-2 ${totalDebt > 0 ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-300" : "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300"}`}>
            <AlertCircle className={`w-7 h-7 ${totalDebt > 0 ? "text-rose-600" : "text-slate-600"} bg-white p-1.5 rounded-xl shadow-sm mb-2`} />
            <div className={`text-xs font-bold ${totalDebt > 0 ? "text-rose-700" : "text-slate-700"}`}>Qarz</div>
            <div className={`text-2xl font-bold mt-1 ${totalDebt > 0 ? "text-rose-800" : "text-slate-900"}`}>{fmt(totalDebt / 1_000_000)} M</div>
            <div className={`text-xs mt-1 font-semibold ${totalDebt > 0 ? "text-rose-700" : "text-slate-600"}`}>{(totalDebt / totalSum * 100).toFixed(1)}%</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zakaz № yoki agent..." className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setStatusFilter(null)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${!statusFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                Hammasi
              </button>
              {Object.entries(STATUS_CFG).filter(([k]) => ORDERS.some(o => o.status === k)).map(([k, c]) => (
                <button key={k} onClick={() => setStatusFilter(k)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${statusFilter === k ? "bg-slate-900 text-white" : `${c.bg} ${c.text}`}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Sana / Vaqt</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Agent</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Summa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">To'landi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Qarz</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const cfg = STATUS_CFG[o.status]
                  const Icon = cfg.icon
                  const debt = o.sum - o.paid
                  return (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-400 font-mono">#{o.id}</td>
                      <td className="py-3 px-2">
                        <div className="font-mono text-xs text-slate-700">{o.date}</div>
                        <div className="text-xs text-slate-500">{o.time}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-700">{o.agent}</td>
                      <td className="py-3 px-2 text-right font-mono">{o.items} pos.</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">{fmt(o.sum)}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(o.paid)}</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${debt > 0 ? "text-rose-700" : "text-slate-400"}`}>
                        {debt > 0 ? fmt(debt) : "—"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Link href={`/zakazlar/${o.id}`} className="inline-flex items-center gap-1 text-emerald-700 hover:underline text-xs font-semibold">
                          <Eye className="w-3.5 h-3.5" /> Ko'rish
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={3} className="py-3 px-2 text-slate-700">Jami: {filtered.length} zakaz</td>
                  <td className="py-3 px-2 text-right font-mono">{filtered.reduce((s, o) => s + o.items, 0)} pos.</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(filtered.reduce((s, o) => s + o.sum, 0))}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-700">{fmt(filtered.reduce((s, o) => s + o.paid, 0))}</td>
                  <td className="py-3 px-2 text-right font-mono text-rose-700">{fmt(filtered.reduce((s, o) => s + (o.sum - o.paid), 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
