"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MapPin, Plus, Pencil, Trash2, Search, Users } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function TerritoriesPage() {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "", viloyat: "", tuman: "" })
  const [territories] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><PageHeader
          icon={MapPin}
          gradient="cyan"
          title="Territoriyalar"
          subtitle="Hududlar, viloyatlar, tumanlar"
        /></div>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <div className="bg-card rounded-xl border">
          <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Nomi</TableHead><TableHead>Viloyat</TableHead><TableHead>Tuman</TableHead><TableHead className="text-center">Mijozlar</TableHead><TableHead className="text-center">Holat</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
            <TableBody>{territories.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground"><MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />Territoriyalar topilmadi</TableCell></TableRow>
            ) : territories.map((t: any, i: number) => (
              <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors"><TableCell>{i+1}</TableCell><TableCell className="font-medium">{t.nomi}</TableCell><TableCell>{t.viloyat}</TableCell><TableCell>{t.tuman}</TableCell><TableCell className="text-center"><Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{t.mijozlar_soni || 0}</Badge></TableCell><TableCell className="text-center"><Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Faol</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button></div></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>Yangi territoriya</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nomi *</label><Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Mahalla/Hudud nomi" /></div>
            <div><label className="text-sm font-medium">Viloyat</label><Input value={form.viloyat} onChange={e => setForm({...form, viloyat: e.target.value})} placeholder="Samarqand" /></div>
            <div><label className="text-sm font-medium">Tuman</label><Input value={form.tuman} onChange={e => setForm({...form, tuman: e.target.value})} placeholder="Registon tumani" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button><Button className="bg-primary">Saqlash</Button></DialogFooter>
        </DialogContent></Dialog>
      </div>
    </AdminLayout>
  )
}
