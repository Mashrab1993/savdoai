"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Camera, Search, MapPin, Calendar, User, AlertCircle, CheckCircle2, X, Filter, Download } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

const CATEGORIES = [
  { key: "facing", name: "Facing", count: 142, accent: "#10B981" },
  { key: "stock", name: "Sklad", count: 96, accent: "#3B82F6" },
  { key: "promo", name: "Aksiya", count: 68, accent: "#8B5CF6" },
  { key: "competitor", name: "Raqobat", count: 42, accent: "#D97706" },
  { key: "damage", name: "Brak", count: 18, accent: "#C75D3C" },
]

const PHOTOS = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  client: ["Salom Magazin №1", "Asia Optom", "Lider Chakana", "Bobur Magazin", "Globus Plus", "Mega Market"][i % 6],
  agent: ["Nurmatov A.", "Rasulov B.", "Karimov S.", "Yusupov D."][i % 4],
  category: CATEGORIES[i % CATEGORIES.length].key,
  date: `2026-04-${String(28 + (i % 5)).padStart(2, "0")}`,
  time: `${9 + (i % 9)}:${(i * 7) % 60 || "00"}`,
  region: ["Sergeli", "Yashnobod", "Markaz", "Buxoro"][i % 4],
  approved: i % 5 !== 0,
}))

export default function PhotoReportsPage() {
  const { isAuthenticated } = useAuth()
  const { data: _api, loading: _loading } = useApi<any[]>(isAuthenticated ? "/api/v1/photo-reports" : null)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<typeof PHOTOS[0] | null>(null)

  const filtered = PHOTOS.filter(p => {
    const matchSearch = !search || p.client.toLowerCase().includes(search.toLowerCase()) || p.agent.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCategory || p.category === activeCategory
    return matchSearch && matchCat
  })

  const totalPhotos = PHOTOS.length
  const approvedCount = PHOTOS.filter(p => p.approved).length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Foto-<span className="italic text-[#C75D3C]">hisobotlar</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Aprel 2026 · {totalPhotos} ta foto · {approvedCount} ma'qullangan ({Math.round(approvedCount / totalPhotos * 100)}%)</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Filter className="w-4 h-4" /> Filtr</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> ZIP</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {CATEGORIES.map(c => {
              const isActive = activeCategory === c.key
              return (
                <Card
                  key={c.key}
                  onClick={() => setActiveCategory(isActive ? null : c.key)}
                  className="p-4 cursor-pointer transition-all hover:shadow-md border bg-white rounded-2xl relative overflow-hidden"
                  style={isActive ? { borderColor: c.accent, boxShadow: `0 0 0 2px ${c.accent}33` } : { borderColor: "#E8E0D3" }}
                >
                  <Camera className="w-5 h-5 mb-2" style={{ color: c.accent }} />
                  <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: c.accent }}>{c.name}</div>
                  <div className="text-3xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{c.count}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: c.accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient yoki agent..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length} ta foto</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filtered.map(p => {
                const cat = CATEGORIES.find(c => c.key === p.category)!
                return (
                  <button key={p.id} onClick={() => setSelectedPhoto(p)} className="relative aspect-[3/4] rounded-2xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer border border-[#E8E0D3]">
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cat.accent}33 0%, #FAF7F2 100%)` }}>
                      <Camera className="w-10 h-10 opacity-50" style={{ color: cat.accent }} />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/95" style={{ color: cat.accent }}>
                        {cat.name}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      {p.approved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 bg-white rounded-full" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#D97706] bg-white rounded-full" />
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-xs font-medium text-white truncate">{p.client}</div>
                      <div className="text-[10px] text-white/80 mt-0.5">{p.agent} · {p.date}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {selectedPhoto && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-[#E8E0D3]">
                  <h3 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Foto-hisobot #{selectedPhoto.id}</h3>
                  <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><X className="w-5 h-5 text-[#6B5B4D]" /></button>
                </div>
                <div className="aspect-video flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FCE9DD 0%, #F0EAE0 100%)" }}>
                  <Camera className="w-16 h-16 text-[#9C8A6E]" />
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1">KLIENT</div>
                      <div className="font-medium flex items-center gap-1 text-[#1A1A1A]"><MapPin className="w-3 h-3 text-[#9C8A6E]" /> {selectedPhoto.client}</div>
                      <div className="text-xs text-[#9C8A6E]">{selectedPhoto.region}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1">AGENT</div>
                      <div className="font-medium flex items-center gap-1 text-[#1A1A1A]"><User className="w-3 h-3 text-[#9C8A6E]" /> {selectedPhoto.agent}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1">SANA</div>
                      <div className="font-medium flex items-center gap-1 text-[#1A1A1A]"><Calendar className="w-3 h-3 text-[#9C8A6E]" /> {selectedPhoto.date} · {selectedPhoto.time}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1">KATEGORIYA</div>
                      <div className="font-medium text-[#1A1A1A]">{CATEGORIES.find(c => c.key === selectedPhoto.category)?.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 gap-2" style={{ background: "#10B981" }}><CheckCircle2 className="w-4 h-4" /> Ma'qullash</Button>
                    <Button variant="outline" className="flex-1 gap-2 text-[#C75D3C] border-[#C75D3C]"><AlertCircle className="w-4 h-4" /> Rad etish</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
