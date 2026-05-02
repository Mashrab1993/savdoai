"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Truck, Eye, Phone } from "lucide-react"
import Link from "next/link"

type Shipment = {
  id: number; date: string; expeditor: string; vehicle: string; route: string;
  qty: number; sum: number; status: "delivered" | "pending" | "cancelled";
  signature: boolean;
}

const SHIPMENTS: Shipment[] = [
  { id: 7024, date: "2026-05-02", expeditor: "Toxirov M. (+998 90 123 45 67)", vehicle: "01 A 234 BB", route: "Yashnobod #4", qty: 168, sum: 1_840_000, status: "delivered", signature: true },
  { id: 7018, date: "2026-04-30", expeditor: "Aminov R. (+998 90 234 56 78)", vehicle: "01 B 567 CC", route: "Sergeli #2", qty: 96, sum: 1_240_000, status: "delivered", signature: true },
  { id: 7012, date: "2026-04-28", expeditor: "Karimov F. (+998 90 345 67 89)", vehicle: "01 C 890 DD", route: "Yashnobod #4", qty: 248, sum: 2_840_000, status: "delivered", signature: true },
  { id: 7006, date: "2026-04-25", expeditor: "Sobirov G. (+998 90 456 78 90)", vehicle: "01 A 234 BB", route: "Yangi Hayot", qty: 72, sum: 840_000, status: "pending", signature: false },
  { id: 7000, date: "2026-04-22", expeditor: "Toxirov M. (+998 90 123 45 67)", vehicle: "01 A 234 BB", route: "Yashnobod #4", qty: 168, sum: 1_640_000, status: "delivered", signature: true },
  { id: 6994, date: "2026-04-18", expeditor: "Aminov R. (+998 90 234 56 78)", vehicle: "01 B 567 CC", route: "Sergeli #2", qty: 84, sum: 980_000, status: "cancelled", signature: false },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientShipperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [search, setSearch] = useState("")
  const filtered = SHIPMENTS.filter(s => !search || String(s.id).includes(search) || s.expeditor.toLowerCase().includes(search.toLowerCase()))

  const totalSum = SHIPMENTS.filter(s => s.status === "delivered").reduce((s, x) => s + x.sum, 0)
  const totalQty = SHIPMENTS.filter(s => s.status === "delivered").reduce((s, x) => s + x.qty, 0)
  const deliveredCount = SHIPMENTS.filter(s => s.status === "delivered").length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Yetkazib berish (Shipper) · #{id}</h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · Ekspeditor va marshrut tarixi</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Truck className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Yetkazildi</div>
            <div className="text-2xl font-bold mt-1">{deliveredCount}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Truck className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Kutilmoqda</div>
            <div className="text-2xl font-bold mt-1">{SHIPMENTS.filter(s => s.status === "pending").length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Truck className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Tovar miqdori</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalQty)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Truck className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Jami summa</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalSum / 1_000_000)} M</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Yetkazib berish # yoki ekspeditor..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2">Ekspeditor</th>
                  <th className="py-3 px-2">Avtomobil</th>
                  <th className="py-3 px-2">Marshrut</th>
                  <th className="py-3 px-2 text-right">Tovar</th>
                  <th className="py-3 px-2 text-right">Summa</th>
                  <th className="py-3 px-2 text-center">Imzo</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                  <th className="py-3 px-2 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 text-slate-400 font-mono">#{s.id}</td>
                    <td className="py-3 px-2 font-mono text-xs">{s.date}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold">{s.expeditor.split(" (")[0]}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {s.expeditor.match(/\(([^)]+)\)/)?.[1] ?? ""}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">{s.vehicle}</td>
                    <td className="py-3 px-2">{s.route}</td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(s.qty)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(s.sum)}</td>
                    <td className="py-3 px-2 text-center">
                      {s.signature ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-slate-300 text-lg">○</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {s.status === "delivered" && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Yetkazildi</span>}
                      {s.status === "pending" && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⏳ Kutilmoqda</span>}
                      {s.status === "cancelled" && <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">✕ Bekor</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Link href={`/sotuv/yangi`} className="inline-flex items-center gap-1 text-emerald-700 hover:underline text-xs">
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
