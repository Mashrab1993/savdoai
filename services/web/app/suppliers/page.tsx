"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Building2, Plus, Search, Phone, MapPin, Pencil, Trash2 } from "lucide-react"

export default function SuppliersPage() {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "", telefon: "", manzil: "" })
  const [suppliers] = useState<any[]>([])
  const filtered = suppliers.filter(s => !search || (s.nomi || "").toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-7 h-7 text-emerald-600" /> Yetkazib beruvchilar</h1>
            <p className="text-sm text-muted-foreground mt-1">Postavshiklar ro'yxati</p></div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border">
          <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Nomi</TableHead><TableHead>Telefon</TableHead><TableHead>Manzil</TableHead><TableHead className="text-center">Holat</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
            <TableBody>{filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />Yetkazib beruvchilar topilmadi</TableCell></TableRow>
            ) : filtered.map((s: any, i: number) => (
              <TableRow key={i}><TableCell>{i+1}</TableCell><TableCell className="font-medium">{s.nomi}</TableCell><TableCell><div className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3" />{s.telefon}</div></TableCell><TableCell className="text-sm">{s.manzil}</TableCell><TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800">Faol</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button></div></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Yangi yetkazib beruvchi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nomi *</label><Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Kompaniya nomi" /></div>
            <div><label className="text-sm font-medium">Telefon</label><Input value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})} placeholder="+998 90 123 45 67" /></div>
            <div><label className="text-sm font-medium">Manzil</label><Input value={form.manzil} onChange={e => setForm({...form, manzil: e.target.value})} placeholder="Manzil" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button><Button className="bg-emerald-600">Saqlash</Button></DialogFooter>
        </DialogContent></Dialog>
      </div>
    </AdminLayout>
  )
}
