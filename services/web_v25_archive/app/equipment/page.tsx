"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Refrigerator, Plus, Search, Pencil, Trash2, Camera, Package, History } from "lucide-react"
import { Monitor } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const TYPES = [
  { key: "fridge",   label: "Sovutgich",       icon: Refrigerator },
  { key: "shelf",    label: "Stelaj",          icon: Package },
  { key: "freezer",  label: "Muzlatgich",      icon: Refrigerator },
  { key: "display",  label: "Vitrina",         icon: Package },
  { key: "container", label: "Konteyner",      icon: Package },
]

export default function EquipmentPage() {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [equipment] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Monitor}
          gradient="blue"
          title="Uskunalar"
          subtitle="Mijozlarga berilgan uskunalar va ularning holati"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Yangi uskuna
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TYPES.map(t => (
            <div key={t.key} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 text-center hover:shadow-md transition">
              <t.icon className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-2xl font-bold mt-1">0</div>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Uskuna yoki mijoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead>Seriya raqam</TableHead>
                <TableHead>Mijoz</TableHead>
                <TableHead>Berilgan sana</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <Refrigerator className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Uskunalar topilmadi
                    <div className="text-xs mt-1">"Yangi uskuna" tugmasi orqali qo'shing</div>
                  </TableCell>
                </TableRow>
              ) : equipment.map((e: any, i: number) => (
                <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono">{e.id}</TableCell>
                  <TableCell className="font-medium">{e.nomi}</TableCell>
                  <TableCell><Badge variant="secondary">{e.tur}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{e.seriya}</TableCell>
                  <TableCell>{e.mijoz}</TableCell>
                  <TableCell className="text-sm">{e.sana}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={e.holat === "yaxshi" ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : e.holat === "buzilgan" ? "bg-rose-500/15 text-rose-800 dark:text-rose-300" : "bg-amber-500/15 text-amber-800 dark:text-amber-300"}>
                      {e.holat || "Yaxshi"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Camera className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm"><History className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
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
