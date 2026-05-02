"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Package, Eye } from "lucide-react"
import Link from "next/link"

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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Klient postupleniyalari · #{id}</h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · {POSTUPLENIYA.length} ta postuplenie · {fmt(totalSum / 1_000_000)} M so'm</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Package className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Postupleniyalar</div>
            <div className="text-2xl font-bold mt-1">{POSTUPLENIYA.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Package className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Tovar miqdori</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalQty)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Package className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Jami summa</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalSum / 1_000_000)} M</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Postuplenie #..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-2">Sana / Vaqt</th>
                  <th className="py-3 px-2">Agent</th>
                  <th className="py-3 px-2 text-right">Pozitsiya</th>
                  <th className="py-3 px-2 text-right">Miqdor</th>
                  <th className="py-3 px-2 text-right">Summa</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                  <th className="py-3 px-2 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 text-slate-400 font-mono">#{p.id}</td>
                    <td className="py-3 px-2">
                      <div className="font-mono text-xs">{p.date}</div>
                      <div className="text-xs text-slate-500">{p.time}</div>
                    </td>
                    <td className="py-3 px-2">{p.agent}</td>
                    <td className="py-3 px-2 text-right font-mono">{p.items}</td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(p.qty)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(p.sum)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.status === "primit" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.status === "primit" ? "✓ Primit" : "⚠ Obrazets"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Link href={`/sklad/kirim`} className="inline-flex items-center gap-1 text-emerald-700 hover:underline text-xs">
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
    </AdminLayout>
  )
}
