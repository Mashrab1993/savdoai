"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Users, Plus, Pencil, Trash2, Crown, Store, Building, ShoppingBag, Coffee } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const DEFAULT_CATEGORIES = [
  { id: 1, nomi: "VIP mijozlar", icon: Crown, color: "yellow" },
  { id: 2, nomi: "Doimiy mijozlar", icon: Users, color: "blue" },
  { id: 3, nomi: "Optom savdo", icon: Building, color: "purple" },
  { id: 4, nomi: "Supermarket", icon: ShoppingBag, color: "emerald" },
  { id: 5, nomi: "Roznitsa", icon: Store, color: "orange" },
  { id: 6, nomi: "HoReCa (Hotel/Restaurant/Cafe)", icon: Coffee, color: "red" },
]

const DEFAULT_TYPES = [
  { id: 1, nomi: "Yuridik shaxs" },
  { id: 2, nomi: "Jismoniy shaxs" },
  { id: 3, nomi: "Yakka tartibdagi tadbirkor" },
]

export default function ClientCategoriesPage() {
  const [tab, setTab] = useState("category")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "" })

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Users}
          gradient="violet"
          title="Klient kategoriyalari"
          subtitle="Mijozlarni guruhlash va boshqarish"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="category">Kategoriyalar</TabsTrigger>
            <TabsTrigger value="type">Turlar</TabsTrigger>
            <TabsTrigger value="channel">Savdo kanali</TabsTrigger>
          </TabsList>

          <TabsContent value="category">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEFAULT_CATEGORIES.map(c => (
                <div key={c.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <c.icon className={`w-8 h-8 text-${c.color}-600`} />
                    <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Faol</Badge>
                  </div>
                  <div className="font-bold">{c.nomi}</div>
                  <div className="text-xs text-muted-foreground mt-1">0 ta mijoz</div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="flex-1"><Pencil className="w-3 h-3 mr-1" /> Tahrirlash</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="type">
            <div className="bg-card rounded-xl border">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nomi</TableHead><TableHead className="text-center">Mijozlar</TableHead><TableHead className="text-center">Holat</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                <TableBody>{DEFAULT_TYPES.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono">{t.id}</TableCell>
                    <TableCell className="font-medium">{t.nomi}</TableCell>
                    <TableCell className="text-center">0</TableCell>
                    <TableCell className="text-center"><Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">Faol</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button></div></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="channel">
            <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              Savdo kanallari hali sozlanmagan
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi {tab === "category" ? "kategoriya" : tab === "type" ? "tur" : "kanal"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nomi *</label>
                <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Nomi" />
              </div>
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
