"use client"
import { useState, useEffect, useCallback } from "react"
import { PageLoading } from "@/components/shared/page-states"
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
import { RotateCcw, Search, Package, Plus, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

type Qaytarish = {
  id: number; chiqim_id?: number; sessiya_id?: number;
  klient_ismi?: string; tovar_nomi: string;
  miqdor: number; birlik?: string; narx: number;
  jami: number; sabab?: string; sana: string;
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

const todayISO    = () => new Date().toISOString().split("T")[0]
const monthAgoISO = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function ReturnsPage() {
  const [items, setItems] = useState<Qaytarish[]>([])
  const [stats, setStats] = useState<{ soni?: number; jami_summa?: number; jami_miqdor?: number }>({})
  const [search, setSearch] = useState("")
  const [sanaDan, setSanaDan] = useState(monthAgoISO())
  const [sanaGacha, setSanaGacha] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    klient_ismi: "", tovar_nomi: "", miqdor: "1", narx: "", sabab: "", birlik: "dona",
  })

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha })
      if (search) qs.set("qidiruv", search)
      const data = await api<{ items: Qaytarish[]; stats: typeof stats }>(
        `/api/v1/qaytarishlar?${qs}`
      )
      setItems(data.items || [])
      setStats(data.stats || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [sanaDan, sanaGacha, search])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  async function handleSave() {
    if (!form.tovar_nomi.trim()) return
    setSaving(true)
    try {
      await api("/api/v1/qaytarish", {
        method: "POST",
        body: JSON.stringify({
          klient_ismi: form.klient_ismi.trim() || null,
          tovar_nomi:  form.tovar_nomi.trim(),
          miqdor:      Number(form.miqdor) || 0,
          birlik:      form.birlik || "dona",
          narx:        Number(form.narx) || 0,
          sabab:       form.sabab.trim() || null,
        }),
      })
      setShowAdd(false)
      setForm({ klient_ismi: "", tovar_nomi: "", miqdor: "1", narx: "", sabab: "", birlik: "dona" })
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
        <PageHeader
          icon={RotateCcw}
          gradient="amber"
          title="Qaytarishlar (Vozvrat)"
          subtitle="Mijozdan qaytarilgan tovarlar — avtomatik ombor qoldig'iga qaytaradi"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div></div>
          <div className="flex gap-2 items-center flex-wrap">
            <Input type="date" value={sanaDan}   onChange={e => setSanaDan(e.target.value)}   className="w-40" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} className="w-40" />
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> Yangi
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Qaytarish soni</div>
            <div className="text-2xl font-bold mt-1">{stats.soni || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Jami miqdor</div>
            <div className="text-2xl font-bold mt-1">{Number(stats.jami_miqdor || 0).toLocaleString()}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 border-orange-500/40">
            <div className="text-xs text-muted-foreground">Jami summa (zarar)</div>
            <div className="text-xl font-bold mt-1 text-orange-600">
              {formatCurrency(Number(stats.jami_summa || 0))}
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Mijoz yoki tovar nomi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Mijoz</TableHead>
                <TableHead>Tovar</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
                <TableHead className="text-right">Narx</TableHead>
                <TableHead className="text-right">Jami</TableHead>
                <TableHead className="text-center">Sabab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-orange-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Qaytarishlar topilmadi
                  </TableCell>
                </TableRow>
              ) : items.map((r, i) => (
                <TableRow key={r.id} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(r.sana).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell className="font-medium">{r.klient_ismi || "—"}</TableCell>
                  <TableCell>{r.tovar_nomi}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(r.miqdor).toFixed(0)} {r.birlik || ""}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(Number(r.narx))}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-orange-600">
                    {formatCurrency(Number(r.jami))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {r.sabab || "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi qaytarish</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Mijoz ismi</Label>
                <Input value={form.klient_ismi}
                       onChange={e => setForm({ ...form, klient_ismi: e.target.value })}
                       placeholder="Ixtiyoriy" />
              </div>
              <div>
                <Label>Tovar nomi *</Label>
                <Input value={form.tovar_nomi}
                       onChange={e => setForm({ ...form, tovar_nomi: e.target.value })}
                       placeholder="Ariel 3kg" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Miqdor *</Label>
                  <Input type="number" value={form.miqdor}
                         onChange={e => setForm({ ...form, miqdor: e.target.value })} />
                </div>
                <div>
                  <Label>Birlik</Label>
                  <Input value={form.birlik}
                         onChange={e => setForm({ ...form, birlik: e.target.value })} />
                </div>
                <div>
                  <Label>Narx *</Label>
                  <Input type="number" value={form.narx}
                         onChange={e => setForm({ ...form, narx: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Sabab</Label>
                <Input value={form.sabab}
                       onChange={e => setForm({ ...form, sabab: e.target.value })}
                       placeholder="Masalan: yaroqlilik muddati" />
              </div>
              {Number(form.miqdor) > 0 && Number(form.narx) > 0 && (
                <div className="text-right text-sm text-muted-foreground">
                  Jami: <span className="font-bold text-orange-600">
                    {formatCurrency(Number(form.miqdor) * Number(form.narx))}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Bekor</Button>
              <Button onClick={handleSave} disabled={saving || !form.tovar_nomi.trim()}>
                {saving ? "Saqlanmoqda..." : "Qaytarishni saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
