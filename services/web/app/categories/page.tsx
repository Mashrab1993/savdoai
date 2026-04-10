"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tag, Plus, Pencil, Trash2, Folder, Package, Building, Award } from "lucide-react"

export default function CategoriesPage() {
  const [tab, setTab] = useState("category")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "", kod: "", saralash: 500 })

  const sections = [
    { key: "category",     label: "Kategoriyalar",    icon: Folder, items: [] as any[] },
    { key: "subcategory",  label: "Podkategoriyalar", icon: Folder, items: [] as any[] },
    { key: "group",        label: "Guruhlar",         icon: Tag,    items: [] as any[] },
    { key: "brand",        label: "Brendlar",         icon: Award,  items: [] as any[] },
    { key: "producer",     label: "Ishlab chiqaruvchi", icon: Building, items: [] as any[] },
    { key: "segment",      label: "Segmentlar",       icon: Package, items: [] as any[] },
  ]

  const current = sections.find(s => s.key === tab)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Folder className="w-7 h-7 text-emerald-600" />
              Kategoriyalar va guruhlash
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tovar kategoriyalari, brendlar, segmentlar
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi {current?.label.slice(0, -3) || ""}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            {sections.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="gap-1">
                <s.icon className="w-4 h-4" /> {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map(s => (
            <TabsContent key={s.key} value={s.key}>
              <div className="bg-white dark:bg-gray-900 rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nomi</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead className="text-center">Saralash</TableHead>
                      <TableHead className="text-center">Tovarlar soni</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          <s.icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          {s.label} topilmadi
                          <div className="text-xs mt-1">"Yangi" tugmasi orqali qo'shing</div>
                        </TableCell>
                      </TableRow>
                    ) : s.items.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{item.id}</TableCell>
                        <TableCell className="font-medium">{item.nomi}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{item.kod || "-"}</Badge></TableCell>
                        <TableCell className="text-center font-mono">{item.saralash || 500}</TableCell>
                        <TableCell className="text-center">{item.tovarlar_soni || 0}</TableCell>
                        <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800 text-xs">Faol</Badge></TableCell>
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
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi {current?.label.slice(0, -3) || ""}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nomi *</label>
                <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder={`${current?.label.slice(0, -3)} nomi`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kod</label>
                  <Input value={form.kod} onChange={e => setForm({...form, kod: e.target.value})} placeholder="Kod" />
                </div>
                <div>
                  <label className="text-sm font-medium">Saralash</label>
                  <Input type="number" value={form.saralash} onChange={e => setForm({...form, saralash: Number(e.target.value)})} />
                </div>
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
