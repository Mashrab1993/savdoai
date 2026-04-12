"use client"
import { useState, useEffect, useCallback } from "react"
import { PageLoading } from "@/components/shared/page-states"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Camera, Search, Image as ImageIcon, MapPin, Calendar, AlertCircle,
  CheckCircle2, LogOut,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

type PhotoItem = {
  id: number; klient_id: number; turi: "checkin" | "checkout";
  vaqt: string; foto_url: string; izoh?: string;
  latitude?: number; longitude?: number;
  klient_nomi?: string; manzil?: string;
}

async function api<T = unknown>(path: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
  const base  = process.env.NEXT_PUBLIC_API_URL || ""
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

const todayISO    = () => new Date().toISOString().split("T")[0]
const monthAgoISO = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function PhotoReportsPage() {
  const [items, setItems] = useState<PhotoItem[]>([])
  const [stats, setStats] = useState<{ jami?: number; bugun?: number; hafta?: number; oy?: number }>({})
  const [search, setSearch] = useState("")
  const [sanaDan, setSanaDan] = useState(monthAgoISO())
  const [sanaGacha, setSanaGacha] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<PhotoItem | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha })
      if (search) qs.set("qidiruv", search)
      const data = await api<{ items: PhotoItem[]; stats: typeof stats }>(
        `/api/v1/photo-reports?${qs}`
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <PageHeader
          icon={Camera}
          gradient="violet"
          title="Foto hisobotlar"
          subtitle="Agentlar tomonidan yuklangan check-in/check-out rasmlari"
        />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Input type="date" value={sanaDan}   onChange={e => setSanaDan(e.target.value)}   className="w-40" />
            <span className="text-muted-foreground self-center">—</span>
            <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} className="w-40" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-purple-600">Jami fotolar</div>
            <div className="text-2xl font-bold mt-1">{stats.jami || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-emerald-600">Bugungi</div>
            <div className="text-2xl font-bold mt-1">{stats.bugun || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-sky-600">Bu hafta</div>
            <div className="text-2xl font-bold mt-1">{stats.hafta || 0}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-xs text-orange-600">Bu oy</div>
            <div className="text-2xl font-bold mt-1">{stats.oy || 0}</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Mijoz ismi bo'yicha..."
                 value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-purple-500 rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-20 text-center">
            <Camera className="w-16 h-16 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">Foto hisobotlar topilmadi</p>
            <p className="text-sm text-muted-foreground mt-1">
              Agentlar checkin/checkout qilganda rasmlar bu yerda ko&apos;rinadi
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map(p => (
              <div key={p.id}
                   className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer"
                   onClick={() => setPreview(p)}>
                <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden">
                  {p.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.foto_url} alt={p.klient_nomi || "foto"}
                         className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate">{p.klient_nomi || "Mijoz"}</div>
                  {p.manzil && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {p.manzil}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {new Date(p.vaqt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                  <Badge variant={p.turi === "checkin" ? "default" : "secondary"} className="mt-2 text-xs">
                    {p.turi === "checkin"
                      ? <><CheckCircle2 className="w-3 h-3 mr-1 inline" />Check-in</>
                      : <><LogOut className="w-3 h-3 mr-1 inline" />Check-out</>}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{preview?.klient_nomi || "Foto"}</DialogTitle>
            </DialogHeader>
            {preview && (
              <div className="space-y-3">
                {preview.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.foto_url} alt="preview"
                       className="w-full max-h-[70vh] object-contain rounded-lg" />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {preview.manzil && (
                    <div><span className="text-muted-foreground">Manzil:</span> {preview.manzil}</div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Sana:</span>{" "}
                    {new Date(preview.vaqt).toLocaleString("uz-UZ")}
                  </div>
                  {preview.latitude && preview.longitude && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">GPS:</span>{" "}
                      <a className="text-blue-600 underline"
                         href={`https://yandex.uz/maps/?pt=${preview.longitude},${preview.latitude}&z=17&l=map`}
                         target="_blank" rel="noopener noreferrer">
                        {preview.latitude}, {preview.longitude}
                      </a>
                    </div>
                  )}
                  {preview.izoh && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Izoh:</span> {preview.izoh}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
