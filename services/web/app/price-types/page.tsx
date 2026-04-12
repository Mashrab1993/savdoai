"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Tag, Plus, AlertCircle, Search } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

type NarxGuruh = {
  id: number; nomi: string; izoh?: string; yaratilgan: string;
  klient_soni?: number;
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

export default function PriceTypesPage() {
  const [guruhlar, setGuruhlar] = useState<NarxGuruh[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nomi: "", izoh: "" })

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await api<NarxGuruh[]>("/api/v1/narx/guruhlar")
      setGuruhlar(Array.isArray(data) ? data : [])
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
      await api("/api/v1/narx/guruh", {
        method: "POST",
        body: JSON.stringify({
          nomi: form.nomi.trim(),
          izoh: form.izoh.trim(),
        }),
      })
      setShowAdd(false)
      setForm({ nomi: "", izoh: "" })
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const filtered = guruhlar.filter(g =>
    !search || g.nomi.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <PageHeader
          icon={Tag}
          gradient="amber"
          title="Narx turlari"
          subtitle="Klient kategoriyalari uchun maxsus narxlar — Opt/Roznitsa/VIP"
        />
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Yangi guruh
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search}
                 onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead className="text-center">Klientlar</TableHead>
                <TableHead>Yaratilgan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Narx guruhlari topilmadi
                  </TableCell>
                </TableRow>
              ) : filtered.map((g, i) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="text-sm">
                      {g.nomi}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.izoh || "—"}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {g.klient_soni || 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.yaratilgan ? new Date(g.yaratilgan).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="font-bold mb-1">💡 Narx guruhlari qanday ishlaydi:</div>
          <div>
            Har bir klientni bitta narx guruhiga biriktirishingiz mumkin (masalan:
            VIP, Optom, Kichik). Keyin har tovar uchun ushbu guruh uchun maxsus
            narx belgilaysiz. Sotuv paytida tizim avtomatik mos narxni qo&apos;llaydi.
            Klientlarni guruhga qo&apos;shish uchun{" "}
            <a href="/clients" className="underline font-semibold">/clients</a> sahifasidan foydalaning.
          </div>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi narx guruhi</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nomi *</Label>
                <Input value={form.nomi}
                       onChange={e => setForm({ ...form, nomi: e.target.value })}
                       placeholder="VIP, Optom, Kichik yoki boshqa" />
              </div>
              <div>
                <Label>Izoh</Label>
                <Textarea rows={3} value={form.izoh}
                          onChange={e => setForm({ ...form, izoh: e.target.value })}
                          placeholder="Guruh haqida qisqa tavsif..." />
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
