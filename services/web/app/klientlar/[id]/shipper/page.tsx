"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Truck, Eye, Phone } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Yetkazib <span className="italic text-[#C75D3C]">berish (Shipper)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · Ekspeditor va marshrut tarixi</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Truck className="w-5 h-5 mb-2" style={{ color: "#047857" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#047857" }}>Yetkazildi</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{deliveredCount}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Truck className="w-5 h-5 mb-2" style={{ color: "#D97706" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#D97706" }}>Kutilmoqda</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{SHIPMENTS.filter(s => s.status === "pending").length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">yo'lda</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#D97706" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Truck className="w-5 h-5 mb-2" style={{ color: "#1D4ED8" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#1D4ED8" }}>Tovar miqdori</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalQty)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">dona</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Truck className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
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
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Yetkazib berish # yoki ekspeditor..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ekspeditor</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Avtomobil</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Marshrut</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Imzo</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-[#9C8A6E] font-mono">#{s.id}</td>
                      <td className="py-3 px-2 font-mono text-xs text-[#6B5B4D]">{s.date}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{s.expeditor.split(" (")[0]}</div>
                        <div className="text-xs text-[#9C8A6E] flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {s.expeditor.match(/\(([^)]+)\)/)?.[1] ?? ""}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-[#6B5B4D]">{s.vehicle}</td>
                      <td className="py-3 px-2 text-[#6B5B4D]">{s.route}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(s.qty)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700" style={SERIF}>{fmt(s.sum)}</td>
                      <td className="py-3 px-2 text-center">
                        {s.signature ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-[#E8E0D3] text-lg">○</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {s.status === "delivered" && <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Yetkazildi</span>}
                        {s.status === "pending" && <span className="text-xs px-2 py-0.5 rounded bg-[#FCE9DD] text-[#D97706]">Kutilmoqda</span>}
                        {s.status === "cancelled" && <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C]">Bekor</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Link href={`/sotuv/yangi`} className="inline-flex items-center gap-1 text-[#C75D3C] hover:underline text-xs">
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
