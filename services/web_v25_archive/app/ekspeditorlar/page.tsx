"use client"

/**
 * Ekspeditorlar (yetkazib beruvchilar) — CRUD sahifa.
 * SalesDoc /settings/expeditors analog.
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
import { ekspeditorCrudService, type Ekspeditor } from "@/lib/api/services"
import {
  Truck, Plus, Edit, Trash2, Phone, Car, Search, Package,
} from "lucide-react"


function EkspeditorDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Ekspeditor | null
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    ism: "", telefon: "", mashina_nomi: "", mashina_raqami: "", faol: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setForm({
        ism: initial?.ism || "",
        telefon: initial?.telefon || "",
        mashina_nomi: initial?.mashina_nomi || "",
        mashina_raqami: initial?.mashina_raqami || "",
        faol: initial?.faol ?? true,
      })
      setError("")
    }
  }, [open, initial])

  const save = async () => {
    if (!form.ism.trim()) { setError("Ism bo'sh bo'lishi mumkin emas"); return }
    setSaving(true); setError("")
    try {
      if (initial?.id) {
        await ekspeditorCrudService.update(initial.id, form)
      } else {
        await ekspeditorCrudService.create(form)
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            {initial?.id ? "Ekspeditor tahrirlash" : "Yangi ekspeditor"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Ism *</Label>
            <Input autoFocus placeholder="Masalan: Karim aka" value={form.ism}
              onChange={(e) => setForm(f => ({ ...f, ism: e.target.value }))} />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input placeholder="+998 90 123 4567" value={form.telefon}
              onChange={(e) => setForm(f => ({ ...f, telefon: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mashina nomi</Label>
              <Input placeholder="Damas, Labo..." value={form.mashina_nomi}
                onChange={(e) => setForm(f => ({ ...f, mashina_nomi: e.target.value }))} />
            </div>
            <div>
              <Label>Raqami</Label>
              <Input placeholder="01 A 123 AB" value={form.mashina_raqami}
                onChange={(e) => setForm(f => ({ ...f, mashina_raqami: e.target.value }))} />
            </div>
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
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            {saving ? "Saqlanyapti..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default function EkspeditorlarPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Ekspeditor | null>(null)
  const { data, loading, error, refetch } = useApi(() => ekspeditorCrudService.list(), [])

  const items = (data?.items || []).filter(e =>
    !search || e.ism.toLowerCase().includes(search.toLowerCase()) ||
    (e.telefon || "").includes(search) ||
    (e.mashina_raqami || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = useCallback(async (it: Ekspeditor) => {
    if (!confirm(`"${it.ism}"ni o'chiramizmi? ${it.sotuv_soni > 0 ? `(${it.sotuv_soni} ta sotuvga bog'langan)` : ""}`)) return
    try {
      await ekspeditorCrudService.remove(it.id)
      refetch()
    } catch (e) {
      alert("Xato: " + (e instanceof Error ? e.message : String(e)))
    }
  }, [refetch])

  const faolCount = (data?.items || []).filter(e => e.faol).length

  return (
    <AdminLayout title="Ekspeditorlar">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-amber-700 via-orange-700 to-red-800 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Truck className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Ekspeditorlar</h2>
            <p className="text-sm opacity-80 mb-4">
              Yetkazib beruvchilar ro&apos;yxati — mashina, raqam, telefon.
              Nakladnoy registr yaratishda ishlatiladi.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <div className="text-xs opacity-80">Jami</div>
                <div className="text-2xl font-bold">{data?.jami || 0}</div>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <div className="text-xs opacity-80">Faol</div>
                <div className="text-2xl font-bold">{faolCount}</div>
              </div>
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
                <Input placeholder="Ism, telefon yoki raqamdan qidirish..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10" />
              </div>
              <Button
                onClick={() => { setEditItem(null); setDialogOpen(true) }}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Yangi ekspeditor
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Ism</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Mashina</TableHead>
                    <TableHead className="text-center">Sotuvlar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Truck className="w-12 h-12 mx-auto opacity-30 mb-2" />
                        {search ? "Qidiruvga mos ekspeditor yo'q" : "Ekspeditor yo'q. Yangi qo'shing."}
                      </TableCell>
                    </TableRow>
                  ) : items.map((e) => (
                    <TableRow key={e.id} className={!e.faol ? "opacity-60" : ""}>
                      <TableCell className="font-mono text-xs">#{e.id}</TableCell>
                      <TableCell className="font-semibold">{e.ism}</TableCell>
                      <TableCell>
                        {e.telefon && (
                          <a href={`tel:${e.telefon}`} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone className="w-3 h-3" /> {e.telefon}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        {e.mashina_nomi && (
                          <div className="flex items-center gap-1 text-sm">
                            <Car className="w-3 h-3 text-muted-foreground" />
                            {e.mashina_nomi}
                            {e.mashina_raqami && (
                              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded ml-1">
                                {e.mashina_raqami}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {e.sotuv_soni > 0 ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <Package className="w-3 h-3 mr-1 inline" /> {e.sotuv_soni}
                          </Badge>
                        ) : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.faol ? "default" : "outline"}
                          className={e.faol ? "bg-green-500/15 text-green-700 dark:text-green-300" : ""}>
                          {e.faol ? "Faol" : "Nofaol"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost"
                          onClick={() => { setEditItem(e); setDialogOpen(true) }}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(e)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {dialogOpen && (
          <EkspeditorDialog
            open={dialogOpen} onOpenChange={setDialogOpen}
            initial={editItem} onSaved={refetch} />
        )}
      </div>
    </AdminLayout>
  )
}
