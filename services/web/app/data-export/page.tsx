"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Download, FileText, Calendar, Package, Users, ShoppingCart,
  BarChart3, Warehouse, AlertCircle, Check,
} from "lucide-react"

type Endpoint = {
  key: string; label: string; icon: typeof Package
  url: (dan?: string, gacha?: string) => string
  filename: string
}

const EXPORT_TYPES: Endpoint[] = [
  {
    key: "products", label: "Tovarlar", icon: Package,
    url: () => "/api/v1/tovar/export/excel",
    filename: "tovarlar.xlsx",
  },
  {
    key: "sklad", label: "Sklad qog'ozi", icon: Warehouse,
    url: () => "/api/v1/sklad-qogozi/excel",
    filename: "sklad_qogozi.xlsx",
  },
  {
    key: "orders", label: "Buyurtmalar (Реестр)", icon: ShoppingCart,
    url: (dan, gacha) => `/api/v1/savdolar/excel?sana_dan=${dan || ""}&sana_gacha=${gacha || ""}`,
    filename: "reestr.xlsx",
  },
  {
    key: "sales_detail", label: "Sotuv detail", icon: BarChart3,
    url: (dan, gacha) => `/api/v1/reports/sales-detail/excel?sana_dan=${dan || ""}&sana_gacha=${gacha || ""}`,
    filename: "sotuv_detail.xlsx",
  },
  {
    key: "ombor_prognoz", label: "Ombor prognoz", icon: Package,
    url: () => "/api/v1/ombor/prognoz/excel?kunlar=30",
    filename: "ombor_prognoz.xlsx",
  },
  {
    key: "clients", label: "Mijozlar", icon: Users,
    url: () => "/export/klientlar?fmt=excel",
    filename: "klientlar.xlsx",
  },
]

export default function DataExportPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(0)

  const toggle = (key: string) => {
    setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key])
  }

  async function handleExport() {
    if (selected.length === 0) return
    setDownloading(true); setError(""); setDone(0)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      for (const key of selected) {
        const ep = EXPORT_TYPES.find(e => e.key === key)
        if (!ep) continue
        const res = await fetch(`${base}${ep.url(dateFrom, dateTo)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`${ep.label}: HTTP ${res.status}`)
        const ct = res.headers.get("Content-Type") || ""
        let blob: Blob
        let name = ep.filename
        if (ct.includes("json")) {
          const result = await res.json()
          if (result.content_base64) {
            const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
            blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            name = result.filename || name
          } else {
            throw new Error(`${ep.label}: invalid response`)
          }
        } else {
          blob = await res.blob()
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url; a.download = name; a.click()
        URL.revokeObjectURL(url)
        setDone(d => d + 1)
        // small delay between downloads so browser doesn't block
        await new Promise(r => setTimeout(r, 300))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDownloading(false)
    }
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
          <h2 className="font-bold mb-3">Eksport qilinadigan hujjatlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EXPORT_TYPES.map(t => (
              <label key={t.key}
                     className={`bg-card rounded-xl border-2 p-4 hover:shadow-md cursor-pointer transition ${selected.includes(t.key) ? "border-emerald-500" : "border-border"}`}>
                <div className="flex items-start justify-between mb-2">
                  <t.icon className="w-6 h-6 text-emerald-600" />
                  <input type="checkbox" checked={selected.includes(t.key)}
                         onChange={() => toggle(t.key)} className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.filename}</div>
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}
        {downloading && done > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {done} / {selected.length} ta hujjat yuklab olindi...
          </div>
        )}

        <Button
          className="w-full h-12 text-base"
          disabled={selected.length === 0 || downloading}
          onClick={handleExport}
        >
          <Download className="w-5 h-5 mr-2" />
          {downloading
            ? `Yuklab olinmoqda... ${done}/${selected.length}`
            : `${selected.length} ta hujjatni yuklab olish`}
        </Button>
      </div>
    </AdminLayout>
  )
}
