"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, BookOpen, Search, FileText, Video, HelpCircle, Sparkles, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"

const ARTICLES = [
  { id: 1, title: "Yangi tovar qo'shish", category: "Boshlang'ich", icon: FileText, color: "emerald", views: 1248, time: "3 daqiqa" },
  { id: 2, title: "Klient bilan ishlash", category: "Boshlang'ich", icon: FileText, color: "emerald", views: 856, time: "5 daqiqa" },
  { id: 3, title: "Zakaz qabul qilish", category: "Boshlang'ich", icon: FileText, color: "emerald", views: 1842, time: "4 daqiqa" },
  { id: 4, title: "Sklad qoldiq tekshirish", category: "Sklad", icon: FileText, color: "blue", views: 612, time: "6 daqiqa" },
  { id: 5, title: "Inventarizatsiya o'tkazish", category: "Sklad", icon: FileText, color: "blue", views: 384, time: "8 daqiqa" },
  { id: 6, title: "P&L hisobotini tushunish", category: "Hisobot", icon: FileText, color: "violet", views: 248, time: "12 daqiqa" },
  { id: 7, title: "RFM segmentatsiya", category: "Hisobot", icon: FileText, color: "violet", views: 124, time: "15 daqiqa" },
  { id: 8, title: "Voice komandalari (AI)", category: "Maxsus", icon: Sparkles, color: "amber", views: 2480, time: "10 daqiqa" },
  { id: 9, title: "Telegram bot qanday ishlaydi", category: "Maxsus", icon: Video, color: "amber", views: 1248, time: "7 daqiqa" },
  { id: 10, title: "Mobil ilova boshqarish", category: "Mobil", icon: FileText, color: "rose", views: 642, time: "5 daqiqa" },
  { id: 11, title: "Foto-hisobot yuborish", category: "Mobil", icon: Video, color: "rose", views: 386, time: "3 daqiqa" },
  { id: 12, title: "Tez-tez beriladigan savollar (FAQ)", category: "Yordam", icon: HelpCircle, color: "cyan", views: 4280, time: "—" },
]

const CATEGORIES = ["Boshlang'ich", "Sklad", "Hisobot", "Maxsus", "Mobil", "Yordam"]

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState<string | null>(null)

  const filtered = ARTICLES.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCat || a.category === activeCat
    return matchSearch && matchCat
  })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Bilim bazasi</h1>
            <p className="text-base text-slate-500 mt-1">{ARTICLES.length} ta maqola · {ARTICLES.reduce((s, a) => s + a.views, 0).toLocaleString()} ko'rilgan</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi maqola</Button>
        </div>

        <Card className="p-5 bg-gradient-to-r from-emerald-50 via-blue-50 to-violet-50 border-2 border-emerald-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-600 bg-white p-2 rounded-xl shadow-sm" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Tezkor qidiruv</h2>
              <p className="text-xs text-slate-600">"Klient", "Sotuv", "Sklad" — istalgan so'z</p>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mavzu qidiring..." className="pl-12 h-12 text-base" />
          </div>
        </Card>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCat(null)} className={`px-4 py-2 text-sm font-semibold rounded-lg ${!activeCat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            Hammasi ({ARTICLES.length})
          </button>
          {CATEGORIES.map(c => {
            const count = ARTICLES.filter(a => a.category === c).length
            return (
              <button key={c} onClick={() => setActiveCat(c)} className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeCat === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {c} ({count})
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const Icon = a.icon
            return (
              <Card key={a.id} className={`p-5 hover:shadow-lg transition-all cursor-pointer group bg-${a.color}-50/30 border-2 border-${a.color}-200`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${a.color}-100 text-${a.color}-700 flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold bg-${a.color}-200 text-${a.color}-800`}>{a.category}</span>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{a.title}</h3>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{a.views.toLocaleString()} ko'rilgan</span>
                  <span>{a.time}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-end">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    O'qish <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
