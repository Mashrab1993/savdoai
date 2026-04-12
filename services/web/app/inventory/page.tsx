"use client"
import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardList, Search, Download, Plus, Package, Check, X, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const [counted, setCounted] = useState<Record<number, number>>({})

  const { data, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/tovarlar?limit=200`, { headers: { Authorization: `Bearer ${token}` } })
      return res.ok ? res.json() : { items: [] }
    } catch { return { items: [] } }
  })

  const items = useMemo(() => {
    let list = (data as any)?.items || []
    if (search) { const q = search.toLowerCase(); list = list.filter((t: any) => (t.nomi || "").toLowerCase().includes(q)) }
    return list
  }, [data, search])

  const stats = useMemo(() => {
    let matched = 0, mismatched = 0, missing = 0
    items.forEach((t: any) => {
      const c = counted[t.id]
      if (c === undefined) missing++
      else if (c === t.qoldiq) matched++
      else mismatched++
    })
    return { matched, mismatched, missing, total: items.length }
  }, [items, counted])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-emerald-600" />
              Inventarizatsiya
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sklad tovarlarini fizik sanash va sverka qilish
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="w-4 h-4 mr-1" /> Tasdiqlash
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Jami tovarlar</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Mos keldi</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{stats.matched}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="text-sm text-yellow-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Mos kelmadi</div>
            <div className="text-2xl font-bold mt-1 text-yellow-700">{stats.mismatched}</div>
          </div>
          <div className="bg-muted/50 rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Sanalmagan</div>
            <div className="text-2xl font-bold mt-1 text-foreground">{stats.missing}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tovar qidirish yoki barcode skanerlash..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Tovar</TableHead>
                  <TableHead className="text-center">Tizim qoldig'i</TableHead>
                  <TableHead className="text-center">Fizik soni</TableHead>
                  <TableHead className="text-center">Farq</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Tovarlar topilmadi
                    </TableCell>
                  </TableRow>
                ) : items.map((t: any, i: number) => {
                  const sys = t.qoldiq || 0
                  const phys = counted[t.id]
                  const diff = phys !== undefined ? phys - sys : 0
                  return (
                    <TableRow key={t.id || i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{t.nomi}</TableCell>
                      <TableCell className="text-center font-mono">{sys}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          className="w-24 mx-auto text-center"
                          value={counted[t.id] ?? ""}
                          onChange={e => setCounted({ ...counted, [t.id]: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {phys === undefined ? "-" : (
                          <span className={diff === 0 ? "text-emerald-600" : diff > 0 ? "text-blue-600" : "text-red-600"}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {phys === undefined ? (
                          <Badge variant="secondary" className="text-xs">Sanalmagan</Badge>
                        ) : phys === sys ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">Mos</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Mos emas</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
