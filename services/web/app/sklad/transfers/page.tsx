"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Truck, ArrowRight, Calendar, Download, Search, Eye, Pencil } from "lucide-react"
import Link from "next/link"

type Transfer = {
  id: number; date: string; fromWh: string; toWh: string;
  itemsCount: number; totalQty: number; totalValue: number;
  status: "draft" | "in_transit" | "delivered" | "cancelled";
  driver: string; vehicle: string;
}

const TRANSFERS: Transfer[] = [
  { id: 5024, date: "2026-05-02 09:30", fromWh: "Yashnobod (markaziy)", toWh: "Sergeli (filial)", itemsCount: 12, totalQty: 184, totalValue: 2_240_000, status: "in_transit", driver: "Toxirov M.", vehicle: "01 A 234 BB" },
  { id: 5018, date: "2026-04-30 14:20", fromWh: "Yashnobod (markaziy)", toWh: "Bektemir (filial)", itemsCount: 8, totalQty: 96, totalValue: 1_240_000, status: "delivered", driver: "Aminov R.", vehicle: "01 B 567 CC" },
  { id: 5012, date: "2026-04-28 11:45", fromWh: "Sergeli (filial)", toWh: "Yashnobod (markaziy)", itemsCount: 4, totalQty: 24, totalValue: 380_000, status: "delivered", driver: "Karimov F.", vehicle: "01 C 890 DD" },
  { id: 5006, date: "2026-04-25 16:10", fromWh: "Bektemir (filial)", toWh: "Yashnobod (markaziy)", itemsCount: 14, totalQty: 248, totalValue: 3_120_000, status: "delivered", driver: "Sobirov G.", vehicle: "01 A 234 BB" },
  { id: 5000, date: "2026-04-22 10:00", fromWh: "Yashnobod (markaziy)", toWh: "Sergeli (filial)", itemsCount: 6, totalQty: 48, totalValue: 720_000, status: "cancelled", driver: "—", vehicle: "—" },
  { id: 4994, date: "2026-04-20 13:25", fromWh: "Yashnobod (markaziy)", toWh: "Yangi filial (test)", itemsCount: 18, totalQty: 320, totalValue: 4_840_000, status: "delivered", driver: "Toxirov M.", vehicle: "01 A 234 BB" },
]

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "📝 Qoralama",
  in_transit: "🚛 Yo'lda",
  delivered: "✓ Yetkazildi",
  cancelled: "✕ Bekor",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function TransfersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = TRANSFERS
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => !search || String(t.id).includes(search) || t.fromWh.toLowerCase().includes(search.toLowerCase()) || t.toWh.toLowerCase().includes(search.toLowerCase()))

  const totalValue = TRANSFERS.filter(t => t.status === "delivered").reduce((s, t) => s + t.totalValue, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Ombor o'rtasidagi ko'chirish</h1>
            <p className="text-sm text-slate-500">{TRANSFERS.length} ta ko'chirish · jami yetkazilgan {fmt(totalValue / 1_000_000)} M so'm</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi ko'chirish</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="text-xs font-bold text-slate-700">📝 Qoralama</div>
            <div className="text-2xl font-bold mt-1">{TRANSFERS.filter(t => t.status === "draft").length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Truck className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Yo'lda</div>
            <div className="text-2xl font-bold mt-1">{TRANSFERS.filter(t => t.status === "in_transit").length}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700">✓ Yetkazildi</div>
            <div className="text-2xl font-bold mt-1">{TRANSFERS.filter(t => t.status === "delivered").length}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <div className="text-xs font-bold text-rose-700">Jami summa</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalValue / 1_000_000)} M</div>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["all", "draft", "in_transit", "delivered", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>
              {s === "all" ? "Hammasi" : STATUS_LABEL[s]}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID yoki ombor..." className="pl-9 w-64" />
          </div>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2">Yo'nalish</th>
                  <th className="py-3 px-2 text-right">SKU</th>
                  <th className="py-3 px-2 text-right">Miqdor</th>
                  <th className="py-3 px-2 text-right">Summa</th>
                  <th className="py-3 px-2">Driver / Avto</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center w-24">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono text-blue-700">#{t.id}</td>
                    <td className="py-3 px-2 font-mono text-xs">{t.date}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📦 {t.fromWh}</span>
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold">📦 {t.toWh}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{t.itemsCount}</td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(t.totalQty)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(t.totalValue)}</td>
                    <td className="py-3 px-2 text-xs">
                      <div>{t.driver}</div>
                      <div className="text-slate-500 font-mono">{t.vehicle}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                        <button className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Pencil className="w-4 h-4" /></button>
                      </div>
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
