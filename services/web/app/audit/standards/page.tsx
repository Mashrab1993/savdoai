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
  yes_no: "bg-blue-100 text-blue-700",
  rating_5: "bg-violet-100 text-violet-700",
  photo: "bg-emerald-100 text-emerald-700",
  number: "bg-amber-100 text-amber-700",
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
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Audit standartlari</h1>
            <p className="text-sm text-slate-500">{standards.filter(s => s.active).length} faol savol · jami og'irlik {totalWeight}%</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi standart</Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setCategoryFilter("all")} className={`px-3 py-2 rounded-md text-xs font-semibold ${categoryFilter === "all" ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>
              Hammasi <span className="opacity-60">{standards.length}</span>
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-2 rounded-md text-xs font-semibold ${categoryFilter === c ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>
                {c} <span className="opacity-60">{standards.filter(s => s.category === c).length}</span>
              </button>
            ))}
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Standart..." className="pl-9 w-64" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-emerald-600" />
            Standartlar ro'yxati
          </h2>

          <div className="space-y-2">
            {filtered.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border ${s.active ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">#{s.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{s.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[s.type]}`}>{TYPE_LABEL[s.type]}</span>
                    {s.required && <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">★ Majburiy</span>}
                  </div>
                  <div className="text-sm font-semibold">{s.question}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500">Og'irlik</div>
                  <div className="text-lg font-bold font-mono text-emerald-700">{s.weight}%</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                  <button className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Jami: {filtered.length} ta standart</span>
            <span className="text-sm font-bold">Total weight: <span className={`font-mono ${totalWeight === 100 ? "text-emerald-700" : "text-amber-700"}`}>{totalWeight}%</span> {totalWeight !== 100 && <span className="text-xs text-rose-600 ml-2">⚠ 100%dan farq qiladi</span>}</span>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
