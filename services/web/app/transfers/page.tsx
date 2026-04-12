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
  ArrowRightLeft, Plus, Package, AlertCircle, ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import WarehouseTransferBoard, { type TransferStatus } from "@/components/dashboard/warehouse-transfer-board"

type Transfer = {
  id: number; dan_filial_id: number; ga_filial_id: number;
  tovar_id: number; tovar_nomi: string; miqdor: number;
  holat: string; izoh?: string; yaratilgan: string;
  dan_nomi?: string; ga_nomi?: string;
}

type Filial = { id: number; nomi: string }
type Tovar  = { id: number; nomi: string }

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

const HOLAT_META: Record<string, { label: string; color: string }> = {
  kutilmoqda:   { label: "Kutilmoqda", color: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  tasdiqlangan: { label: "Tasdiqlangan", color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  bekor:        { label: "Bekor",      color: "bg-rose-500/15 text-rose-800 dark:text-rose-300" },
}

export default function TransfersPage() {
  const [items, setItems] = useState<Transfer[]>([])
  const [stats, setStats] = useState<{ soni?: number; jami_miqdor?: number }>({})
  const [filiallar, setFiliallar] = useState<Filial[]>([])
  const [tovarlar, setTovarlar] = useState<Tovar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    dan_filial_id: "", ga_filial_id: "",
    tovar_id: "", miqdor: "1", izoh: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await api<{ items: Transfer[]; stats: typeof stats }>(
        "/api/v1/filial/transferlar"
      )
      setItems(data.items || [])
      setStats(data.stats || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    api<{ items: Filial[] }>("/api/v1/filial")
      .then(d => setFiliallar(d.items || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api<{ items: Array<{ id: number; nomi: string }> }>("/api/v1/tovarlar?limit=500")
      .then(d => setTovarlar((d.items || []).map(t => ({ id: t.id, nomi: t.nomi }))))
      .catch(() => {})
  }, [])

  async function handleSave() {
    if (!form.dan_filial_id || !form.ga_filial_id || !form.tovar_id || !form.miqdor) return
    if (form.dan_filial_id === form.ga_filial_id) {
      alert("Bir filialga o'zidan ko'chira olmaysiz"); return
    }
    setSaving(true)
    try {
      await api("/api/v1/filial/transfer", {
        method: "POST",
        body: JSON.stringify({
          dan_filial_id: Number(form.dan_filial_id),
          ga_filial_id:  Number(form.ga_filial_id),
          tovar_id:      Number(form.tovar_id),
          miqdor:        Number(form.miqdor),
          izoh:          form.izoh,
        }),
      })
      setShowAdd(false)
      setForm({ dan_filial_id: "", ga_filial_id: "", tovar_id: "", miqdor: "1", izoh: "" })
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-7 h-7 text-blue-600" />
              Transferlar (Ko&apos;chirish)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Filiallar orasida tovar ko&apos;chirish — avtomatik qoldiq yangilanadi
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} disabled={filiallar.length < 2}>
            <Plus className="w-4 h-4 mr-1" /> Yangi transfer
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Transferlar soni</div>
            <div className="text-2xl font-bold mt-1">{stats.soni || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Jami miqdor</div>
            <div className="text-2xl font-bold mt-1">{Number(stats.jami_miqdor || 0).toLocaleString()}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Filiallar</div>
            <div className="text-2xl font-bold mt-1">{filiallar.length}</div>
          </div>
        </div>

        {filiallar.length < 2 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
            ⚠️ Transfer qilish uchun kamida 2 ta filial kerak.{" "}
            <a href="/warehouses" className="underline font-semibold">/warehouses</a> sahifasida qo&apos;shing.
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {/* Premium transfer board */}
        {!loading && items.length > 0 && (
          <WarehouseTransferBoard
            transfers={items.map(t => ({
              id:              t.id,
              dan_filial_id:   t.dan_filial_id,
              dan_filial_nomi: t.dan_nomi,
              ga_filial_id:    t.ga_filial_id,
              ga_filial_nomi:  t.ga_nomi,
              tovar_nomi:      t.tovar_nomi,
              miqdor:          t.miqdor,
              holat:           (t.holat || "kutilmoqda") as TransferStatus,
              izoh:            t.izoh,
              yaratilgan:      t.yaratilgan,
            }))}
            onApprove={async (id) => {
              try { await api(`/api/v1/filial/transfer/${id}/tasdiqlash`, { method: "PUT" }); fetchData() } catch {}
            }}
            onCancel={async (id) => {
              try { await api(`/api/v1/filial/transfer/${id}/bekor`, { method: "PUT" }); fetchData() } catch {}
            }}
          />
        )}

        {/* Legacy table (shown only when no transfers exist) */}
        {!loading && items.length === 0 && (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Tovar</TableHead>
                <TableHead>Yo&apos;nalish</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead>Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Transferlar topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map((t, i) => {
                const meta = HOLAT_META[t.holat] || HOLAT_META.kutilmoqda
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(t.yaratilgan).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell className="font-medium">{t.tovar_nomi}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">{t.dan_nomi || "—"}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold">{t.ga_nomi || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {Number(t.miqdor).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={meta.color}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.izoh || "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Qayerdan *</Label>
                <select
                  value={form.dan_filial_id}
                  onChange={e => setForm({ ...form, dan_filial_id: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="">— Tanlang —</option>
                  {filiallar.map(f => (
                    <option key={f.id} value={f.id}>{f.nomi}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Qayerga *</Label>
                <select
                  value={form.ga_filial_id}
                  onChange={e => setForm({ ...form, ga_filial_id: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="">— Tanlang —</option>
                  {filiallar.filter(f => String(f.id) !== form.dan_filial_id).map(f => (
                    <option key={f.id} value={f.id}>{f.nomi}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tovar *</Label>
                <select
                  value={form.tovar_id}
                  onChange={e => setForm({ ...form, tovar_id: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="">— Tanlang —</option>
                  {tovarlar.map(t => (
                    <option key={t.id} value={t.id}>{t.nomi}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Miqdor *</Label>
                <Input type="number" value={form.miqdor}
                       onChange={e => setForm({ ...form, miqdor: e.target.value })} />
              </div>
              <div>
                <Label>Izoh</Label>
                <Input value={form.izoh}
                       onChange={e => setForm({ ...form, izoh: e.target.value })}
                       placeholder="Sabab yoki qo'shimcha ma'lumot" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Transfer qilish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
