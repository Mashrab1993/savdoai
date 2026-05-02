"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Camera, Search, Calendar, MapPin, Filter, Download, Eye } from "lucide-react"
import Link from "next/link"

type Photo = {
  id: number; date: string; time: string;
  client: string; agent: string;
  category: "shelf" | "facade" | "facing" | "promo" | "competitor" | "issue";
  approved: boolean; aiScore: number;
  notes?: string;
}

const PHOTOS: Photo[] = [
  { id: 1, date: "2026-05-02", time: "10:25", client: "Salom Magazin №1", agent: "Babadjanova N.", category: "facade", approved: true, aiScore: 92, notes: "Ko'rinish a'lo" },
  { id: 2, date: "2026-05-02", time: "10:28", client: "Salom Magazin №1", agent: "Babadjanova N.", category: "shelf", approved: true, aiScore: 88, notes: "12 facing" },
  { id: 3, date: "2026-05-02", time: "10:30", client: "Salom Magazin №1", agent: "Babadjanova N.", category: "promo", approved: true, aiScore: 95 },
  { id: 4, date: "2026-05-02", time: "11:32", client: "Bona Магазин", agent: "Berdiyev R.", category: "shelf", approved: true, aiScore: 76, notes: "Facing past" },
  { id: 5, date: "2026-05-02", time: "11:35", client: "Bona Магазин", agent: "Berdiyev R.", category: "competitor", approved: true, aiScore: 84, notes: "Pepsi 14 facing" },
  { id: 6, date: "2026-05-01", time: "14:15", client: "Дастархон Сервис", agent: "Sayitqulov M.", category: "facade", approved: true, aiScore: 96 },
  { id: 7, date: "2026-05-01", time: "14:18", client: "Дастархон Сервис", agent: "Sayitqulov M.", category: "shelf", approved: true, aiScore: 94 },
  { id: 8, date: "2026-05-01", time: "14:20", client: "Дастархон Сервис", agent: "Sayitqulov M.", category: "facing", approved: true, aiScore: 92 },
  { id: 9, date: "2026-05-01", time: "16:10", client: "Гулямов Маркет", agent: "ДАВЛАТ", category: "issue", approved: false, aiScore: 42, notes: "Polkada chang, foto past sifat" },
  { id: 10, date: "2026-05-01", time: "16:12", client: "Гулямов Маркет", agent: "ДАВЛАТ", category: "shelf", approved: false, aiScore: 38, notes: "Yetarli ko'rinmaydi" },
  { id: 11, date: "2026-04-30", time: "10:25", client: "Турсун Ake Магазин", agent: "BORIEV M.", category: "facade", approved: true, aiScore: 90 },
  { id: 12, date: "2026-04-30", time: "10:28", client: "Турсун Ake Магазин", agent: "BORIEV M.", category: "shelf", approved: true, aiScore: 86 },
]

const CATEGORIES = [
  { key: "shelf", label: "Polka", color: "bg-emerald-500" },
  { key: "facade", label: "Tashqi ko'rinish", color: "bg-blue-500" },
  { key: "facing", label: "Facing", color: "bg-violet-500" },
  { key: "promo", label: "Promo POS", color: "bg-amber-500" },
  { key: "competitor", label: "Raqobat", color: "bg-rose-500" },
  { key: "issue", label: "Muammo", color: "bg-slate-500" },
]

const CATEGORY_LABEL: Record<string, string> = {
  shelf: "🛍️ Polka", facade: "🏪 Tashqi", facing: "📊 Facing",
  promo: "🎁 Promo", competitor: "👀 Raqobat", issue: "⚠️ Muammo",
}

export default function PhotoGalleryPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [approvedFilter, setApprovedFilter] = useState<string>("all")

  const filtered = PHOTOS
    .filter(p => categoryFilter === "all" || p.category === categoryFilter)
    .filter(p => approvedFilter === "all" || (approvedFilter === "yes" ? p.approved : !p.approved))
    .filter(p => !search || p.client.toLowerCase().includes(search.toLowerCase()) || p.agent.toLowerCase().includes(search.toLowerCase()))

  const approvedCount = PHOTOS.filter(p => p.approved).length
  const avgScore = Math.round(PHOTOS.reduce((s, p) => s + p.aiScore, 0) / PHOTOS.length)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Camera className="w-7 h-7 text-blue-600" />
              Foto galereya
            </h1>
            <p className="text-sm text-slate-500">{PHOTOS.length} foto · AI-score o'rta {avgScore}/100 · {approvedCount} tasdiqlangan</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> ZIP yuklab olish</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <button onClick={() => setCategoryFilter("all")} className={`p-3 rounded-lg border-2 transition-all ${categoryFilter === "all" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">Hammasi</div>
            <div className="text-2xl font-bold mt-1">{PHOTOS.length}</div>
          </button>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategoryFilter(c.key)} className={`p-3 rounded-lg border-2 transition-all ${categoryFilter === c.key ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-1 mb-1">
                <span className={`w-2 h-2 rounded-full ${c.color}`} />
                <span className="text-xs font-bold">{c.label}</span>
              </div>
              <div className="text-xl font-bold">{PHOTOS.filter(p => p.category === c.key).length}</div>
            </button>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={approvedFilter} onChange={e => setApprovedFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="all">Hammasi</option>
              <option value="yes">✓ Tasdiqlangan</option>
              <option value="no">✕ Rad etilgan</option>
            </select>
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient yoki agent..." className="pl-9 w-64" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map(p => {
            const cat = CATEGORIES.find(c => c.key === p.category)!
            return (
              <Card key={p.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                <div className={`aspect-square relative ${
                  p.category === "shelf" ? "bg-gradient-to-br from-emerald-300 to-emerald-500" :
                  p.category === "facade" ? "bg-gradient-to-br from-blue-300 to-blue-500" :
                  p.category === "facing" ? "bg-gradient-to-br from-violet-300 to-violet-500" :
                  p.category === "promo" ? "bg-gradient-to-br from-amber-300 to-amber-500" :
                  p.category === "competitor" ? "bg-gradient-to-br from-rose-300 to-rose-500" :
                  "bg-gradient-to-br from-slate-300 to-slate-500"
                } flex items-center justify-center`}>
                  <Camera className="w-12 h-12 text-white/40" />
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/90 font-bold ${cat.color.replace("bg-", "text-")}`}>
                      {CATEGORY_LABEL[p.category]}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.aiScore >= 80 ? "bg-emerald-500 text-white" : p.aiScore >= 60 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"}`}>
                      AI: {p.aiScore}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white p-1.5 rounded">
                    <div className="text-[10px] font-bold truncate">{p.client}</div>
                    <div className="text-[9px] opacity-70 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> {p.date} {p.time}
                    </div>
                  </div>
                  {p.approved && <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold opacity-0 group-hover:opacity-100">✓</div>}
                  {!p.approved && <div className="absolute inset-0 bg-rose-500/20 border-4 border-rose-500" />}
                </div>
                <div className="p-2">
                  <div className="text-xs text-slate-600 truncate">{p.agent}</div>
                  {p.notes && <div className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">{p.notes}</div>}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
