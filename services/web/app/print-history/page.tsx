"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Search, Download, Eye, FileText } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function PrintHistoryPage() {
  const [search, setSearch] = useState("")
  const [history] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={Printer}
          gradient="blue"
          title="Chop tarixi"
          subtitle="Barcha chop etilgan hujjatlar tarixi"
        />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Bugungi chop", value: 0, color: "emerald" },
            { label: "Bu hafta", value: 0, color: "blue" },
            { label: "Bu oy", value: 0, color: "purple" },
            { label: "Jami", value: 0, color: "gray" },
          ].map((s, i) => (
            <div key={i} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
              <div className={`text-sm text-${s.color}-600`}>{s.label}</div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaqt</TableHead>
                <TableHead>Hujjat turi</TableHead>
                <TableHead>Raqam</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Printer</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Chop etish tarixi yo'q
                  </TableCell>
                </TableRow>
              ) : history.map((h: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-mono">{h.vaqt}</TableCell>
                  <TableCell><Badge variant="secondary">{h.tur}</Badge></TableCell>
                  <TableCell className="font-mono">#{h.raqam}</TableCell>
                  <TableCell>{h.user}</TableCell>
                  <TableCell className="text-sm">{h.printer}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={h.holat === "ok" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-rose-500/15 text-rose-800 dark:text-rose-300"}>
                      {h.holat === "ok" ? "Muvaffaqiyatli" : "Xato"}
                    </Badge>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
