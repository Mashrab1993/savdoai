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
  Warehouse, Plus, Package, AlertCircle, Store, Building,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

type Filial = {
  id: number; nomi: string; manzil?: string; telefon?: string;
  turi: "dokon" | "ombor" | "sklad" | "filial";
  faol: boolean; asosiy: boolean;
  tovar_soni: number; ombor_qiymat: number;
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

const TURI_META: Record<string, { label: string; icon: typeof Store; color: string }> = {
  dokon:  { label: "Do'kon",  icon: Store,     color: "bg-sky-100 text-sky-800" },
  ombor:  { label: "Ombor",   icon: Warehouse, color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  sklad:  { label: "Sklad",   icon: Package,   color: "bg-blue-500/15 text-blue-800 dark:text-blue-300" },
  filial: { label: "Filial",  icon: Building,  color: "bg-violet-500/15 text-purple-800" },
}

export default function WarehousesPage() {
  const [filiallar, setFiliallar] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nomi: "", manzil: "", telefon: "", turi: "dokon",
  })

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await api<{ items: Filial[] }>("/api/v1/filial")
      setFiliallar(data.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    if (!form.nomi.trim()) return
    setSaving(true)
    try {
      await api("/api/v1/filial", {
        method: "POST",
        body: JSON.stringify({
          nomi:    form.nomi.trim(),
          manzil:  form.manzil.trim(),
          telefon: form.telefon.trim(),
          turi:    form.turi,
        }),
      })
      setShowAdd(false)
      setForm({ nomi: "", manzil: "", telefon: "", turi: "dokon" })
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    jami:        filiallar.length,
    dokonlar:    filiallar.filter(f => f.turi === "dokon").length,
    omborlar:    filiallar.filter(f => f.turi === "ombor" || f.turi === "sklad").length,
    jami_qiymat: filiallar.reduce((s, f) => s + Number(f.ombor_qiymat || 0), 0),
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={Warehouse}
          gradient="blue"
          title="Omborlar va do'konlar"
          subtitle="Multi-filial boshqaruv — do'kon, ombor, sklad, filial"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> Yangi
            </Button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami filiallar</div>
            <div className="text-2xl font-bold mt-1">{stats.jami}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Do&apos;konlar</div>
            <div className="text-2xl font-bold mt-1 text-sky-600">{stats.dokonlar}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Omborlar</div>
            <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.omborlar}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami qiymat</div>
            <div className="text-xl font-bold mt-1 text-emerald-600">
              {formatCurrency(stats.jami_qiymat)}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Manzil</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-center">Tovarlar</TableHead>
                <TableHead className="text-right">Qiymat</TableHead>
                <TableHead className="text-center">Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filiallar.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <Warehouse className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Filiallar topilmadi. Yangi qo&apos;shing!
                  </TableCell>
                </TableRow>
              ) : filiallar.map((f, i) => {
                const meta = TURI_META[f.turi] || TURI_META.dokon
                const Icon = meta.icon
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {f.nomi}
                      {f.asosiy && (
                        <Badge className="ml-2 text-xs" variant="default">Asosiy</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={meta.color}>
                        <Icon className="w-3 h-3 mr-1 inline" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.manzil || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.telefon || "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">{f.tovar_soni || 0}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(Number(f.ombor_qiymat || 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={f.faol ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-muted text-foreground"}>
                        {f.faol ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
          <div className="font-bold mb-1">📦 Multi-filial ish tizimi:</div>
          <div>
            Har bir filial o&apos;zining tovar qoldiqlarini saqlaydi. Tovarlarni
            filiallar orasida ko&apos;chirish uchun{" "}
            <a href="/transfers" className="underline font-semibold">/transfers</a>{" "}
            sahifasiga o&apos;ting. Asosiy filial birinchi yaratilgandan so&apos;ng
            avtomatik belgilanadi.
          </div>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi filial qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nomi *</Label>
                <Input value={form.nomi}
                       onChange={e => setForm({ ...form, nomi: e.target.value })}
                       placeholder="Masalan: Chorsu do'koni" />
              </div>
              <div>
                <Label>Turi</Label>
                <select
                  value={form.turi}
                  onChange={e => setForm({ ...form, turi: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="dokon">Do&apos;kon</option>
                  <option value="ombor">Ombor</option>
                  <option value="sklad">Sklad</option>
                  <option value="filial">Filial</option>
                </select>
              </div>
              <div>
                <Label>Manzil</Label>
                <Input value={form.manzil}
                       onChange={e => setForm({ ...form, manzil: e.target.value })} />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.telefon}
                       onChange={e => setForm({ ...form, telefon: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
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
