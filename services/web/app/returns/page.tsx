"use client"
import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RotateCcw, Search, Download, Package } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function ReturnsPage() {
  const [search, setSearch] = useState("")
  const { data, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/qaytarishlar`, { headers: { Authorization: `Bearer ${token}` } })
      return res.ok ? res.json() : []
    } catch { return [] }
  })
  const items = useMemo(() => {
    let list = Array.isArray(data) ? data : (data as any)?.items || []
    if (search) { const q = search.toLowerCase(); list = list.filter((r: any) => (r.klient_ism || r.tovar_nomi || "").toLowerCase().includes(q)) }
    return list
  }, [data, search])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><RotateCcw className="w-7 h-7 text-orange-600" /> Qaytarishlar (Vozvrat)</h1>
            <p className="text-sm text-muted-foreground mt-1">Mijozdan qaytarilgan tovarlar</p>
          </div>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        {loading ? <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-orange-500 rounded-full" /></div> : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>Mijoz</TableHead><TableHead>Tovar</TableHead>
                <TableHead className="text-center">Miqdor</TableHead><TableHead className="text-center">Summa</TableHead>
                <TableHead className="text-center">Sabab</TableHead><TableHead>Sana</TableHead><TableHead className="text-center">Holat</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" />Qaytarishlar topilmadi</TableCell></TableRow>
                ) : items.map((r: any, i: number) => (
                  <TableRow key={r.id || i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.klient_ism || "Noma'lum"}</TableCell>
                    <TableCell>{r.tovar_nomi || "-"}</TableCell>
                    <TableCell className="text-center font-mono">{r.miqdor || 0}</TableCell>
                    <TableCell className="text-center font-mono">{formatCurrency(r.summa || r.jami || 0)}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary" className="text-xs">{r.sabab || "Ko'rsatilmagan"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.sana || r.yaratilgan || "-"}</TableCell>
                    <TableCell className="text-center"><Badge className="bg-orange-100 text-orange-800 text-xs">{r.holat || "Qaytarilgan"}</Badge></TableCell>
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
