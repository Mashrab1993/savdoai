"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRightLeft, Search, Download, Plus, Package } from "lucide-react"

export default function TransfersPage() {
  const [search, setSearch] = useState("")
  const [items] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="w-7 h-7 text-blue-600" /> Skladlar aro ko'chirish</h1>
            <p className="text-sm text-muted-foreground mt-1">Tovarlarni bir skladdan boshqasiga ko'chirish</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> Yangi ko'chirish</Button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Sana</TableHead><TableHead>Qayerdan</TableHead><TableHead>Qayerga</TableHead>
              <TableHead className="text-center">Miqdor</TableHead><TableHead className="text-center">Tur</TableHead><TableHead>Izoh</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" />Ko'chirishlar topilmadi</TableCell></TableRow>
              ) : items.map((t: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">#{t.id}</TableCell>
                  <TableCell>{t.sana || "-"}</TableCell>
                  <TableCell className="font-medium">{t.qayerdan || "-"}</TableCell>
                  <TableCell className="font-medium">{t.qayerga || "-"}</TableCell>
                  <TableCell className="text-center font-mono">{t.miqdor || 0}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{t.tur || "Ko'chirish"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.izoh || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
