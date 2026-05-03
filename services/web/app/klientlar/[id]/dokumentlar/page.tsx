"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, FileText, Upload, Search, Download, Trash2, Eye, FileImage, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

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
const TYPE_STYLE: Record<string, { iconBg: string; iconColor: string; chip: string }> = {
  pdf: { iconBg: "#F5E5D6", iconColor: "#C75D3C", chip: "bg-[#F5E5D6] text-[#C75D3C]" },
  image: { iconBg: "#EFF6FF", iconColor: "#1D4ED8", chip: "bg-blue-50 text-blue-700" },
  excel: { iconBg: "#ECFDF5", iconColor: "#047857", chip: "bg-emerald-50 text-emerald-700" },
}

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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient <span className="italic text-[#C75D3C]">hujjatlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · {DOCS.length} ta hujjat saqlangan</p>
            </div>
            <Button className="gap-2 text-white" style={{ background: "#C75D3C" }} onClick={() => toast.success("Hujjat yuklash dialog ochildi")}>
              <Upload className="w-4 h-4" /> Yuklash
            </Button>
          </div>

          <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hujjat..." className="pl-9 border-[#E8E0D3]" />
              </div>
              <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${!activeCategory ? "bg-[#1A1A1A] text-white" : "bg-[#F0EAE0] text-[#6B5B4D]"}`}>
                Hammasi ({DOCS.length})
              </button>
              {categories.map(c => {
                const count = DOCS.filter(d => d.category === c).length
                return (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeCategory === c ? "bg-[#1A1A1A] text-white" : "bg-[#F0EAE0] text-[#6B5B4D]"}`}>
                    {c} ({count})
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(d => {
              const Icon = ICONS[d.type as keyof typeof ICONS] || FileText
              const style = TYPE_STYLE[d.type] || TYPE_STYLE.pdf
              return (
                <Card key={d.id} className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: style.iconBg }}>
                      <Icon className="w-6 h-6" style={{ color: style.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1A1A1A] truncate">{d.name}</h3>
                      <p className="text-xs text-[#9C8A6E] mt-1">{d.size} · {d.uploaded}</p>
                      <span className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${style.chip}`}>
                        {d.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F0EAE0] flex justify-end gap-1">
                    <button onClick={() => toast.info("Ko'rish...")} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => toast.success("Yuklab olinmoqda")} className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => toast.error("O'chirildi")} className="p-1.5 hover:bg-[#F5E5D6] rounded" style={{ color: "#C75D3C" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-5 bg-white border border-dashed border-[#E8E0D3] hover:border-[#C75D3C] transition-colors text-center cursor-pointer rounded-2xl">
            <Upload className="w-10 h-10 mx-auto text-[#9C8A6E] mb-2" />
            <p className="font-medium text-[#1A1A1A]">Hujjat yuklash uchun bosing yoki shu yerga sudrang</p>
            <p className="text-xs text-[#9C8A6E] mt-1">PDF, JPG, PNG, XLSX · max 10MB / fayl</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
