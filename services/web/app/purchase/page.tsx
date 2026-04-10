"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingBag, Search, Download, Plus, Package, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function PurchasePage() {
  const [search, setSearch] = useState("")
  const [items] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="w-7 h-7 text-emerald-600" /> Kirimlar (Poступление)</h1>
            <p className="text-sm text-muted-foreground mt-1">Tovar kirim ro'yxati — postavshikdan qabul qilish</p></div>
          <div className="flex gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Yangi kirim</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
          </div>
        </div>
        <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Input type="date" className="w-40" /><Input type="date" className="w-40" /></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>ID</TableHead><TableHead>Kod</TableHead><TableHead>Sklad</TableHead><TableHead>Postavshik</TableHead>
            <TableHead className="text-center">Narx turi</TableHead><TableHead className="text-center">To'lov usuli</TableHead>
            <TableHead className="text-center">Miqdor</TableHead><TableHead className="text-center">Summa</TableHead>
            <TableHead>Sana</TableHead><TableHead>Izoh</TableHead>
          </TableRow></TableHeader>
            <TableBody>{items.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" />Kirimlar topilmadi</TableCell></TableRow>
            ) : items.map((p: any, i: number) => (
              <TableRow key={i}><TableCell className="font-mono">#{p.id}</TableCell><TableCell>{p.kod || "-"}</TableCell>
                <TableCell>{p.sklad || "-"}</TableCell><TableCell className="font-medium">{p.postavshik || "-"}</TableCell>
                <TableCell className="text-center"><Badge variant="secondary">{p.narx_turi || "-"}</Badge></TableCell>
                <TableCell className="text-center">{p.tolov_usuli || "-"}</TableCell>
                <TableCell className="text-center font-mono">{p.miqdor || 0}</TableCell>
                <TableCell className="text-center font-mono font-bold">{formatCurrency(p.summa || 0)}</TableCell>
                <TableCell className="text-sm">{p.sana || "-"}</TableCell><TableCell className="text-sm text-muted-foreground">{p.izoh || "-"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
