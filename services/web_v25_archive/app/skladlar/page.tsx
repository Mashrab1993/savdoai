"use client"

/**
 * Skladlar (omborlar) — CRUD sahifa.
 * SalesDoc /settings/warehouses analog.
 */

import { useState, useCallback, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { skladCrudService, type Sklad } from "@/lib/api/services"
import {
  Warehouse, Plus, Edit, Trash2, Search, Package, Tag,
} from "lucide-react"

const SKLAD_TURI_OPTIONS = [
  { value: "asosiy", label: "Asosiy sklad", accent: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { value: "brak",   label: "Brak (sifatsiz)", accent: "bg-red-500/15 text-red-700 dark:text-red-300" },
  { value: "aksiya", label: "Aksiya",         accent: "bg-green-500/15 text-green-700 dark:text-green-300" },
  { value: "qaytarish", label: "Qaytarish",   accent: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
]

function SkladDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Sklad | null
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    nomi: "", turi: "asosiy", kod: "", faol: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setForm({
        nomi: initial?.nomi || "",
        turi: initial?.turi || "asosiy",
        kod: initial?.kod || "",
        faol: initial?.faol ?? true,
      })
      setError("")
    }
  }, [open, initial])

  const save = async () => {
    if (!form.nomi.trim()) { setError("Nomi bo'sh bo'lishi mumkin emas"); return }
    setSaving(true); setError("")
    try {
      if (initial?.id) {
        await skladCrudService.update(initial.id, form)
      } else {
        await skladCrudService.create(form)
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xato")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-white" />
            </div>
            {initial?.id ? "Skladni tahrirlash" : "Yangi sklad"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Nomi *</Label>
            <Input autoFocus placeholder="Asosiy sklad, brak, aksiya..." value={form.nomi}
              onChange={(e) => setForm(f => ({ ...f, nomi: e.target.value }))} />
          </div>
          <div>
            <Label>Turi</Label>
            <select value={form.turi}
              onChange={(e) => setForm(f => ({ ...f, turi: e.target.value }))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              {SKLAD_TURI_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Kod</Label>
            <Input placeholder="Ixtiyoriy" value={form.kod}
              onChange={(e) => setForm(f => ({ ...f, kod: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <Label>Faol</Label>
            <Switch checked={form.faol} onCheckedChange={(v) => setForm(f => ({ ...f, faol: v }))} />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-500/10 rounded p-2">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
          <Button onClick={save} disabled={saving}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            {saving ? "Saqlanyapti..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default function SkladlarPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Sklad | null>(null)
  const { data, loading, error, refetch } = useApi(() => skladCrudService.list(), [])

  const items = (data?.items || []).filter(s =>
    !search || s.nomi.toLowerCase().includes(search.toLowerCase()) ||
    (s.kod || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = useCallback(async (it: Sklad) => {
    if (!confirm(`"${it.nomi}"ni o'chiramizmi? ${it.sotuv_soni > 0 ? `(${it.sotuv_soni} ta sotuvga bog'langan)` : ""}`)) return
    try {
      await skladCrudService.remove(it.id)
      refetch()
    } catch (e) {
      alert("Xato: " + (e instanceof Error ? e.message : String(e)))
    }
  }, [refetch])

  return (
    <AdminLayout title="Skladlar">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-cyan-700 via-blue-700 to-indigo-800 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Warehouse className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Skladlar (omborlar)</h2>
            <p className="text-sm opacity-80 mb-4">
              Tovarlarni saqlash joylari — asosiy, brak, aksiya, qaytarish.
            </p>
            <div className="flex gap-4 flex-wrap">
              {SKLAD_TURI_OPTIONS.map(opt => {
                const count = (data?.items || []).filter(s => s.turi === opt.value).length
                return (
                  <div key={opt.value} className="bg-white/10 rounded-lg px-3 py-2">
                    <div className="text-xs opacity-80">{opt.label}</div>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={error} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Nomi yoki koddan qidirish..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10" />
              </div>
              <Button
                onClick={() => { setEditItem(null); setDialogOpen(true) }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Yangi sklad
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-center">Sotuvlar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Warehouse className="w-12 h-12 mx-auto opacity-30 mb-2" />
                        {search ? "Qidiruvga mos sklad yo'q" : "Sklad yo'q. Yangi qo'shing."}
                      </TableCell>
                    </TableRow>
                  ) : items.map((s) => {
                    const turiMeta = SKLAD_TURI_OPTIONS.find(o => o.value === s.turi)
                    return (
                      <TableRow key={s.id} className={!s.faol ? "opacity-60" : ""}>
                        <TableCell className="font-mono text-xs">#{s.id}</TableCell>
                        <TableCell className="font-semibold">{s.nomi}</TableCell>
                        <TableCell>
                          <Badge className={turiMeta?.accent || ""}>
                            {turiMeta?.label || s.turi || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.kod || "—"}</TableCell>
                        <TableCell className="text-center">
                          {s.sotuv_soni > 0 ? (
                            <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                              <Package className="w-3 h-3 mr-1 inline" /> {s.sotuv_soni}
                            </Badge>
                          ) : <span className="text-muted-foreground">0</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.faol ? "default" : "outline"}
                            className={s.faol ? "bg-green-500/15 text-green-700 dark:text-green-300" : ""}>
                            {s.faol ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost"
                            onClick={() => { setEditItem(s); setDialogOpen(true) }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost"
                            onClick={() => handleDelete(s)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {dialogOpen && (
          <SkladDialog
            open={dialogOpen} onOpenChange={setDialogOpen}
            initial={editItem} onSaved={refetch} />
        )}
      </div>
    </AdminLayout>
  )
}
