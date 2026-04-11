"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, Check, Package, Users, ShoppingCart, BarChart3 } from "lucide-react"

const EXPORT_TYPES = [
  { key: "products",  label: "Tovarlar", icon: Package, count: "0 ta" },
  { key: "clients",   label: "Mijozlar", icon: Users, count: "0 ta" },
  { key: "orders",    label: "Buyurtmalar", icon: ShoppingCart, count: "0 ta" },
  { key: "sales",     label: "Sotuvlar", icon: BarChart3, count: "0 ta" },
  { key: "debts",     label: "Qarzlar", icon: BarChart3, count: "0 ta" },
  { key: "expenses",  label: "Xarajatlar", icon: BarChart3, count: "0 ta" },
]

export default function DataExportPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [format, setFormat] = useState<"excel" | "csv" | "pdf">("excel")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const toggle = (key: string) => {
    setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key])
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Download className="w-7 h-7 text-emerald-600" />
            Ma'lumot eksport
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ma'lumotlarni Excel/CSV/PDF formatda yuklab olish</p>
        </div>

        {/* Type selection */}
        <div>
          <h2 className="font-bold mb-3">Eksport qilinadigan ma'lumotlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EXPORT_TYPES.map(t => (
              <label key={t.key} className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-4 hover:shadow-md cursor-pointer transition ${selected.includes(t.key) ? "border-emerald-500" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <t.icon className="w-6 h-6 text-emerald-600" />
                  <input type="checkbox" checked={selected.includes(t.key)} onChange={() => toggle(t.key)} className="w-4 h-4" />
                </div>
                <div className="font-bold">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.count}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Davr (ixtiyoriy)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        {/* Format */}
        <div>
          <h2 className="font-bold mb-3">Format</h2>
          <div className="grid grid-cols-3 gap-3">
            {["excel", "csv", "pdf"].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f as any)}
                className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-4 hover:shadow-md transition ${format === f ? "border-emerald-500" : ""}`}
              >
                <FileText className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <div className="font-bold uppercase">{f}</div>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base" disabled={selected.length === 0}>
          <Download className="w-5 h-5 mr-2" /> {selected.length} ta ma'lumotni eksport qilish
        </Button>
      </div>
    </AdminLayout>
  )
}
