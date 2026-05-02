"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, FileText, Upload, Search, Download, Trash2, Eye, FileImage, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const DOCS = [
  { id: 1, name: "Договор поставки 2026.pdf", type: "pdf", size: "2.4 MB", uploaded: "2026-01-15", category: "Контракт" },
  { id: 2, name: "Свидетельство о регистрации.pdf", type: "pdf", size: "840 KB", uploaded: "2024-03-12", category: "Регистрация" },
  { id: 3, name: "Лицензия на торговлю.jpg", type: "image", size: "1.2 MB", uploaded: "2025-06-20", category: "Лицензия" },
  { id: 4, name: "Sertifikat sifati 2026.pdf", type: "pdf", size: "1.6 MB", uploaded: "2026-04-10", category: "Сертификат" },
  { id: 5, name: "Banka rekvizitlari.pdf", type: "pdf", size: "120 KB", uploaded: "2025-09-15", category: "Банк" },
  { id: 6, name: "Pasport asoschisining.jpg", type: "image", size: "3.1 MB", uploaded: "2024-03-12", category: "Паспорт" },
  { id: 7, name: "Akt sverki Apr 2026.xlsx", type: "excel", size: "184 KB", uploaded: "2026-04-30", category: "Акт сверки" },
  { id: 8, name: "Foto magazin tashqi ko'rinish.jpg", type: "image", size: "2.8 MB", uploaded: "2025-11-12", category: "Foto" },
]

const ICONS = { pdf: FileText, image: FileImage, excel: FileSpreadsheet }
const COLORS = { pdf: "rose", image: "blue", excel: "emerald" }

export default function ClientDocsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(DOCS.map(d => d.category)))
  const filtered = DOCS.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCategory || d.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Klient hujjatlari · #{id}</h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · {DOCS.length} ta hujjat saqlangan</p>
          </div>
          <Button className="gap-2" onClick={() => toast.success("Hujjat yuklash dialog ochildi")}>
            <Upload className="w-4 h-4" /> Yuklash
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hujjat..." className="pl-9" />
            </div>
            <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 text-xs font-semibold rounded ${!activeCategory ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
              Hammasi ({DOCS.length})
            </button>
            {categories.map(c => {
              const count = DOCS.filter(d => d.category === c).length
              return (
                <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-xs font-semibold rounded ${activeCategory === c ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
                  {c} ({count})
                </button>
              )
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(d => {
            const Icon = ICONS[d.type as keyof typeof ICONS] || FileText
            const color = COLORS[d.type as keyof typeof COLORS] || "slate"
            return (
              <Card key={d.id} className={`p-4 border-2 transition-all hover:shadow-md group bg-${color}-50/30 border-${color}-200`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${color}-100 text-${color}-700 flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{d.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{d.size} · {d.uploaded}</p>
                    <span className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded font-bold bg-${color}-200 text-${color}-800`}>
                      {d.category}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-end gap-1">
                  <button onClick={() => toast.info("Ko'rish...")} className="p-1.5 hover:bg-blue-100 rounded text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => toast.success("Yuklab olinmoqda")} className="p-1.5 hover:bg-emerald-100 rounded text-emerald-600">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => toast.error("O'chirildi")} className="p-1.5 hover:bg-rose-100 rounded text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5 border-2 border-dashed border-slate-300 hover:border-emerald-400 transition-colors text-center cursor-pointer">
          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-700">Hujjat yuklash uchun bosing yoki shu yerga sudrang</p>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, XLSX · max 10MB / fayl</p>
        </Card>
      </div>
    </AdminLayout>
  )
}
