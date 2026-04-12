"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Plus, Pencil, Trash2, Wifi, Signal, FileText, Settings } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const PRINTERS = [
  { id: 1, nomi: "Asosiy kassa printeri", turi: "thermal", model: "Xprinter XP-58", port: "USB", status: "online" },
  { id: 2, nomi: "Faktura printer", turi: "a4", model: "HP LaserJet M15", port: "Network", status: "offline" },
  { id: 3, nomi: "Chek printeri (mobil)", turi: "thermal", model: "Goojprt PT-280", port: "Bluetooth", status: "online" },
]

export default function PrintersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [printers] = useState(PRINTERS)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Printer}
          gradient="violet"
          title="Printerlar"
          subtitle="Chek, faktura va nakladnoy chop etish printerlari"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi printer
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Jami</div>
            <div className="text-2xl font-bold mt-1">{printers.length}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600 flex items-center gap-1"><Signal className="w-3 h-3" /> Online</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{printers.filter(p => p.status === "online").length}</div>
          </div>
          <div className="bg-rose-500/10 rounded-xl border border-rose-500/30 p-4">
            <div className="text-sm text-rose-600 dark:text-rose-400">Offline</div>
            <div className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">{printers.filter(p => p.status === "offline").length}</div>
          </div>
        </div>

        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Ulanish</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printers.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.nomi}</TableCell>
                  <TableCell><Badge variant="secondary">{p.turi === "thermal" ? "Thermal (chek)" : "A4 (faktura)"}</Badge></TableCell>
                  <TableCell className="text-sm">{p.model}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{p.port}</Badge></TableCell>
                  <TableCell className="text-center">
                    {p.status === "online" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"><Wifi className="w-3 h-3 mr-1" />Online</Badge>
                    ) : (
                      <Badge className="bg-rose-500/15 text-rose-800 dark:text-rose-300">Offline</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="Test print"><FileText className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm"><Settings className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
