"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Gift, Plus, Pencil, Trash2, Calendar, Target, Percent, Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

const BONUS_TYPES = [
  { key: "qty_quantity",      label: "Miqdor uchun bonus",            icon: "📦" },
  { key: "qty_amount",        label: "Buyurtma summasi uchun",        icon: "💰" },
  { key: "qty_volume",        label: "Hajm uchun bonus",              icon: "📊" },
  { key: "mml_min_qty",       label: "MML tovar (min. miqdor)",       icon: "⬇️" },
  { key: "mml_max_qty",       label: "MML tovar (maks. miqdor)",      icon: "⬆️" },
  { key: "mml_total_qty",     label: "MML tovar (umumiy miqdor)",     icon: "📊" },
  { key: "mml_cat_min",       label: "MML kategoriya (min.)",         icon: "📁" },
  { key: "mml_cat_max",       label: "MML kategoriya (maks.)",        icon: "📁" },
  { key: "mml_cat_total",     label: "MML kategoriya (umumiy)",       icon: "📁" },
  { key: "block_whole",       label: "Blok uchun (to'liq)",           icon: "🎁" },
  { key: "block_total",       label: "Blok uchun (umumiy)",           icon: "🎯" },
]

export default function BonusesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    nomi: "", turi: "qty_quantity",
    sana_dan: "", sana_gacha: "",
    min_miqdor: 0, max_miqdor: 0,
    bonus_miqdor: 0, max_bonus: 0,
    barcha_mijozlar: true, barcha_tovarlar: true,
  })
  const [bonuses] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={Gift}
          gradient="amber"
          title="Bonus tizimi"
          subtitle="11 xil bonus turi — chegirma, cashback, mukofot"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> Yangi bonus
            </Button>
          }
        />

        {/* Bonus Types Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BONUS_TYPES.map(t => (
            <div key={t.key} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 hover:border-emerald-500/40 cursor-pointer transition" onClick={() => { setForm({ ...form, turi: t.key }); setShowAdd(true) }}>
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="text-sm font-medium">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Active Bonuses */}
        <div>
          <h2 className="text-lg font-bold mb-3">Faol bonuslar</h2>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead className="text-center">Chegirma %</TableHead>
                  <TableHead className="text-center">Bonus miqdor</TableHead>
                  <TableHead>Sana (dan-gacha)</TableHead>
                  <TableHead className="text-center">Tovarlar</TableHead>
                  <TableHead className="text-center">Mijozlar</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Bonuslar topilmadi
                      <div className="text-xs mt-1">Yuqoridagi turlardan birini tanlang</div>
                    </TableCell>
                  </TableRow>
                ) : bonuses.map((b: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{b.nomi}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{b.tur || "-"}</Badge></TableCell>
                    <TableCell className="text-center font-mono">{b.chegirma || 0}%</TableCell>
                    <TableCell className="text-center font-mono">{b.bonus_miqdor || 0}</TableCell>
                    <TableCell className="text-sm">{b.sana_dan} → {b.sana_gacha}</TableCell>
                    <TableCell className="text-center">{b.tovarlar_soni || "Barchasi"}</TableCell>
                    <TableCell className="text-center">{b.mijozlar_soni || "Barchasi"}</TableCell>
                    <TableCell className="text-center"><Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs">Faol</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button><Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yangi bonus yaratish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Bonus turi *</label>
                <select value={form.turi} onChange={e => setForm({...form, turi: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {BONUS_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Bonus nomi *</label>
                <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Masalan: Yangi yil bonus" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sana dan</label>
                  <Input type="date" value={form.sana_dan} onChange={e => setForm({...form, sana_dan: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Sana gacha</label>
                  <Input type="date" value={form.sana_gacha} onChange={e => setForm({...form, sana_gacha: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min miqdor</label>
                  <Input type="number" value={form.min_miqdor} onChange={e => setForm({...form, min_miqdor: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Max miqdor</label>
                  <Input type="number" value={form.max_miqdor} onChange={e => setForm({...form, max_miqdor: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Bonus miqdor</label>
                  <Input type="number" value={form.bonus_miqdor} onChange={e => setForm({...form, bonus_miqdor: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Maksimal bonus</label>
                  <Input type="number" value={form.max_bonus} onChange={e => setForm({...form, max_bonus: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.barcha_tovarlar} onChange={e => setForm({...form, barcha_tovarlar: e.target.checked})} />
                  Barcha tovarlarga
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.barcha_mijozlar} onChange={e => setForm({...form, barcha_mijozlar: e.target.checked})} />
                  Barcha mijozlarga
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button className="bg-primary">Yaratish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
