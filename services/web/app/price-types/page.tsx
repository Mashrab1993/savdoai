"use client"
import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tag, Plus, Search, Pencil, Trash2, ShoppingCart, DollarSign, Percent, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface PriceType {
  id: number
  nomi: string
  kod: string
  turi: "purchase" | "sale"
  manual: boolean
  faol: boolean
  yaratilgan: string
}

const DEFAULT_PRICE_TYPES: PriceType[] = [
  { id: 1, nomi: "Opt narx", kod: "OPT", turi: "sale", manual: false, faol: true, yaratilgan: "2026-04-10" },
  { id: 2, nomi: "Roznitsa narx", kod: "ROZ", turi: "sale", manual: false, faol: true, yaratilgan: "2026-04-10" },
  { id: 3, nomi: "Skidka narx", kod: "SKID", turi: "sale", manual: true, faol: true, yaratilgan: "2026-04-10" },
  { id: 4, nomi: "VIP narx", kod: "VIP", turi: "sale", manual: false, faol: true, yaratilgan: "2026-04-10" },
  { id: 5, nomi: "Olish narx (kirim)", kod: "PUR", turi: "purchase", manual: false, faol: true, yaratilgan: "2026-04-10" },
]

export default function PriceTypesPage() {
  const [tab, setTab] = useState("sale")
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [showActive, setShowActive] = useState(true)
  const [form, setForm] = useState({ nomi: "", kod: "", turi: "sale", manual: false, narx_foiz: 0 })
  const [priceTypes, setPriceTypes] = useState(DEFAULT_PRICE_TYPES)

  const filtered = useMemo(() => {
    return priceTypes.filter(p => {
      if (p.turi !== tab) return false
      if (showActive !== p.faol) return false
      if (search && !p.nomi.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [priceTypes, tab, showActive, search])

  const handleAdd = () => {
    if (!form.nomi.trim()) return
    setPriceTypes([...priceTypes, {
      id: Date.now(),
      nomi: form.nomi,
      kod: form.kod || form.nomi.slice(0, 4).toUpperCase(),
      turi: form.turi as "purchase" | "sale",
      manual: form.manual,
      faol: true,
      yaratilgan: new Date().toISOString().split("T")[0],
    }])
    setShowAdd(false)
    setForm({ nomi: "", kod: "", turi: "sale", manual: false, narx_foiz: 0 })
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="w-7 h-7 text-emerald-600" />
              Narx turlari (Tip sena)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Opt, roznitsa, skidka — barcha narx turlari
            </p>
          </div>
          <Button onClick={() => { setForm({ ...form, turi: tab }); setShowAdd(true) }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi narx turi
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="sale" className="gap-1">
              <ShoppingCart className="w-4 h-4" /> Sotish narxlari
            </TabsTrigger>
            <TabsTrigger value="purchase" className="gap-1">
              <DollarSign className="w-4 h-4" /> Olish narxlari
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowActive(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${showActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
              >Aktiv</button>
              <button
                onClick={() => setShowActive(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${!showActive ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
              >Neaktiv</button>
            </div>
          </div>

          {["sale", "purchase"].map(t => (
            <TabsContent key={t} value={t}>
              <div className="bg-white dark:bg-gray-900 rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Nomi</TableHead>
                      <TableHead className="text-center">Turi</TableHead>
                      <TableHead className="text-center">Hisoblash</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead>Yaratilgan</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          Narx turlari topilmadi
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.id}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{p.kod}</Badge></TableCell>
                        <TableCell className="font-medium">{p.nomi}</TableCell>
                        <TableCell className="text-center">
                          {p.turi === "sale" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Sotish</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Olish</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.manual ? (
                            <Badge variant="secondary" className="text-xs">Qo'lda</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Avtomatik</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={p.faol ? "bg-emerald-100 text-emerald-800 text-xs" : "bg-gray-100 text-gray-600 text-xs"}>
                            {p.faol ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.yaratilgan}</TableCell>
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

        {/* Info card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
          <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Narx turlari haqida
          </h3>
          <ul className="text-sm space-y-1 text-blue-600">
            <li>• <b>Opt narx</b> — ulgurji savdo uchun, katta partiyalarda</li>
            <li>• <b>Roznitsa narx</b> — chakana savdo uchun, oxirgi mijozga</li>
            <li>• <b>Skidka narx</b> — chegirma narxi, aksiya yoki maxsus mijozlar uchun</li>
            <li>• <b>VIP narx</b> — VIP mijozlar uchun maxsus narx</li>
            <li>• <b>Olish narxi</b> — postavshikdan kirim narxi</li>
          </ul>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi narx turi</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nomi *</label>
                <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Masalan: Opt narx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kod</label>
                  <Input value={form.kod} onChange={e => setForm({...form, kod: e.target.value})} placeholder="OPT" />
                </div>
                <div>
                  <label className="text-sm font-medium">Turi</label>
                  <select value={form.turi} onChange={e => setForm({...form, turi: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="sale">Sotish</option>
                    <option value="purchase">Olish</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.manual} onChange={e => setForm({...form, manual: e.target.checked})} />
                  Qo'lda hisoblash (avtomatik emas)
                </label>
              </div>
              {!form.manual && (
                <div>
                  <label className="text-sm font-medium">Markup foizi (%)</label>
                  <Input type="number" value={form.narx_foiz} onChange={e => setForm({...form, narx_foiz: Number(e.target.value)})} placeholder="20" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button onClick={handleAdd} className="bg-emerald-600">Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
