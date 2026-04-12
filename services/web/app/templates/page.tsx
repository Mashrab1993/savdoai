"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Copy, Plus, Receipt, FileBarChart, Truck, FileCheck } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const TEMPLATES = [
  { id: 1, nomi: "Faktura (A4)", turi: "faktura", icon: Receipt, format: "PDF", category: "moliyaviy" },
  { id: 2, nomi: "Nakladnoy", turi: "nakladnoy", icon: Truck, format: "PDF", category: "moliyaviy" },
  { id: 3, nomi: "Schyot-faktura", turi: "schyot", icon: Receipt, format: "PDF", category: "moliyaviy" },
  { id: 4, nomi: "Akt sverka", turi: "sverka", icon: FileCheck, format: "Excel", category: "hisobot" },
  { id: 5, nomi: "Prays-list (opt)", turi: "prays_opt", icon: FileText, format: "PDF/Excel", category: "narx" },
  { id: 6, nomi: "Prays-list (roznitsa)", turi: "prays_roz", icon: FileText, format: "PDF/Excel", category: "narx" },
  { id: 7, nomi: "Kunlik hisobot", turi: "report_daily", icon: FileBarChart, format: "PDF/Excel", category: "hisobot" },
  { id: 8, nomi: "Oylik hisobot", turi: "report_monthly", icon: FileBarChart, format: "PDF/Excel", category: "hisobot" },
  { id: 9, nomi: "Tovar shabloni (import)", turi: "tovar_import", icon: FileText, format: "Excel", category: "import" },
  { id: 10, nomi: "Mijoz shabloni (import)", turi: "klient_import", icon: FileText, format: "Excel", category: "import" },
]

const CATEGORIES = [
  { key: "all", label: "Barchasi" },
  { key: "moliyaviy", label: "Moliyaviy" },
  { key: "hisobot", label: "Hisobotlar" },
  { key: "narx", label: "Narxlar" },
  { key: "import", label: "Import" },
]

export default function TemplatesPage() {
  const [filter, setFilter] = useState("all")
  const filtered = filter === "all" ? TEMPLATES : TEMPLATES.filter(t => t.category === filter)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-7 h-7 text-emerald-600" />
              Hujjat shablonlari
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Faktura, nakladnoy, hisobot va prays-list shablonlari</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi shablon
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === c.key ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground hover:bg-muted"}`}
            >{c.label}</button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <t.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <Badge variant="secondary" className="text-xs">{t.format}</Badge>
              </div>
              <div className="font-bold mb-1">{t.nomi}</div>
              <div className="text-xs text-muted-foreground mb-3">Kategoriya: {t.category}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1"><Eye className="w-3 h-3 mr-1" /> Ko'rish</Button>
                <Button variant="outline" size="sm"><Download className="w-3 h-3" /></Button>
                <Button variant="outline" size="sm"><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
