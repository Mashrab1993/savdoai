"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Filter, Truck, CheckCircle, Clock, X, MoreVertical, Loader2, Printer } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/states"
import { formatCurrency } from "@/lib/utils"
import { api, ApiError } from "@/lib/api"
import { toast } from "sonner"

type SavdoRow = {
  id: number
  klient_ismi?: string
  klient_nomi?: string
  jami: number
  tolangan?: number
  qarz?: number
  sana: string
  holat?: string
  agent_nomi?: string
  ekspeditor_nomi?: string
  tovar_soni?: number
}

type SavdoResp = { total: number; items: SavdoRow[] }

const STATUSES = {
  yangi: { label: "Yangi", color: "bg-blue-100 text-blue-700 border-blue-300", icon: Clock },
  otgruzka: { label: "Otgruzka", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Truck },
  yetkazildi: { label: "Yetkazildi", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: CheckCircle },
  bekor: { label: "Bekor", color: "bg-rose-100 text-rose-700 border-rose-300", icon: X },
} as const

type StatusKey = keyof typeof STATUSES

export default function ZakazlarPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all")
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { data, loading, error } = useApi<SavdoResp>(
    isAuthenticated ? "/api/v1/savdolar?limit=200" : null
  )

  const allOrders: SavdoRow[] = data?.items ?? []
  const filtered = allOrders.filter(o => {
    const status = (o.holat ?? "yangi").toLowerCase()
    if (statusFilter !== "all" && status !== statusFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    const klient = (o.klient_ismi || o.klient_nomi || "").toLowerCase()
    return klient.includes(q) || String(o.id).includes(q)
  })

  const toggleSelect = (id: number) => {
    const newSet = new Set(selected)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelected(newSet)
  }

  const totalSum = filtered.reduce((s, o) => s + Number(o.jami || 0), 0)
  const [exporting, setExporting] = useState(false)

  // Excel export — JSON+base64 javobini blob ga aylantirib yuklash
  // format = "registr" (oddiy) yoki "nakladnoy" (har tovar alohida)
  const downloadExcel = async (selectedOnly: boolean, format: "registr" | "nakladnoy" = "registr") => {
    setExporting(true)
    try {
      const idsParam = selectedOnly && selected.size > 0 ? `?ids=${Array.from(selected).join(",")}` : ""
      const path = format === "nakladnoy"
        ? `/api/v1/savdolar/nakladnoy/excel${idsParam}`
        : `/api/v1/savdolar/excel${idsParam}`
      const resp = await api.get<{ filename: string; content_base64: string }>(path)
      const bin = atob(resp.content_base64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = resp.filename || `zakazlar_${new Date().toISOString().slice(0,10)}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      const tanlangan = selectedOnly && selected.size > 0 ? selected.size : filtered.length
      const formatLabel = format === "nakladnoy" ? "Накладной" : "Реестр"
      toast.success(`${tanlangan} ta zakaz ${formatLabel}'da yuklandi`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const printSelected = () => {
    if (selected.size === 0) return
    // Print-friendly view — yangi tab'da
    const ids = Array.from(selected).join(",")
    window.open(`/zakazlar/print?ids=${ids}`, "_blank")
  }

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zakazlar</h1>
            <p className="text-base text-slate-500 mt-1">
              {filtered.length} ta zakaz · Jami: <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(totalSum)}</span>
              {!isAuthenticated && <span className="ml-2 text-xs text-amber-600">⚠ Login kerak</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sotuv/yangi">
              <Button size="lg">
                <Plus className="w-5 h-5" /> Yangi zakaz
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-3 flex flex-wrap gap-2">
          <StatusTab active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Barchasi ({allOrders.length})
          </StatusTab>
          {(Object.keys(STATUSES) as StatusKey[]).map(key => {
            const count = allOrders.filter(o => (o.holat ?? "yangi").toLowerCase() === key).length
            return (
              <StatusTab key={key} active={statusFilter === key} onClick={() => setStatusFilter(key)}>
                {STATUSES[key].label} ({count})
              </StatusTab>
            )
          })}
        </Card>

        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Klient nomi yoki ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4" /> Qo'shimcha
            </Button>
            <Button variant="outline" onClick={() => downloadExcel(false, "registr")} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Реестр (barcha)
            </Button>
            <Button variant="outline" onClick={() => downloadExcel(false, "nakladnoy")} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Накладной (barcha)
            </Button>
          </div>
        </Card>

        {selected.size > 0 && (
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-emerald-800">
                {selected.size} ta zakaz tanlangan
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => downloadExcel(true, "registr")} disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Реестр ({selected.size})
                </Button>
                <Button variant="outline" onClick={() => downloadExcel(true, "nakladnoy")} disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Накладной ({selected.size})
                </Button>
                <Button variant="outline" onClick={printSelected}>
                  <Printer className="w-4 h-4" /> Pechat
                </Button>
                <button onClick={() => setSelected(new Set())} className="text-sm text-emerald-700 hover:text-emerald-900 underline">
                  Tozalash
                </button>
              </div>
            </div>
          </Card>
        )}

        {loading && <LoadingSkeleton />}
        {error && <ErrorState message={error} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={isAuthenticated ? "Hozircha zakaz yo'q" : "Login kerak"}
            description={isAuthenticated ? "Birinchi zakazingizni yarating." : "Zakaz ro'yxatini ko'rish uchun tizimga kiring."}
            actionLabel={isAuthenticated ? "Yangi zakaz" : "Login"}
            actionHref={isAuthenticated ? "/sotuv/yangi" : "/login"}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 w-12">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id)))}
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">ID</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Sana</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Klient</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Tovar</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Summa</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">To'langan</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Qarz</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((o) => {
                    const statusKey = ((o.holat ?? "yangi").toLowerCase() as StatusKey)
                    const status = STATUSES[statusKey] ?? STATUSES.yangi
                    const StatusIcon = status.icon
                    const klient = o.klient_ismi || o.klient_nomi || "—"
                    return (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={selected.has(o.id)}
                            onChange={() => toggleSelect(o.id)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-500">
                          <a href={`/zakazlar/${o.id}`} className="hover:text-emerald-600">#{o.id}</a>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 tabular-nums">
                          {new Date(o.sana).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-slate-900">{klient}</td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-600">{o.tovar_soni ?? "—"}</td>
                        <td className="px-4 py-3 text-base text-right tabular-nums font-semibold text-slate-900">
                          {formatCurrency(Number(o.jami || 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums text-emerald-700">
                          {formatCurrency(Number(o.tolangan || 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums text-rose-600">
                          {Number(o.qarz || 0) > 0 ? formatCurrency(Number(o.qarz)) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 hover:bg-slate-200 rounded">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-right">Jami:</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-lg">{formatCurrency(totalSum)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

function StatusTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  )
}
