"use client"

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Package, Search, Download, ArrowUpDown, TrendingUp, TrendingDown,
  ArrowRightLeft, Warehouse, BarChart3,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

interface MaterialRow {
  id: number
  nomi: string
  kategoriya: string
  bosh_qoldiq: number
  // Kirim
  kirim_poступление: number
  kirim_korreksiya: number
  kirim_vozvrat: number
  kirim_peremeschenie: number
  jami_kirim: number
  // Chiqim
  chiqim_sotuv: number
  chiqim_vozvrat_post: number
  chiqim_korreksiya: number
  chiqim_bonus: number
  chiqim_spisanie: number
  chiqim_peremeschenie: number
  jami_chiqim: number
  // Oxirgi
  oxirgi_qoldiq: number
}

export default function MaterialReportPage() {
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Mock data - will be replaced with API call
  const { data: rawData, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/tovarlar?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      const data = await res.json()
      // Transform tovarlar data to material report format
      return (data.items || []).map((t: any) => ({
        id: t.id,
        nomi: t.nomi,
        kategoriya: t.kategoriya || "",
        bosh_qoldiq: 0,
        kirim_poступление: 0,
        kirim_korreksiya: 0,
        kirim_vozvrat: 0,
        kirim_peremeschenie: 0,
        jami_kirim: 0,
        chiqim_sotuv: 0,
        chiqim_vozvrat_post: 0,
        chiqim_korreksiya: 0,
        chiqim_bonus: 0,
        chiqim_spisanie: 0,
        chiqim_peremeschenie: 0,
        jami_chiqim: 0,
        oxirgi_qoldiq: t.qoldiq || 0,
      }))
    } catch { return [] }
  })

  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return []
    let items = rawData as MaterialRow[]
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(t => t.nomi.toLowerCase().includes(q))
    }
    return items
  }, [rawData, search])

  const totals = useMemo(() => {
    return data.reduce((acc, t) => ({
      kirim: acc.kirim + (t.jami_kirim || 0),
      chiqim: acc.chiqim + (t.jami_chiqim || 0),
      qoldiq: acc.qoldiq + (t.oxirgi_qoldiq || 0),
    }), { kirim: 0, chiqim: 0, qoldiq: 0 })
  }, [data])

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <PageHeader
          icon={BarChart3}
          gradient="amber"
          title="Material hisobot"
          subtitle="Tovar harakati: kirim, chiqim, qoldiq (SalesDoc uslubida)"
        />
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Excel export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Jami kirim
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{totals.kirim}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 p-4">
            <div className="text-sm text-red-600 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> Jami chiqim
            </div>
            <div className="text-2xl font-bold mt-1 text-red-700">{totals.chiqim}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-600 flex items-center gap-1">
              <Warehouse className="w-4 h-4" /> Joriy qoldiq
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-700">{totals.qoldiq}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tovar qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
          </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-muted">
                  <TableHead rowSpan={2} className="border-r font-bold">Tovar</TableHead>
                  <TableHead rowSpan={2} className="border-r text-center font-bold">Bosh qoldiq</TableHead>
                  <TableHead colSpan={4} className="text-center border-r bg-emerald-50 dark:bg-emerald-900/10 font-bold text-emerald-700">KIRIM</TableHead>
                  <TableHead colSpan={6} className="text-center border-r bg-red-50 dark:bg-red-900/10 font-bold text-red-700">CHIQIM</TableHead>
                  <TableHead rowSpan={2} className="text-center font-bold bg-blue-50 dark:bg-blue-900/10 text-blue-700">Oxirgi qoldiq</TableHead>
                </TableRow>
                <TableRow className="bg-muted/50 dark:bg-muted text-xs">
                  {/* Kirim sub-headers */}
                  <TableHead className="text-center bg-emerald-50/50 text-xs">Kirim</TableHead>
                  <TableHead className="text-center bg-emerald-50/50 text-xs">Korrek+</TableHead>
                  <TableHead className="text-center bg-emerald-50/50 text-xs">Vozvrat</TableHead>
                  <TableHead className="text-center bg-emerald-50/50 border-r text-xs">Ko'chirish+</TableHead>
                  {/* Chiqim sub-headers */}
                  <TableHead className="text-center bg-red-50/50 text-xs">Sotuv</TableHead>
                  <TableHead className="text-center bg-red-50/50 text-xs">Vzv post.</TableHead>
                  <TableHead className="text-center bg-red-50/50 text-xs">Korrek-</TableHead>
                  <TableHead className="text-center bg-red-50/50 text-xs">Bonus</TableHead>
                  <TableHead className="text-center bg-red-50/50 text-xs">Spisanie</TableHead>
                  <TableHead className="text-center bg-red-50/50 border-r text-xs">Ko'chirish-</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                ) : data.map((t, i) => (
                  <TableRow key={t.id || i} className={i % 2 === 0 ? "" : "bg-muted/50/50 dark:bg-muted/50"}>
                    <TableCell className="border-r">
                      <div className="font-medium text-sm">{t.nomi}</div>
                      {t.kategoriya && <div className="text-xs text-muted-foreground">{t.kategoriya}</div>}
                    </TableCell>
                    <TableCell className="text-center border-r font-mono">{t.bosh_qoldiq || 0}</TableCell>
                    {/* Kirim */}
                    <TableCell className="text-center font-mono text-emerald-600">{t.kirim_poступление || 0}</TableCell>
                    <TableCell className="text-center font-mono text-emerald-600">{t.kirim_korreksiya || 0}</TableCell>
                    <TableCell className="text-center font-mono text-emerald-600">{t.kirim_vozvrat || 0}</TableCell>
                    <TableCell className="text-center font-mono text-emerald-600 border-r">{t.kirim_peremeschenie || 0}</TableCell>
                    {/* Chiqim */}
                    <TableCell className="text-center font-mono text-red-600">{t.chiqim_sotuv || 0}</TableCell>
                    <TableCell className="text-center font-mono text-red-600">{t.chiqim_vozvrat_post || 0}</TableCell>
                    <TableCell className="text-center font-mono text-red-600">{t.chiqim_korreksiya || 0}</TableCell>
                    <TableCell className="text-center font-mono text-red-600">{t.chiqim_bonus || 0}</TableCell>
                    <TableCell className="text-center font-mono text-red-600">{t.chiqim_spisanie || 0}</TableCell>
                    <TableCell className="text-center font-mono text-red-600 border-r">{t.chiqim_peremeschenie || 0}</TableCell>
                    {/* Oxirgi */}
                    <TableCell className="text-center font-mono font-bold text-blue-700">{t.oxirgi_qoldiq || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
