"use client"
import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History, Search, Download, TrendingUp, TrendingDown, Minus, Package } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function PriceHistoryPage() {
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const { data, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/tovarlar?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return []
      const d = await res.json()
      return (d.items || []).map((t: any) => ({
        id: t.id, nomi: t.nomi, kategoriya: t.kategoriya,
        eski_narx: t.olish_narxi || 0, yangi_narx: t.sotish_narxi || 0,
        ozgarish: t.sotish_narxi && t.olish_narxi ? ((t.sotish_narxi - t.olish_narxi) / t.olish_narxi * 100) : 0,
        sana: t.yaratilgan || "-",
      }))
    } catch { return [] }
  })

  const items = useMemo(() => {
    let list = Array.isArray(data) ? data : []
    if (search) { const q = search.toLowerCase(); list = list.filter((p: any) => (p.nomi || "").toLowerCase().includes(q)) }
    return list
  }, [data, search])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><History className="w-7 h-7 text-emerald-600" /> Narx tarixi</h1>
            <p className="text-sm text-muted-foreground mt-1">Narx o'zgarishlari tarixi</p></div>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
        </div>
        <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Tovar qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" /></div>
        {loading ? <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div> : (
          <div className="bg-card rounded-xl border overflow-x-auto">
            <Table><TableHeader><TableRow>
              <TableHead>#</TableHead><TableHead>Tovar</TableHead><TableHead>Kategoriya</TableHead>
              <TableHead className="text-center">Olish narxi</TableHead><TableHead className="text-center">Sotish narxi</TableHead>
              <TableHead className="text-center">Foyda %</TableHead><TableHead className="text-center">Tendensiya</TableHead><TableHead>Sana</TableHead>
            </TableRow></TableHeader>
              <TableBody>{items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" />Ma'lumot topilmadi</TableCell></TableRow>
              ) : items.map((p: any, i: number) => (
                <TableRow key={p.id || i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.nomi}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{p.kategoriya || "-"}</Badge></TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(p.eski_narx)}</TableCell>
                  <TableCell className="text-center font-mono font-bold">{formatCurrency(p.yangi_narx)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono font-bold ${p.ozgarish > 0 ? "text-emerald-600" : p.ozgarish < 0 ? "text-red-600" : ""}`}>
                      {p.ozgarish > 0 ? "+" : ""}{p.ozgarish.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {p.ozgarish > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" /> : p.ozgarish < 0 ? <TrendingDown className="w-4 h-4 text-red-500 mx-auto" /> : <Minus className="w-4 h-4 text-muted-foreground mx-auto" />}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.sana}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
