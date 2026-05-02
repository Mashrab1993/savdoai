"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Wallet, Banknote, ArrowRightLeft, CreditCard, Plus, Search, Download, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const PAYMENTS = [
  { id: 5012, date: "2026-05-01", time: "14:25", method: "Click", currency: "UZS", sum: 2_400_000, agent: "Nurmatov A.", note: "Zakaz #1024 to'lov" },
  { id: 5008, date: "2026-04-28", time: "16:40", method: "Naqd", currency: "UZS", sum: 1_240_000, agent: "Nurmatov A.", note: "Zakaz #1018 oylik" },
  { id: 5004, date: "2026-04-25", time: "11:30", method: "Payme", currency: "UZS", sum: 3_840_000, agent: "Karimov S.", note: "Avans" },
  { id: 4998, date: "2026-04-22", time: "10:15", method: "Bank o'tkazma", currency: "UZS", sum: 6_500_000, agent: "Mashrab S.", note: "Yirik to'lov" },
  { id: 4992, date: "2026-04-18", time: "13:20", method: "USD naqd", currency: "USD", sum: 200, agent: "Mashrab S.", note: "Special order" },
  { id: 4986, date: "2026-04-15", time: "15:45", method: "Karta (POS)", currency: "UZS", sum: 1_800_000, agent: "Nurmatov A.", note: "" },
  { id: 4980, date: "2026-04-12", time: "11:00", method: "Click", currency: "UZS", sum: 4_200_000, agent: "Karimov S.", note: "" },
  { id: 4974, date: "2026-04-08", time: "14:20", method: "Naqd", currency: "UZS", sum: 2_400_000, agent: "Nurmatov A.", note: "" },
  { id: 4968, date: "2026-04-05", time: "10:30", method: "Click", currency: "UZS", sum: 1_600_000, agent: "Yusupov D.", note: "" },
]

const METHOD_CFG: Record<string, { color: string; icon: any }> = {
  "Naqd": { color: "emerald", icon: Banknote },
  "USD naqd": { color: "lime", icon: Banknote },
  "Click": { color: "blue", icon: ArrowRightLeft },
  "Payme": { color: "violet", icon: ArrowRightLeft },
  "Bank o'tkazma": { color: "amber", icon: CreditCard },
  "Karta (POS)": { color: "rose", icon: CreditCard },
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const filtered = PAYMENTS.filter(p => {
    const matchSearch = !search || String(p.id).includes(search) || p.note.toLowerCase().includes(search.toLowerCase())
    const matchMethod = !methodFilter || p.method === methodFilter
    return matchSearch && matchMethod
  })

  const totalUZS = PAYMENTS.filter(p => p.currency === "UZS").reduce((s, p) => s + p.sum, 0)
  const totalUSD = PAYMENTS.filter(p => p.currency === "USD").reduce((s, p) => s + p.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Klient to'lovlari · #{id}</h1>
            <p className="text-base text-slate-500 mt-1">Salom Magazin №1 · {PAYMENTS.length} ta to'lov · {fmt(totalUZS / 1_000_000)} M so'm + {totalUSD} $</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Yangi to'lov</Button>
        </div>

        {showForm && (
          <Card className="p-5 border-2 border-emerald-300 bg-emerald-50/30">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600" /> Yangi to'lov qabul qilish</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">To'lov usuli *</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium">
                  {Object.keys(METHOD_CFG).map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Summa *</label>
                <Input type="number" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Valyuta</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium">
                  <option>UZS</option>
                  <option>USD</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sana</label>
                <Input type="date" defaultValue="2026-05-02" />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Izoh</label>
                <Input placeholder="Zakaz # yoki maxsus izoh..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Bekor qilish</Button>
              <Button onClick={() => { toast.success("To'lov qabul qilindi"); setShowForm(false) }} className="gap-2"><Wallet className="w-4 h-4" /> To'lovni qabul qilish</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Wallet className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami UZS</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalUZS)}</div>
            <div className="text-xs text-slate-600 mt-1">so'm · {PAYMENTS.filter(p => p.currency === "UZS").length} ta operatsiya</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-lime-50 to-lime-100/50 border-lime-300 border-2">
            <Wallet className="w-7 h-7 text-lime-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-lime-700">Jami USD</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalUSD} $</div>
            <div className="text-xs text-slate-600 mt-1">{PAYMENTS.filter(p => p.currency === "USD").length} ta operatsiya</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <FileText className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Jami operatsiyalar</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{PAYMENTS.length}</div>
            <div className="text-xs text-slate-600 mt-1">{Math.round(PAYMENTS.length / 4)} ta/oy</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="To'lov # yoki izoh..." className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setMethodFilter(null)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${!methodFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                Hammasi
              </button>
              {Object.entries(METHOD_CFG).map(([m, cfg]) => (
                <button key={m} onClick={() => setMethodFilter(m)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${methodFilter === m ? "bg-slate-900 text-white" : `bg-${cfg.color}-100 text-${cfg.color}-700`}`}>
                  {m}
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
                  <th className="py-3 px-2 font-semibold text-slate-600">Usul</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Summa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Agent</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Izoh</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const cfg = METHOD_CFG[p.method] || { color: "slate", icon: Wallet }
                  const Icon = cfg.icon
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-400 font-mono">#{p.id}</td>
                      <td className="py-3 px-2">
                        <div className="font-mono text-xs text-slate-700">{p.date}</div>
                        <div className="text-xs text-slate-500">{p.time}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-${cfg.color}-100 text-${cfg.color}-700`}>
                          <Icon className="w-3 h-3" /> {p.method}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">+{fmt(p.sum)} <span className="text-xs text-slate-500 font-normal">{p.currency}</span></td>
                      <td className="py-3 px-2 text-slate-600">{p.agent}</td>
                      <td className="py-3 px-2 text-slate-500 text-xs">{p.note || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
