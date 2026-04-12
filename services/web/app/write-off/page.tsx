"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, Download, Plus, Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

export default function WriteOffPage() {
  const [search, setSearch] = useState("")
  const [items] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Trash2}
          gradient="rose"
          title="Spisanie"
          subtitle="Yaroqsiz yoki buzilgan tovarlarni hisobdan chiqarish"
        />
          </div>
          <div className="flex gap-2">
            <Button className="bg-destructive hover:bg-destructive/90"><Plus className="w-4 h-4 mr-1" /> Yangi spisanie</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Hisobot</Button>
          </div>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <div className="bg-card rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>#</TableHead><TableHead>Sana</TableHead><TableHead>Sklad</TableHead>
              <TableHead className="text-center">Miqdor</TableHead><TableHead className="text-center">Summa (baholash)</TableHead>
              <TableHead>Izoh</TableHead><TableHead>Yaratilgan</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" />Spisanie topilmadi</TableCell></TableRow>
              ) : items.map((s: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.sana || "-"}</TableCell>
                  <TableCell>{s.sklad || "-"}</TableCell>
                  <TableCell className="text-center font-mono">{s.miqdor || 0}</TableCell>
                  <TableCell className="text-center font-mono">{formatCurrency(s.summa || 0)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.izoh || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.yaratilgan || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
