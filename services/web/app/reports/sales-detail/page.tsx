"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FileText, Download, AlertCircle, Filter } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type SalesRow = {
  id: number; sana: string; sessiya_id: number;
  tovar_nomi: string; kategoriya?: string; birlik?: string;
  miqdor: number; qaytarilgan: number;
  olish_narxi: number; sotish_narxi: number;
  chegirma_foiz: number; jami: number;
  klient_ismi?: string; foyda: number;
}

type SalesDetailResponse = {
  items: SalesRow[]
  stats: { soni?: number; jami_summa?: number; jami_foyda?: number; jami_miqdor?: number }
  total: number
}

const todayISO    = () => new Date().toISOString().split("T")[0]
const monthAgoISO = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function SalesDetailPage() {
  const [sanaDan, setSanaDan] = useState(monthAgoISO())
  const [sanaGacha, setSanaGacha] = useState(todayISO())
  const [kategoriya, setKategoriya] = useState("")
  const [klient, setKlient] = useState("")
  const [tovar, setTovar] = useState("")
  const [data, setData] = useState<SalesDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const qs = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha, limit: "500" })
      if (kategoriya) qs.set("kategoriya", kategoriya)
      if (klient)     qs.set("klient", klient)
      if (tovar)      qs.set("tovar", tovar)
      const res = await fetch(`${base}/api/v1/reports/sales-detail?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [sanaDan, sanaGacha, kategoriya, klient, tovar])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleExport() {
    setExporting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const qs = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha })
      if (kategoriya) qs.set("kategoriya", kategoriya)
      const res = await fetch(`${base}/api/v1/reports/sales-detail/excel?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Export xatoligi")
      const result = await res.json()
      const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = result.filename || "sales-detail.xlsx"; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  const stats = data?.stats || {}

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" /> Sotuv detail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Har bir sotuv qatori — foyda hisob-kitobi bilan (SalesDoc-style)
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Filter className="w-4 h-4 text-muted-foreground" /> Filtrlar
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Sana dan</label>
              <Input type="date" value={sanaDan} onChange={e => setSanaDan(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Sana gacha</label>
              <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Kategoriya</label>
              <Input placeholder="Barchasi" value={kategoriya} onChange={e => setKategoriya(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mijoz</label>
              <Input placeholder="Ismi bo'yicha" value={klient} onChange={e => setKlient(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tovar</label>
              <Input placeholder="Nomi bo'yicha" value={tovar} onChange={e => setTovar(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={fetchData} size="sm" disabled={loading}>
              {loading ? "Yuklanmoqda..." : "Qidirish"}
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline" disabled={exporting}>
              <Download className="w-4 h-4 mr-1" /> {exporting ? "..." : "Excel"}
            </Button>
            <Button
              size="sm" variant="ghost"
              onClick={() => { setKategoriya(""); setKlient(""); setTovar("") }}
            >
              Tozalash
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Qatorlar</div>
            <div className="text-2xl font-bold mt-1">{Number(stats.soni || 0).toLocaleString()}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami miqdor</div>
            <div className="text-2xl font-bold mt-1">{Number(stats.jami_miqdor || 0).toLocaleString()}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami summa</div>
            <div className="text-xl font-bold mt-1 text-emerald-600">
              {formatCurrency(Number(stats.jami_summa || 0))}
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami foyda</div>
            <div className={`text-xl font-bold mt-1 ${Number(stats.jami_foyda || 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatCurrency(Number(stats.jami_foyda || 0))}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Margin: {Number(stats.jami_summa) > 0
                ? ((Number(stats.jami_foyda || 0) / Number(stats.jami_summa)) * 100).toFixed(1)
                : "0"}%
            </div>
          </div>
        </div>

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && data && (
          <div className="bg-card border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Tovar</TableHead>
                  <TableHead className="hidden md:table-cell">Kategoriya</TableHead>
                  <TableHead className="text-right">Miqdor</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Olish</TableHead>
                  <TableHead className="text-right">Sotish</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Cheg%</TableHead>
                  <TableHead className="text-right">Jami</TableHead>
                  <TableHead className="text-right">Foyda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                      Ma&apos;lumot topilmadi
                    </TableCell>
                  </TableRow>
                ) : data.items.map((r, i) => {
                  const foyda = Number(r.foyda || 0)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(r.sana).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell className="text-sm">{r.klient_ismi || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{r.tovar_nomi}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {r.kategoriya || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {Number(r.miqdor).toFixed(0)} {r.birlik || ""}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs hidden lg:table-cell text-muted-foreground">
                        {formatCurrency(Number(r.olish_narxi))}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(Number(r.sotish_narxi))}
                      </TableCell>
                      <TableCell className="text-center text-xs hidden lg:table-cell">
                        {Number(r.chegirma_foiz) > 0 ? `${r.chegirma_foiz}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">
                        {formatCurrency(Number(r.jami))}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${foyda >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatCurrency(foyda)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {data.items.length === 500 && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t">
                Faqat birinchi 500 qator ko&apos;rsatilgan. To&apos;liq ma&apos;lumot uchun Excel export oling.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
