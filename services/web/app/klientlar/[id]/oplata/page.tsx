"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Wallet, Banknote, ArrowRightLeft, CreditCard, Plus, Search, Download, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

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

const METHOD_CFG: Record<string, { chip: string; icon: any }> = {
  "Naqd":          { chip: "bg-emerald-50 text-emerald-700",  icon: Banknote },
  "USD naqd":      { chip: "bg-emerald-50 text-emerald-700",  icon: Banknote },
  "Click":         { chip: "bg-blue-50 text-blue-700",        icon: ArrowRightLeft },
  "Payme":         { chip: "bg-violet-50 text-violet-700",    icon: ArrowRightLeft },
  "Bank o'tkazma": { chip: "bg-[#FCE9DD] text-[#D97706]",     icon: CreditCard },
  "Karta (POS)":   { chip: "bg-[#F5E5D6] text-[#C75D3C]",     icon: CreditCard },
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient <span className="italic text-[#C75D3C]">to'lovlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · {PAYMENTS.length} ta to'lov · {fmt(totalUZS / 1_000_000)} M so'm + {totalUSD} $</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Button onClick={() => setShowForm(true)} className="gap-2 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi to'lov</Button>
          </div>

          {showForm && (
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5" style={{ color: "#C75D3C" }} />
                <h2 className="text-xl font-light text-[#1A1A1A]" style={SERIF}>Yangi <span className="italic text-[#C75D3C]">to'lov</span> qabul qilish</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">To'lov usuli *</label>
                  <select className="w-full px-3 py-2 border border-[#E8E0D3] rounded-lg text-sm font-medium bg-white text-[#1A1A1A]">
                    {Object.keys(METHOD_CFG).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Summa *</label>
                  <Input type="number" placeholder="0" className="border-[#E8E0D3]" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Valyuta</label>
                  <select className="w-full px-3 py-2 border border-[#E8E0D3] rounded-lg text-sm font-medium bg-white text-[#1A1A1A]">
                    <option>UZS</option>
                    <option>USD</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Sana</label>
                  <Input type="date" defaultValue="2026-05-02" className="border-[#E8E0D3]" />
                </div>
                <div className="col-span-2 md:col-span-4">
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Izoh</label>
                  <Input placeholder="Zakaz # yoki maxsus izoh..." className="border-[#E8E0D3]" />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]" onClick={() => setShowForm(false)}>Bekor qilish</Button>
                <Button onClick={() => { toast.success("To'lov qabul qilindi"); setShowForm(false) }} className="gap-2 text-white" style={{ background: "#C75D3C" }}><Wallet className="w-4 h-4" /> To'lovni qabul qilish</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Wallet className="w-5 h-5 mb-2" style={{ color: "#047857" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#047857" }}>Jami UZS</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalUZS)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">so'm · {PAYMENTS.filter(p => p.currency === "UZS").length} ta operatsiya</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Wallet className="w-5 h-5 mb-2" style={{ color: "#1D4ED8" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#1D4ED8" }}>Jami USD</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{totalUSD} $</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{PAYMENTS.filter(p => p.currency === "USD").length} ta operatsiya</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <FileText className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>Jami operatsiyalar</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{PAYMENTS.length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{Math.round(PAYMENTS.length / 4)} ta/oy</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#8B5CF6" }} />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="To'lov # yoki izoh..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setMethodFilter(null)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${!methodFilter ? "bg-[#1A1A1A] text-white" : "bg-[#F0EAE0] text-[#6B5B4D]"}`}>
                  Hammasi
                </button>
                {Object.entries(METHOD_CFG).map(([m, cfg]) => (
                  <button key={m} onClick={() => setMethodFilter(m)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${methodFilter === m ? "bg-[#1A1A1A] text-white" : cfg.chip}`}>
                    {m}
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
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Usul</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const cfg = METHOD_CFG[p.method] || { chip: "bg-[#F0EAE0] text-[#6B5B4D]", icon: Wallet }
                    const Icon = cfg.icon
                    return (
                      <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 text-[#9C8A6E] font-mono">#{p.id}</td>
                        <td className="py-3 px-2">
                          <div className="font-mono text-xs text-[#6B5B4D]">{p.date}</div>
                          <div className="text-xs text-[#9C8A6E]">{p.time}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.chip}`}>
                            <Icon className="w-3 h-3" /> {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700" style={SERIF}>+{fmt(p.sum)} <span className="text-xs text-[#9C8A6E] font-normal">{p.currency}</span></td>
                        <td className="py-3 px-2 text-[#6B5B4D]">{p.agent}</td>
                        <td className="py-3 px-2 text-[#9C8A6E] text-xs">{p.note || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
