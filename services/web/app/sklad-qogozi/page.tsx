"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import {
  Warehouse, Download, FileSpreadsheet, Printer, AlertCircle,
  CheckCircle2, TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

type ExportResult = {
  filename: string
  content_base64: string
  soni: number
  jami_ombor_qiymati: number
  jami_bozor_qiymati: number
}

export default function SkladQogoziPage() {
  const [loading, setLoading] = useState(false)
  const [last, setLast] = useState<ExportResult | null>(null)
  const [error, setError] = useState("")

  async function handleGenerate() {
    setLoading(true); setError("")
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/sklad-qogozi/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result: ExportResult = await res.json()
      setLast(result)
      // Download
      const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement("a")
      a.href      = url
      a.download  = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={Warehouse}
          gradient="amber"
          title="Sklad qog'ozi"
          subtitle="Ombor inventarizatsiyasi hujjati — to'liq qoldiq + qiymat hisob"
        />

        {/* Description Card */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">Bu hujjat nima?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sklad qog&apos;ozi — omboringizdagi barcha tovarlarning rasmiy ro&apos;yxati.
            Buxgalter, ombor mudiri va boshqaruv uchun ishlatiladi. Ichida:
          </p>
          <ul className="space-y-2 text-sm ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Har bir tovar nomi, kategoriyasi, brendi, shtrix kodi
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Joriy qoldiq va minimum qoldiq
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Olish narxi × qoldiq = <b>ombor qiymati</b>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Sotish narxi × qoldiq = <b>bozor qiymati</b>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Tugagan tovarlar qizil, kam qolgani sariq rangda
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Ombor mudiri va buxgalter imzo joyi
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Avtomatik JAMI hisoblash
            </li>
          </ul>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold">Hujjatni yuklab olish</h3>
              <p className="text-sm opacity-90 mt-1">
                Hozirgi holat bo&apos;yicha Excel fayli generatsiya qilinadi
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="secondary"
              size="lg"
              className="bg-card text-emerald-600 hover:bg-emerald-50"
            >
              {loading ? (
                <><div className="animate-spin h-4 w-4 border-b-2 border-emerald-600 rounded-full mr-2" /> Yaratilmoqda...</>
              ) : (
                <><FileSpreadsheet className="w-5 h-5 mr-2" /> Excel yuklab olish</>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {last && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold">Muvaffaqiyatli yaratildi!</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Tovarlar soni</div>
                <div className="text-xl font-bold mt-1">{last.soni}</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Ombor qiymati</div>
                <div className="text-xl font-bold mt-1 text-emerald-600">
                  {formatCurrency(last.jami_ombor_qiymati)}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Bozor qiymati</div>
                <div className="text-xl font-bold mt-1 text-sky-600">
                  {formatCurrency(last.jami_bozor_qiymati)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <TrendingUp className="w-4 h-4" />
              <span>
                Potentsial foyda:
                <b className="ml-1">
                  {formatCurrency(last.jami_bozor_qiymati - last.jami_ombor_qiymati)}
                </b>
                {" "}(+{((last.jami_bozor_qiymati - last.jami_ombor_qiymati) / (last.jami_ombor_qiymati || 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
          <div className="font-bold mb-1">Maslahat:</div>
          <div>
            Har oy oxirida sklad qog&apos;ozini yuklab oling va arxivlang.
            Inventarizatsiya paytida bu hujjat bilan fizik holat solishtiriladi.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
