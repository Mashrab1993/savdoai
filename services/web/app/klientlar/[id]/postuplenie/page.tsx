"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Package, Eye } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

const POSTUPLENIYA = [
  { id: 3024, date: "2026-04-30", time: "09:25", agent: "Nurmatov A.", items: 12, qty: 168, sum: 1_840_000, status: "primit" },
  { id: 3018, date: "2026-04-25", time: "11:30", agent: "Karimov S.", items: 8, qty: 96, sum: 1_240_000, status: "primit" },
  { id: 3012, date: "2026-04-20", time: "14:12", agent: "Nurmatov A.", items: 18, qty: 248, sum: 2_840_000, status: "primit" },
  { id: 3006, date: "2026-04-15", time: "10:15", agent: "Yusupov D.", items: 6, qty: 72, sum: 840_000, status: "obraz" },
  { id: 3000, date: "2026-04-10", time: "16:20", agent: "Nurmatov A.", items: 14, qty: 168, sum: 1_640_000, status: "primit" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientPostupleniePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [search, setSearch] = useState("")
  const filtered = POSTUPLENIYA.filter(p => !search || String(p.id).includes(search))

  const totalSum = POSTUPLENIYA.reduce((s, p) => s + p.sum, 0)
  const totalQty = POSTUPLENIYA.reduce((s, p) => s + p.qty, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient <span className="italic text-[#C75D3C]">postupleniyalari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · {POSTUPLENIYA.length} ta postuplenie · {fmt(totalSum / 1_000_000)} M so'm</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Package className="w-5 h-5 mb-2" style={{ color: "#047857" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#047857" }}>Postupleniyalar</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{POSTUPLENIYA.length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami operatsiya</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Package className="w-5 h-5 mb-2" style={{ color: "#1D4ED8" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#1D4ED8" }}>Tovar miqdori</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalQty)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">dona</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Package className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>Jami summa</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalSum / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">so'm</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#8B5CF6" }} />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Postuplenie #..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana / Vaqt</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Pozitsiya</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-[#9C8A6E] font-mono">#{p.id}</td>
                      <td className="py-3 px-2">
                        <div className="font-mono text-xs text-[#6B5B4D]">{p.date}</div>
                        <div className="text-xs text-[#9C8A6E]">{p.time}</div>
                      </td>
                      <td className="py-3 px-2 text-[#6B5B4D]">{p.agent}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{p.items}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(p.qty)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700" style={SERIF}>{fmt(p.sum)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${p.status === "primit" ? "bg-emerald-50 text-emerald-700" : "bg-[#FCE9DD] text-[#D97706]"}`}>
                          {p.status === "primit" ? "Primit" : "Obrazets"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Link href={`/sklad/kirim`} className="inline-flex items-center gap-1 text-[#C75D3C] hover:underline text-xs">
                          <Eye className="w-3.5 h-3.5" /> Ko'rish
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
