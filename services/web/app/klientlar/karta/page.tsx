"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, Search, Layers, Users, Filter } from "lucide-react"
import Link from "next/link"

const CLIENTS = [
  { id: 1, name: "Salom Magazin №1", lat: 41.272, lng: 69.213, status: "active", debt: 0, region: "Sergeli" },
  { id: 2, name: "Asia Optom", lat: 41.275, lng: 69.220, status: "vip", debt: 18_500_000, region: "Sergeli" },
  { id: 3, name: "Lider Chakana", lat: 41.265, lng: 69.205, status: "active", debt: 0, region: "Sergeli" },
  { id: 4, name: "Globus Plus", lat: 41.281, lng: 69.198, status: "debt", debt: 12_300_000, region: "Markaz" },
  { id: 5, name: "Mega Market", lat: 41.288, lng: 69.230, status: "active", debt: 0, region: "Yashnobod" },
  { id: 6, name: "Sharq Bozor", lat: 41.270, lng: 69.245, status: "active", debt: 4_200_000, region: "Bog'ishamol" },
  { id: 7, name: "Bobur Magazin", lat: 41.260, lng: 69.220, status: "inactive", debt: 0, region: "Sergeli" },
  { id: 8, name: "Optom Tovar Service", lat: 41.295, lng: 69.250, status: "vip", debt: 8_900_000, region: "Mirzo Ulug'bek" },
  { id: 9, name: "Yangiyul Trade", lat: 41.300, lng: 69.180, status: "debt", debt: 3_100_000, region: "Olmazor" },
  { id: 10, name: "Plov Prazdnik", lat: 41.255, lng: 69.260, status: "active", debt: 1_900_000, region: "Sergeli" },
]

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  vip: "bg-[#D97706]",
  debt: "bg-[#C75D3C]",
  inactive: "bg-[#9C8A6E]",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  vip: "VIP",
  debt: "Qarzdor",
  inactive: "Faol emas",
}

export default function KlientKartaPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<typeof CLIENTS[0] | null>(null)

  const filtered = CLIENTS.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const minLat = 41.250, maxLat = 41.305
  const minLng = 69.170, maxLng = 69.270

  const xFor = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100
  const yFor = (lat: number) => 100 - ((lat - minLat) / (maxLat - minLat)) * 100

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/klientlar" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENTLAR</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klientlar <span className="italic text-[#C75D3C]">xaritasi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{CLIENTS.length} ta klient · 4 ta status · GPS koordinata bilan</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Layers className="w-4 h-4" /> Layer</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Filter className="w-4 h-4" /> Filtr</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(STATUS_LABELS).map(([k, l]) => {
              const count = CLIENTS.filter(c => c.status === k).length
              const isActive = statusFilter === k
              return (
                <Card
                  key={k}
                  onClick={() => setStatusFilter(isActive ? null : k)}
                  className={`bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all relative overflow-hidden ${isActive ? "ring-2 ring-[#C75D3C]/30" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-4 h-4 rounded-full ${STATUS_COLORS[k]}`} />
                    <span className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">{l}</span>
                  </div>
                  <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{count}</div>
                  <div className={`absolute bottom-0 left-0 right-0 h-px ${STATUS_COLORS[k]}`} />
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <MapPin className="w-5 h-5 text-[#C75D3C]" /> Toshkent — interaktiv xarita
              </h2>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#FCE9DD] to-[#F0EAE0] rounded-xl overflow-hidden border border-[#E8E0D3]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(to right, #E8E0D3 1px, transparent 1px), linear-gradient(to bottom, #E8E0D3 1px, transparent 1px)`,
                  backgroundSize: "10% 10%",
                  opacity: 0.5,
                }} />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-sm border border-[#E8E0D3]">
                  <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Toshkent shahri</div>
                  <div className="text-[10px] text-[#6B5B4D] mt-0.5">{filtered.length} klient · zoom: 12x</div>
                </div>
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full ${STATUS_COLORS[c.status]} ring-4 ring-white shadow-lg hover:scale-150 transition-transform cursor-pointer ${selected?.id === c.id ? "scale-150 ring-[#C75D3C]" : ""}`}
                    style={{ left: `${xFor(c.lng)}%`, top: `${yFor(c.lat)}%` }}
                    title={c.name}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 hover:opacity-100">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient qidiring..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <div className="text-xs uppercase tracking-wider text-[#9C8A6E] mb-3">{filtered.length} ta klient</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${selected?.id === c.id ? "border-[#C75D3C] bg-[#F5E5D6]/30" : "border-[#E8E0D3] hover:bg-[#FAF7F2]"}`}
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_COLORS[c.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-[#1A1A1A]">{c.name}</div>
                      <div className="text-xs text-[#9C8A6E]">{c.region} · {STATUS_LABELS[c.status]}</div>
                    </div>
                    {c.debt > 0 && <span className="text-xs px-1.5 py-0.5 bg-[#F5E5D6] text-[#C75D3C] rounded font-mono tabular-nums font-medium">{(c.debt / 1_000_000).toFixed(1)}M</span>}
                  </button>
                ))}
              </div>

              {selected && (
                <div className="mt-4 pt-4 border-t border-[#E8E0D3]">
                  <h3 className="font-medium mb-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{selected.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-[#9C8A6E]">Region:</span><span className="font-medium text-[#1A1A1A]">{selected.region}</span></div>
                    <div className="flex justify-between"><span className="text-[#9C8A6E]">Status:</span><span className="font-medium text-[#1A1A1A]">{STATUS_LABELS[selected.status]}</span></div>
                    <div className="flex justify-between"><span className="text-[#9C8A6E]">Koordinata:</span><span className="font-mono tabular-nums text-xs text-[#6B5B4D]">{selected.lat}, {selected.lng}</span></div>
                    {selected.debt > 0 && <div className="flex justify-between"><span className="text-[#9C8A6E]">Qarz:</span><span className="font-mono tabular-nums font-medium text-[#C75D3C]">{selected.debt.toLocaleString("ru-RU")}</span></div>}
                  </div>
                  <Link href={`/klientlar/${selected.id}`}>
                    <Button className="w-full mt-3 text-white" size="sm" style={{ background: "#C75D3C" }}>
                      <Users className="w-3.5 h-3.5 mr-1" /> Klient profili
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
