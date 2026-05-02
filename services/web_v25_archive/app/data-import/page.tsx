"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, Check, AlertCircle, Package, Users, ShoppingCart, CreditCard } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const IMPORT_TYPES = [
  { key: "products",  label: "Tovarlar", icon: Package, format: "Excel/CSV", desc: "Tovar bazasi import" },
  { key: "clients",   label: "Mijozlar", icon: Users, format: "Excel/CSV", desc: "Mijoz bazasi import" },
  { key: "orders",    label: "Buyurtmalar", icon: ShoppingCart, format: "Excel", desc: "Eski buyurtmalar import" },
  { key: "prices",    label: "Narxlar", icon: CreditCard, format: "Excel", desc: "Narx ro'yxati import" },
]

export default function DataImportPage() {
  const [selectedType, setSelectedType] = useState("products")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={Upload}
          gradient="blue"
          title="Import"
          subtitle="Excel/CSV fayllardan ma'lumot yuklash"
        />
        </div>

        {/* Type Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMPORT_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`bg-card rounded-xl border-2 p-4 hover:shadow-md transition ${selectedType === t.key ? "border-emerald-500" : ""}`}
            >
              <t.icon className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <div className="font-bold">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.format}</div>
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Fayl yuklash</h2>

          <div className="border-2 border-dashed rounded-xl p-10 text-center hover:border-emerald-500 transition cursor-pointer">
            <input type="file" accept=".xlsx,.csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              {file ? (
                <div>
                  <div className="font-bold">{file.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">Faylni torting yoki bosib tanlang</div>
                  <div className="text-xs text-muted-foreground mt-1">Excel (.xlsx) yoki CSV formatida</div>
                </div>
              )}
            </label>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-1" /> Shablon yuklab olish
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={!file}>
              <Upload className="w-4 h-4 mr-1" /> Import qilish
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <div className="font-bold mb-2">Import qoidalari:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Birinchi qator — sarlavha bo'lishi kerak</li>
                <li>Majburiy maydonlar to'ldirilgan bo'lishi shart</li>
                <li>Bir vaqtda 5000 tagacha qator</li>
                <li>Shablon faylni yuklab oling — ustunlar moslashtirilgan</li>
                <li>Mavjud yozuvlar yangilanadi (kod yoki nom bo'yicha)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
