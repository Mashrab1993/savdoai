"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardCheck, Camera, BarChart3, Users, Eye, MapPin, Package } from "lucide-react"
import { Shield } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function AuditDashboardPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [agents] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><PageHeader
          icon={Shield}
          gradient="blue"
          title="Audit Dashboard"
          subtitle="Kunlik agent faoliyati auditi — SalesDoc uslubida"
        /></div>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Rejadagi vizitlar", value: 0, icon: MapPin, color: "text-blue-600" },
            { label: "Bajarilgan vizitlar", value: 0, icon: Eye, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Otkazlar", value: 0, icon: Package, color: "text-rose-600 dark:text-rose-400" },
            { label: "Foto hisobotlar", value: 0, icon: Camera, color: "text-purple-600" },
            { label: "SKU audit", value: 0, icon: BarChart3, color: "text-orange-600" },
          ].map((s, i) => (
            <div key={i} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
              <div className={`text-sm ${s.color} flex items-center gap-1`}><s.icon className="w-4 h-4" /> {s.label}</div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>Agent</TableHead>
            <TableHead className="text-center">Reja vizit</TableHead>
            <TableHead className="text-center">Vizitlar</TableHead>
            <TableHead className="text-center">Otkazlar</TableHead>
            <TableHead className="text-center">SKU</TableHead>
            <TableHead className="text-center">Facing</TableHead>
            <TableHead className="text-center">Merchandizing</TableHead>
            <TableHead className="text-center">Foto</TableHead>
          </TableRow></TableHeader>
            <TableBody>{agents.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />{date} uchun audit ma'lumotlari yo'q
              </TableCell></TableRow>
            ) : agents.map((a: any, i: number) => (
              <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{a.ism}</TableCell>
                <TableCell className="text-center font-mono">{a.reja_vizit || 0}</TableCell>
                <TableCell className="text-center font-mono font-bold text-emerald-600">{a.vizitlar || 0}</TableCell>
                <TableCell className="text-center font-mono text-rose-600 dark:text-rose-400">{a.otkazlar || 0}</TableCell>
                <TableCell className="text-center font-mono">{a.sku || 0}</TableCell>
                <TableCell className="text-center font-mono">{a.facing || 0}</TableCell>
                <TableCell className="text-center font-mono">{a.merchandizing || 0}</TableCell>
                <TableCell className="text-center font-mono">{a.foto || 0}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
