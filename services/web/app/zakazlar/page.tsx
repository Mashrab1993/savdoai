"use client"
import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Truck, CheckCircle, Clock, X, MoreVertical, Loader2, Printer, Copy, Calendar, Trash2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/states"
import { formatCurrency } from "@/lib/utils"
import { api, ApiError } from "@/lib/api"
import { toast } from "sonner"

const PERIOD_LABELS: Record<string, string> = {
  all: "Barchasi",
  today: "Bugun",
  yesterday: "Kecha",
  week: "Hafta",
  month: "Oy",
}

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

type RefItem = { id: number; ism?: string; nomi?: string }

export default function ZakazlarPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  // Yangi P1 filterlar
  const [period, setPeriod] = useState<string>("all")
  const [docFilter, setDocFilter] = useState("")
  const [bulking, setBulking] = useState(false)
  // P3: agent/sklad/hudud filterlar
  const [shogirdId, setShogirdId] = useState<string>("")
  const [skladId, setSkladId] = useState<string>("")
  const [hududId, setHududId] = useState<string>("")

  // Reference data
  const { data: shogirdlar } = useApi<RefItem[]>(isAuthenticated ? "/api/v1/shogirdlar" : null)
  const { data: skladlar } = useApi<{ items: RefItem[] } | RefItem[]>(isAuthenticated ? "/api/v1/skladlar" : null)
  const { data: hududlar } = useApi<{ items: RefItem[] } | RefItem[]>(isAuthenticated ? "/api/v1/hududlar" : null)
  const skladItems = Array.isArray(skladlar) ? skladlar : (skladlar?.items ?? [])
  const hududItems = Array.isArray(hududlar) ? hududlar : (hududlar?.items ?? [])
  const shogirdItems: RefItem[] = Array.isArray(shogirdlar) ? shogirdlar : []

  const apiUrl = useMemo(() => {
    if (!isAuthenticated) return null
    const params = new URLSearchParams({ limit: "200" })
    if (period !== "all") params.set("period", period)
    if (docFilter.trim()) params.set("document_number", docFilter.trim())
    if (shogirdId) params.set("shogird_id", shogirdId)
    if (skladId) params.set("sklad_id", skladId)
    if (hududId) params.set("hudud_id", hududId)
    return `/api/v1/savdolar?${params.toString()}`
  }, [isAuthenticated, period, docFilter, shogirdId, skladId, hududId])

  const { data, loading, error, refetch } = useApi<SavdoResp>(apiUrl)

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

  const REGISTR_VARIANTS = [
    { id: 1, name: "Standart", desc: "Реестр 3.0 — 9 ustun" },
    { id: 2, name: "Qisqa", desc: "4 ustun (tez ko'rish)" },
    { id: 3, name: "Kengaytirilgan", desc: "11 ustun (qarz, holat, izoh)" },
    { id: 4, name: "Moliyaviy", desc: "Balans, debit/kredit" },
  ]
  const NAKLADNOY_VARIANTS = [
    { id: 1, name: "Standart", desc: "Klassik invoice" },
    { id: 2, name: "Chek", desc: "POS receipt (mini)" },
    { id: 3, name: "Optom", desc: "Wholesale (olish + sotish narx)" },
    { id: 4, name: "Soliq", desc: "IKPU + NDS 12%" },
    { id: 5, name: "Klient", desc: "Klient nusxasi (logo + imzo)" },
    { id: 6, name: "Ombor", desc: "Faqat tovar + miqdor" },
    { id: 7, name: "Batafsil", desc: "Hammasi (kategoriya, izoh)" },
  ]

  // Excel export — JSON+base64 javobini blob ga aylantirib yuklash
  const downloadExcel = async (
    selectedOnly: boolean,
    format: "registr" | "nakladnoy" = "registr",
    variant: number = 1,
  ) => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (selectedOnly && selected.size > 0) params.set("ids", Array.from(selected).join(","))
      params.set("variant", String(variant))
      const path = format === "nakladnoy"
        ? `/api/v1/savdolar/nakladnoy/excel?${params}`
        : `/api/v1/savdolar/excel?${params}`
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
      const variantName = (format === "nakladnoy" ? NAKLADNOY_VARIANTS : REGISTR_VARIANTS).find(v => v.id === variant)?.name || ""
      toast.success(`${tanlangan} ta zakaz ${formatLabel} (${variantName}) yuklandi`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const printSelected = () => {
    if (selected.size === 0) return
    const ids = Array.from(selected).join(",")
    window.open(`/zakazlar/print?ids=${ids}`, "_blank")
  }

  // Duplicate zayavka — bitta sotuv
  const duplicateOrder = async (id: number) => {
    try {
      const res = await api.post<{ id: number; document_number: string }>(`/api/v1/savdo/${id}/duplicate`)
      toast.success(`Nusxa yaratildi: #${res.id}${res.document_number ? ` (${res.document_number})` : ""}`)
      refetch()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    }
  }

  // Bulk status change
  const bulkChangeStatus = async (newStatus: string) => {
    if (selected.size === 0) return
    setBulking(true)
    try {
      const res = await api.post<{ yangilandi: number }>("/api/v1/savdo/bulk/status", {
        ids: Array.from(selected),
        holat: newStatus,
      })
      toast.success(`${res.yangilandi} ta zakaz holati o'zgartirildi: ${newStatus}`)
      setSelected(new Set())
      refetch()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    } finally {
      setBulking(false)
    }
  }

  // Bulk soft delete
  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} ta zakazni bekor qilmoqchimisiz? (status bekor bo'ladi, hard delete EMAS)`)) return
    setBulking(true)
    try {
      const res = await api.post<{ bekor: number }>("/api/v1/savdo/bulk/delete", {
        ids: Array.from(selected),
        sabab: "Frontend bulk delete",
      })
      toast.success(`${res.bekor} ta zakaz bekor qilindi`)
      setSelected(new Set())
      refetch()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : (e as Error).message)
    } finally {
      setBulking(false)
    }
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

        {/* Period preset buttons (P1 SalesDoc parity) */}
        <Card className="p-3 flex flex-wrap gap-2 items-center">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600 mr-2">Davr:</span>
          {(["all", "today", "yesterday", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
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
            <div className="min-w-[180px] relative">
              <Input
                placeholder="Hujjat raqami (MUK000...)"
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
              />
            </div>
            <select
              value={shogirdId}
              onChange={e => setShogirdId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:border-emerald-500 min-w-[160px]"
            >
              <option value="">Agent (barcha)</option>
              {shogirdItems.map(s => (
                <option key={s.id} value={s.id}>{s.ism || `#${s.id}`}</option>
              ))}
            </select>
            <select
              value={skladId}
              onChange={e => setSkladId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:border-emerald-500 min-w-[140px]"
            >
              <option value="">Sklad (barcha)</option>
              {skladItems.map(s => (
                <option key={s.id} value={s.id}>{s.nomi || `#${s.id}`}</option>
              ))}
            </select>
            {hududItems.length > 0 && (
              <select
                value={hududId}
                onChange={e => setHududId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:border-emerald-500 min-w-[140px]"
              >
                <option value="">Hudud (barcha)</option>
                {hududItems.map(h => (
                  <option key={h.id} value={h.id}>{h.nomi || `#${h.id}`}</option>
                ))}
              </select>
            )}
            {(shogirdId || skladId || hududId || docFilter) && (
              <button
                onClick={() => { setShogirdId(""); setSkladId(""); setHududId(""); setDocFilter("") }}
                className="px-3 py-2 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                title="Filterlarni tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ExportDropdown
              label="Реестр (barcha)"
              variants={REGISTR_VARIANTS}
              onPick={v => downloadExcel(false, "registr", v)}
              disabled={exporting}
            />
            <ExportDropdown
              label="Накладной (barcha)"
              variants={NAKLADNOY_VARIANTS}
              onPick={v => downloadExcel(false, "nakladnoy", v)}
              disabled={exporting}
            />
          </div>
        </Card>

        {selected.size > 0 && (
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-semibold text-emerald-800">
                {selected.size} ta zakaz tanlangan
              </span>
              <div className="flex gap-2 flex-wrap">
                <BulkStatusDropdown
                  onPick={(s) => bulkChangeStatus(s)}
                  disabled={bulking}
                />
                <Button
                  variant="outline"
                  onClick={bulkDelete}
                  disabled={bulking}
                  className="text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  {bulking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Bekor qilish
                </Button>
                <ExportDropdown
                  label={`Реестр (${selected.size})`}
                  variants={REGISTR_VARIANTS}
                  onPick={v => downloadExcel(true, "registr", v)}
                  disabled={exporting}
                />
                <ExportDropdown
                  label={`Накладной (${selected.size})`}
                  variants={NAKLADNOY_VARIANTS}
                  onPick={v => downloadExcel(true, "nakladnoy", v)}
                  disabled={exporting}
                />
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
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => duplicateOrder(o.id)}
                            className="p-1.5 hover:bg-emerald-50 rounded text-slate-500 hover:text-emerald-600 mr-1"
                            title="Nusxalash (Дублировать)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
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

type Variant = { id: number; name: string; desc: string }

function BulkStatusDropdown({ onPick, disabled }: { onPick: (status: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const STATUSES_BULK = [
    { key: "tasdiqlangan", label: "Tasdiqlash" },
    { key: "yigilmoqda", label: "Yig'ish boshlandi" },
    { key: "otgruzka", label: "Otgruzka" },
    { key: "yetkazildi", label: "Yetkazildi" },
    { key: "yopiq", label: "Yopiq" },
  ]
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)} disabled={disabled}>
        {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Holat o'zgartirish
        <span className="text-xs opacity-50">▼</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
            {STATUSES_BULK.map(s => (
              <button
                key={s.key}
                onClick={() => { setOpen(false); onPick(s.key) }}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-0 text-sm font-medium text-slate-900"
              >
                → {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ExportDropdown({
  label, variants, onPick, disabled,
}: {
  label: string;
  variants: Variant[];
  onPick: (id: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {label}
        <span className="text-xs opacity-50">▼</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-72 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
            {variants.map(v => (
              <button
                key={v.id}
                onClick={() => { setOpen(false); onPick(v.id) }}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-100 last:border-0"
              >
                <div className="font-medium text-sm text-slate-900">{v.id}. {v.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{v.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
