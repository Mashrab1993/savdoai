"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Users, Filter, Download } from "lucide-react"
import Link from "next/link"

type ClientPin = {
  id: number; name: string; lat: number; lng: number;
  segment: string; revenue: number; lastOrder: string;
}

const CLIENTS: ClientPin[] = [
  { id: 1024, name: "Salom Magazin №1", lat: 41.32, lng: 69.27, segment: "Champions", revenue: 28_400_000, lastOrder: "2026-05-02" },
  { id: 1058, name: "Bona Магазин", lat: 41.28, lng: 69.30, segment: "Loyal", revenue: 18_200_000, lastOrder: "2026-04-30" },
  { id: 1142, name: "Дастархон Сервис", lat: 41.31, lng: 69.24, segment: "Champions", revenue: 24_800_000, lastOrder: "2026-05-01" },
  { id: 1224, name: "Гулямов Маркет", lat: 41.26, lng: 69.32, segment: "Loyal", revenue: 12_800_000, lastOrder: "2026-04-26" },
  { id: 1342, name: "Bona Maxsus Магазин", lat: 41.29, lng: 69.29, segment: "Potential", revenue: 4_240_000, lastOrder: "2026-04-22" },
  { id: 1389, name: "Ali Ake Магазин", lat: 41.34, lng: 69.21, segment: "At Risk", revenue: 6_800_000, lastOrder: "2026-03-28" },
  { id: 1402, name: "Гулямов Магазин Сирож", lat: 41.27, lng: 69.31, segment: "Hibernating", revenue: 8_400_000, lastOrder: "2026-02-12" },
  { id: 1456, name: "Yangi Magazin Чорсу", lat: 41.32, lng: 69.23, segment: "New", revenue: 720_000, lastOrder: "2026-04-01" },
  { id: 1502, name: "Турсун Ake Магазин", lat: 41.30, lng: 69.28, segment: "Loyal", revenue: 14_800_000, lastOrder: "2026-04-29" },
  { id: 1545, name: "Билтек Маркет", lat: 41.25, lng: 69.26, segment: "Potential", revenue: 3_200_000, lastOrder: "2026-04-25" },
  { id: 1602, name: "Family Маркет", lat: 41.33, lng: 69.30, segment: "Champions", revenue: 16_400_000, lastOrder: "2026-05-01" },
  { id: 1658, name: "Юсупов Магазин", lat: 41.29, lng: 69.22, segment: "Loyal", revenue: 9_600_000, lastOrder: "2026-04-28" },
]

const SEGMENT_COLOR: Record<string, string> = {
  Champions: "bg-[#D97706]",
  Loyal: "bg-emerald-500",
  Potential: "bg-blue-500",
  New: "bg-purple-500",
  "At Risk": "bg-[#C75D3C]",
  Hibernating: "bg-[#9C8A6E]",
}

const SEGMENT_TEXT: Record<string, string> = {
  Champions: "text-[#D97706]",
  Loyal: "text-emerald-700",
  Potential: "text-blue-700",
  New: "text-purple-700",
  "At Risk": "text-[#C75D3C]",
  Hibernating: "text-[#6B5B4D]",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientsMapsPage() {
  const [filter, setFilter] = useState<string>("all")

  const filtered = CLIENTS.filter(c => filter === "all" || c.segment === filter)

  // Calculate map bounds
  const lats = CLIENTS.map(c => c.lat)
  const lngs = CLIENTS.map(c => c.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const segments = Array.from(new Set(CLIENTS.map(c => c.segment)))
  const totalRevenue = filtered.reduce((s, c) => s + c.revenue, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/klientlar" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENTLAR</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klient <span className="italic text-[#C75D3C]">xaritasi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{filtered.length} klient · {fmt(totalRevenue / 1_000_000)} M tushum · Toshkent shaqari</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Filter className="w-4 h-4" /> Filtr</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilter("all")} className={`px-3 py-2 rounded-md text-xs font-medium ${filter === "all" ? "text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D]"}`} style={filter === "all" ? { background: "#C75D3C" } : undefined}>
              Hammasi <span className="opacity-70">{CLIENTS.length}</span>
            </button>
            {segments.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 ${filter === s ? "text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D]"}`} style={filter === s ? { background: "#C75D3C" } : undefined}>
                <span className={`w-2.5 h-2.5 rounded-full ${SEGMENT_COLOR[s]}`} />
                {s} <span className="opacity-70">{CLIENTS.filter(c => c.segment === s).length}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    <MapPin className="w-5 h-5 text-[#C75D3C]" /> Geografik taqsimot
                  </h2>
                  <span className="text-xs uppercase tracking-wider text-[#9C8A6E]">{filtered.length} pin</span>
                </div>

                <div className="relative bg-gradient-to-br from-[#FCE9DD] to-[#F0EAE0] rounded-xl overflow-hidden border border-[#E8E0D3]" style={{ aspectRatio: "16/10" }}>
                  {/* Grid background */}
                  <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#E8E0D3" strokeWidth="0.2" />
                    ))}
                    {Array.from({ length: 11 }).map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#E8E0D3" strokeWidth="0.2" />
                    ))}
                  </svg>

                  {/* Pins */}
                  {filtered.map(c => {
                    const x = ((c.lng - minLng) / (maxLng - minLng)) * 90 + 5
                    const y = (1 - (c.lat - minLat) / (maxLat - minLat)) * 90 + 5
                    const size = c.revenue >= 20_000_000 ? "w-6 h-6" : c.revenue >= 10_000_000 ? "w-5 h-5" : "w-4 h-4"
                    return (
                      <button
                        key={c.id}
                        className={`absolute ${size} rounded-full ${SEGMENT_COLOR[c.segment]} border-2 border-white shadow-lg hover:scale-150 transition-transform cursor-pointer flex items-center justify-center`}
                        style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                        title={`${c.name} · ${fmt(c.revenue / 1_000_000)} M`}
                      >
                        <span className="text-[10px] text-white font-medium opacity-0 hover:opacity-100">{c.id}</span>
                      </button>
                    )
                  })}

                  {/* Compass */}
                  <div className="absolute top-3 right-3 bg-white rounded-lg p-2 shadow-md text-xs border border-[#E8E0D3]">
                    <div className="font-medium text-center text-[#1A1A1A]">N</div>
                    <div className="text-[#9C8A6E]">↑</div>
                  </div>

                  {/* Scale */}
                  <div className="absolute bottom-3 left-3 bg-white rounded-lg px-3 py-1.5 shadow-md text-xs flex items-center gap-2 border border-[#E8E0D3]">
                    <div className="w-12 h-0.5 bg-[#6B5B4D]" />
                    <span className="font-mono tabular-nums text-[#6B5B4D]">~5 km</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#6B5B4D]">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /> = top tushum (20M+)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> = o'rta (10-20M)</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> = past (&lt;10M)</div>
                </div>
              </Card>
            </div>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
              <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Users className="w-5 h-5 text-[#C75D3C]" /> Pin ro'yxati
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filtered.sort((a, b) => b.revenue - a.revenue).map(c => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#FAF7F2] cursor-pointer">
                    <div className={`w-3 h-3 rounded-full ${SEGMENT_COLOR[c.segment]} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-[#1A1A1A]">{c.name}</div>
                      <div className="text-xs text-[#9C8A6E] flex items-center gap-2">
                        <span>{c.lastOrder}</span>
                        <span className={`text-xs ${SEGMENT_TEXT[c.segment]}`}>· {c.segment}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono tabular-nums font-medium text-emerald-700">{fmt(c.revenue / 1_000_000)} M</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
