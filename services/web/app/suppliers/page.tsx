"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Building2, Plus, Search, Phone, Pencil, Trash2, ShoppingCart, AlertCircle,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import SupplierBalance from "@/components/dashboard/supplier-balance"
import { formatCurrency } from "@/lib/format"

type Supplier = {
  id: number; nomi: string; telefon?: string; telegram_id?: number;
  kategoriyalar?: string[]; faol: boolean; yaratilgan: string;
  buyurtma_soni: number; jami_xarid: number;
}

async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
  const base  = process.env.NEXT_PUBLIC_API_URL || ""
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nomi: "", telefon: "", telegram_id: "", kategoriyalar: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = search ? `?qidiruv=${encodeURIComponent(search)}` : ""
      const data = await api<{ items: Supplier[] }>(`/api/v1/suppliers${qs}`)
      setSuppliers(data.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  function openAdd() {
    setForm({ nomi: "", telefon: "", telegram_id: "", kategoriyalar: "" })
    setEditing(null)
    setShowAdd(true)
  }

  function openEdit(s: Supplier) {
    setForm({
      nomi:          s.nomi,
      telefon:       s.telefon || "",
      telegram_id:   s.telegram_id ? String(s.telegram_id) : "",
      kategoriyalar: (s.kategoriyalar || []).join(", "),
    })
    setEditing(s)
    setShowAdd(true)
  }

  async function handleSave() {
    if (!form.nomi.trim()) return
    setSaving(true)
    try {
      const payload = {
        nomi:          form.nomi.trim(),
        telefon:       form.telefon.trim() || undefined,
        telegram_id:   form.telegram_id ? Number(form.telegram_id) : undefined,
        kategoriyalar: form.kategoriyalar
          ? form.kategoriyalar.split(",").map(s => s.trim()).filter(Boolean)
          : undefined,
      }
      if (editing) {
        await api(`/api/v1/supplier/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        await api("/api/v1/supplier", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
      setShowAdd(false)
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(s: Supplier) {
    if (!confirm(`"${s.nomi}" ni o'chirishni tasdiqlaysizmi?`)) return
    try {
      await api(`/api/v1/supplier/${s.id}`, { method: "DELETE" })
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-7 h-7 text-emerald-600" />
              Yetkazib beruvchilar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Postavshiklar ro'yxati — SavdoAI CRM bilan integratsiya
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Yangi
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nom yoki telefon bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Premium supplier balance overview — real data from enriched endpoint */}
        {!loading && suppliers.length > 0 && (
          <SupplierBalance
            suppliers={suppliers.map((s: any) => ({
              id:               s.id,
              nomi:             s.nomi,
              telefon:          s.telefon,
              kategoriya:       Array.isArray(s.kategoriyalar) ? s.kategoriyalar[0] : undefined,
              balans:           Number(s.balans ?? 0),
              jami_xarid:       Number(s.jami_xarid ?? 0),
              aktiv_buyurtma:   Number(s.aktiv_buyurtma ?? 0),
              oxirgi_kirim:     s.oxirgi_kirim || undefined,
            }))}
          />
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Kategoriyalar</TableHead>
                <TableHead className="text-center">Buyurtmalar</TableHead>
                <TableHead className="text-right">Jami xarid</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Yetkazib beruvchilar topilmadi
                  </TableCell>
                </TableRow>
              ) : suppliers.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.nomi}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" /> {s.telefon || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {(s.kategoriyalar || []).length > 0
                      ? (s.kategoriyalar || []).map(k => (
                          <Badge key={k} variant="outline" className="mr-1">{k}</Badge>
                        ))
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center font-mono">{s.buyurtma_soni}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(Number(s.jami_xarid))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={s.faol ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-muted text-foreground"}>
                      {s.faol ? "Faol" : "Nofaol"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"
                              onClick={() => handleDelete(s)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Xarid buyurtma tugma */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <ShoppingCart className="w-4 h-4" />
            <span>Xarid buyurtma yaratish uchun <a href="/purchase" className="font-semibold underline">/purchase</a> sahifasiga o&apos;ting</span>
          </div>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Yetkazib beruvchi tahrirlash" : "Yangi yetkazib beruvchi"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nomi *</Label>
                <Input value={form.nomi}
                       onChange={e => setForm({ ...form, nomi: e.target.value })}
                       placeholder="Kompaniya nomi" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.telefon}
                       onChange={e => setForm({ ...form, telefon: e.target.value })}
                       placeholder="+998 90 123 45 67" />
              </div>
              <div>
                <Label>Telegram ID (ixtiyoriy)</Label>
                <Input type="number" value={form.telegram_id}
                       onChange={e => setForm({ ...form, telegram_id: e.target.value })}
                       placeholder="123456789" />
              </div>
              <div>
                <Label>Kategoriyalar (vergul bilan)</Label>
                <Input value={form.kategoriyalar}
                       onChange={e => setForm({ ...form, kategoriyalar: e.target.value })}
                       placeholder="Vetapteka, Ozuqa, Urug'" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Bekor
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.nomi.trim()}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
