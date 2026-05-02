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
  { key: "facing", name: "Facing", count: 142, color: "emerald" },
  { key: "stock", name: "Sklad", count: 96, color: "blue" },
  { key: "promo", name: "Aksiya", count: 68, color: "violet" },
  { key: "competitor", name: "Raqobat", count: 42, color: "amber" },
  { key: "damage", name: "Brak", count: 18, color: "rose" },
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
  const { data: api, loading } = useApi<any[]>(isAuthenticated ? "/api/v1/photo-reports" : null)
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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Foto-hisobotlar</h1>
            <p className="text-base text-slate-500 mt-1">Aprel 2026 · {totalPhotos} ta foto · {approvedCount} ma'qullangan ({Math.round(approvedCount / totalPhotos * 100)}%)</p>
          </div>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filtr</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> ZIP</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map(c => {
            const isActive = activeCategory === c.key
            return (
              <Card
                key={c.key}
                onClick={() => setActiveCategory(isActive ? null : c.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 bg-${c.color}-50 border-${c.color}-200 ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
              >
                <Camera className={`w-5 h-5 text-${c.color}-600 mb-2`} />
                <div className={`text-xs font-bold text-${c.color}-700`}>{c.name}</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{c.count}</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient yoki agent..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta foto</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map(p => {
              const cat = CATEGORIES.find(c => c.key === p.category)!
              return (
                <button key={p.id} onClick={() => setSelectedPhoto(p)} className="relative aspect-[3/4] rounded-lg overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${cat.color}-200 via-${cat.color}-100 to-${cat.color}-50 flex items-center justify-center`}>
                    <Camera className="w-10 h-10 text-slate-400/50" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold bg-white/90 text-${cat.color}-700`}>
                      {cat.name}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    {p.approved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 bg-white rounded-full" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="text-xs font-semibold text-white truncate">{p.client}</div>
                    <div className="text-[10px] text-white/80 mt-0.5">{p.agent} · {p.date}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Foto-hisobot #{selectedPhoto.id}</h3>
                <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="aspect-video bg-gradient-to-br from-emerald-200 to-blue-200 flex items-center justify-center">
                <Camera className="w-16 h-16 text-slate-400" />
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-500 font-bold mb-1">KLIENT</div>
                    <div className="font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedPhoto.client}</div>
                    <div className="text-xs text-slate-500">{selectedPhoto.region}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold mb-1">AGENT</div>
                    <div className="font-semibold flex items-center gap-1"><User className="w-3 h-3" /> {selectedPhoto.agent}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold mb-1">SANA</div>
                    <div className="font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedPhoto.date} · {selectedPhoto.time}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold mb-1">KATEGORIYA</div>
                    <div className="font-semibold">{CATEGORIES.find(c => c.key === selectedPhoto.category)?.name}</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="w-4 h-4" /> Ma'qullash</Button>
                  <Button variant="outline" className="flex-1 gap-2 text-rose-700 border-rose-300"><AlertCircle className="w-4 h-4" /> Rad etish</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
