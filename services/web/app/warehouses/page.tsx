"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Warehouse, Plus, Search, Pencil, Trash2, Check, X } from "lucide-react"

export default function WarehousesPage() {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "", kod: "", turi: "asosiy", faol: true })
  const [warehouses] = useState<any[]>([])
  const filtered = warehouses.filter(w => !search || (w.nomi || "").toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Warehouse className="w-7 h-7 text-emerald-600" /> Skladlar</h1>
            <p className="text-sm text-muted-foreground mt-1">Skladlar ro'yxati va boshqaruvi</p></div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Yangi sklad</Button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border">
          <Table><TableHeader><TableRow>
            <TableHead>ID</TableHead><TableHead>Nomi</TableHead><TableHead>Turi</TableHead><TableHead>Kod</TableHead>
            <TableHead className="text-center">Ombordor</TableHead><TableHead className="text-center">Agentlar</TableHead>
            <TableHead className="text-center">Buyurtma</TableHead><TableHead className="text-center">Kirim</TableHead>
            <TableHead className="text-center">Ko'chirish</TableHead><TableHead className="text-center">Korreksiya</TableHead>
            <TableHead className="text-center">Holat</TableHead><TableHead className="w-20"></TableHead>
          </TableRow></TableHeader>
            <TableBody>{filtered.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="text-center py-10 text-muted-foreground"><Warehouse className="w-10 h-10 mx-auto mb-2 opacity-30" />Skladlar topilmadi<div className="text-xs mt-1">Yangi sklad qo'shing</div></TableCell></TableRow>
            ) : filtered.map((w: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-mono">{w.id}</TableCell>
                <TableCell className="font-medium">{w.nomi}</TableCell>
                <TableCell><Badge variant="secondary">{w.turi || "Asosiy"}</Badge></TableCell>
                <TableCell className="font-mono">{w.kod || "-"}</TableCell>
                <TableCell className="text-center">{w.ombordor || "-"}</TableCell>
                <TableCell className="text-center">{w.agentlar_soni || 0}</TableCell>
                <TableCell className="text-center">{w.buyurtma ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</TableCell>
                <TableCell className="text-center">{w.kirim ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</TableCell>
                <TableCell className="text-center">{w.kochirish ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</TableCell>
                <TableCell className="text-center">{w.korreksiya ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</TableCell>
                <TableCell className="text-center"><Badge className={w.faol ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}>{w.faol ? "Faol" : "Nofaol"}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button></div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Yangi sklad</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nomi *</label><Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Sklad nomi" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Kod</label><Input value={form.kod} onChange={e => setForm({...form, kod: e.target.value})} placeholder="Kod" /></div>
              <div><label className="text-sm font-medium">Turi</label>
                <select value={form.turi} onChange={e => setForm({...form, turi: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="asosiy">Asosiy</option><option value="tranzit">Tranzit</option><option value="vozvrat">Vozvrat</option>
                </select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button><Button className="bg-emerald-600">Saqlash</Button></DialogFooter>
        </DialogContent></Dialog>
      </div>
    </AdminLayout>
  )
}
