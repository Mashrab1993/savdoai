"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Ruler, Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const DEFAULT_UNITS = [
  { id: 1, nomi: "Dona", qisqa: "dona", asosiy: true },
  { id: 2, nomi: "Kilogramm", qisqa: "kg", asosiy: true },
  { id: 3, nomi: "Gramm", qisqa: "gr", asosiy: false },
  { id: 4, nomi: "Litr", qisqa: "l", asosiy: false },
  { id: 5, nomi: "Mililitr", qisqa: "ml", asosiy: false },
  { id: 6, nomi: "Metr", qisqa: "m", asosiy: false },
  { id: 7, nomi: "Quti", qisqa: "quti", asosiy: false },
  { id: 8, nomi: "Blok", qisqa: "blok", asosiy: false },
  { id: 9, nomi: "Paket", qisqa: "paket", asosiy: false },
]

export default function UnitsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "", qisqa: "", asosiy: false })
  const [units] = useState(DEFAULT_UNITS)

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Ruler}
          gradient="amber"
          title="Birliklar"
          subtitle="Tovarlar uchun o'lchov birliklari"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi
          </Button>
        </div>

        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Qisqa</TableHead>
                <TableHead className="text-center">Asosiy</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.nomi}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono">{u.qisqa}</Badge></TableCell>
                  <TableCell className="text-center">
                    {u.asosiy && <Badge className="bg-blue-100 text-blue-800 text-xs">Asosiy</Badge>}
                  </TableCell>
                  <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800">Faol</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi o'lchov birligi</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nomi *</label>
                <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Masalan: Tonna" />
              </div>
              <div>
                <label className="text-sm font-medium">Qisqa belgi *</label>
                <Input value={form.qisqa} onChange={e => setForm({...form, qisqa: e.target.value})} placeholder="t" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.asosiy} onChange={e => setForm({...form, asosiy: e.target.checked})} />
                Asosiy birlik
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button className="bg-emerald-600">Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
