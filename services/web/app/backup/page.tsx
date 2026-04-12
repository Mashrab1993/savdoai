"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, Download, Upload, Calendar, Check, FileText, ShieldCheck } from "lucide-react"
import { HardDrive } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const BACKUP_GROUPS = [
  { key: "tovarlar", label: "Tovarlar va kategoriyalar", required: true, count: 8 },
  { key: "narxlar", label: "Narxlar va aksiyalar", required: true, count: 4 },
  { key: "xodimlar", label: "Foydalanuvchilar (agent, expeditor)", required: true, count: 3 },
  { key: "mijozlar", label: "Mijozlar va kategoriyalar", required: true, count: 5 },
  { key: "buyurtmalar", label: "Buyurtmalar va detallar", required: true, count: 9 },
  { key: "skladlar", label: "Skladlar va qoldiqlar", required: true, count: 4 },
  { key: "kirimlar", label: "Kirimlar va detallar", required: true, count: 3 },
  { key: "qaytarishlar", label: "Vozvrat va spisanie", required: true, count: 4 },
]

export default function BackupPage() {
  const [selected, setSelected] = useState<string[]>(BACKUP_GROUPS.map(g => g.key))
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [format, setFormat] = useState<"excel" | "csv">("excel")

  const toggle = (key: string) => {
    setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key])
  }

  const totalTables = BACKUP_GROUPS.filter(g => selected.includes(g.key)).reduce((s, g) => s + g.count, 0)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={HardDrive}
          gradient="violet"
          title="Zaxira nusxa"
          subtitle="Ma'lumotlarni Excel/CSV formatda yuklab olish"
        />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Jami guruhlar</div>
            <div className="text-2xl font-bold mt-1">{BACKUP_GROUPS.length}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600">Tanlangan</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{selected.length}</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-600">Jadvallar soni</div>
            <div className="text-2xl font-bold mt-1 text-blue-700">{totalTables}</div>
          </div>
        </div>

        {/* Backup Groups */}
        <div className="bg-card rounded-xl border p-4">
          <h2 className="font-bold mb-3">Ma'lumot guruhlari</h2>
          <div className="space-y-2">
            {BACKUP_GROUPS.map(g => (
              <label key={g.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(g.key)}
                    onChange={() => toggle(g.key)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-sm">{g.label}</div>
                    <div className="text-xs text-muted-foreground">{g.count} ta jadval</div>
                  </div>
                </div>
                {g.required && <Badge className="bg-rose-500/15 text-rose-800 dark:text-rose-300 text-xs">Majburiy</Badge>}
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <h2 className="font-bold">Davr (ixtiyoriy)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Sana dan</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Sana gacha</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="bg-card rounded-xl border p-4">
          <h2 className="font-bold mb-3">Format</h2>
          <div className="flex gap-3">
            <button onClick={() => setFormat("excel")} className={`flex-1 p-4 border rounded-lg ${format === "excel" ? "border-emerald-500 bg-emerald-50" : ""}`}>
              <FileText className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <div className="font-bold">Excel (.xlsx)</div>
              <div className="text-xs text-muted-foreground">SalesDoc/import uchun</div>
            </button>
            <button onClick={() => setFormat("csv")} className={`flex-1 p-4 border rounded-lg ${format === "csv" ? "border-emerald-500 bg-emerald-50" : ""}`}>
              <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="font-bold">CSV</div>
              <div className="text-xs text-muted-foreground">Universal format</div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={selected.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Backup yuklab olish
          </Button>
          <Button variant="outline" className="flex-1">
            <Upload className="w-4 h-4 mr-2" /> Backup'dan tiklash
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <div className="font-bold mb-1">Ma'lumot xavfsizligi</div>
              <div>Backup avtomatik shifrlash bilan saqlanadi. Faqat siz tiklash kalitiga egasiz.</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
