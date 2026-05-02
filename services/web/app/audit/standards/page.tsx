"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Pencil, Trash2, ListChecks, GripVertical, Search } from "lucide-react"
import Link from "next/link"

type Standard = {
  id: number; category: string; question: string; weight: number; type: "yes_no" | "rating_5" | "photo" | "number"; required: boolean; active: boolean;
}

const STANDARDS: Standard[] = [
  { id: 1, category: "Foto-hisobot", question: "Magazin oldidan tashqi ko'rinish foto", weight: 10, type: "photo", required: true, active: true },
  { id: 2, category: "Foto-hisobot", question: "Tovar polkasining foto", weight: 15, type: "photo", required: true, active: true },
  { id: 3, category: "Mavjudlik", question: "Top-10 SKU mavjudmi?", weight: 25, type: "yes_no", required: true, active: true },
  { id: 4, category: "Mavjudlik", question: "Promo tovar mavjudmi?", weight: 10, type: "yes_no", required: true, active: true },
  { id: 5, category: "Facing", question: "Bizning tovarlar nechta facingda?", weight: 15, type: "number", required: true, active: true },
  { id: 6, category: "Facing", question: "Polka holati 1-5 (yomon-mukammal)", weight: 10, type: "rating_5", required: true, active: true },
  { id: 7, category: "Narx", question: "Bizning tovarlar narxi to'g'rimi?", weight: 5, type: "yes_no", required: false, active: true },
  { id: 8, category: "Tozalik", question: "Magazin tozaligi 1-5", weight: 5, type: "rating_5", required: false, active: true },
  { id: 9, category: "Personal", question: "Sotuvchi xushmuomalami? 1-5", weight: 5, type: "rating_5", required: false, active: false },
]

const TYPE_LABEL: Record<string, string> = {
  yes_no: "Ha/Yo'q",
  rating_5: "1-5 baho",
  photo: "Foto",
  number: "Raqam",
}
const TYPE_COLOR: Record<string, string> = {
  yes_no: "bg-blue-50 text-blue-700",
  rating_5: "bg-purple-50 text-purple-700",
  photo: "bg-emerald-50 text-emerald-700",
  number: "bg-[#FCE9DD] text-[#D97706]",
}

export default function AuditStandardsPage() {
  const [standards] = useState(STANDARDS)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const categories = Array.from(new Set(standards.map(s => s.category)))
  const filtered = standards
    .filter(s => categoryFilter === "all" || s.category === categoryFilter)
    .filter(s => !search || s.question.toLowerCase().includes(search.toLowerCase()))

  const totalWeight = standards.filter(s => s.active).reduce((sum, s) => sum + s.weight, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1400px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Audit <span className="italic text-[#C75D3C]">standartlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{standards.filter(s => s.active).length} faol savol · jami og'irlik <span className="font-medium text-[#1A1A1A]">{totalWeight}%</span></p>
            </div>
            <Button className="gap-1" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi standart</Button>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setCategoryFilter("all")} className={`px-3 py-2 rounded-md text-xs font-medium ${categoryFilter === "all" ? "bg-[#C75D3C] text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}>
                Hammasi <span className="opacity-70 ml-1">{standards.length}</span>
              </button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-2 rounded-md text-xs font-medium ${categoryFilter === c ? "bg-[#C75D3C] text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}>
                  {c} <span className="opacity-70 ml-1">{standards.filter(s => s.category === c).length}</span>
                </button>
              ))}
              <div className="ml-auto relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Standart..." className="pl-9 w-64 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <ListChecks className="w-5 h-5 text-[#C75D3C]" />
              Standartlar ro'yxati
            </h2>

            <div className="space-y-2">
              {filtered.map(s => (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${s.active ? "bg-white border-[#E8E0D3]" : "bg-[#FAF7F2] border-[#E8E0D3] opacity-60"}`}>
                  <GripVertical className="w-4 h-4 text-[#9C8A6E] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D] font-mono">#{s.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#FCE9DD] text-[#C75D3C] font-medium">{s.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLOR[s.type]}`}>{TYPE_LABEL[s.type]}</span>
                      {s.required && <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C] font-medium">★ Majburiy</span>}
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{s.question}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Og'irlik</div>
                    <div className="text-lg font-medium font-mono text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.weight}%</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button className="p-2 text-[#C75D3C] hover:bg-[#FCE9DD] rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E0D3] flex items-center justify-between">
              <span className="text-sm text-[#6B5B4D]">Jami: {filtered.length} ta standart</span>
              <span className="text-sm">Total weight: <span className={`font-mono font-medium ${totalWeight === 100 ? "text-emerald-700" : "text-[#D97706]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{totalWeight}%</span> {totalWeight !== 100 && <span className="text-xs text-[#C75D3C] ml-2">⚠ 100%dan farq qiladi</span>}</span>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
