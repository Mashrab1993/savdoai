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
  CheckCircle2, LogOut, Users, ImagePlus,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type PhotoItem = {
  id: number; klient_id: number; turi: "checkin" | "checkout";
  vaqt: string; foto_url: string; izoh?: string;
  latitude?: number; longitude?: number;
  klient_nomi?: string; manzil?: string;
  agent_ismi?: string; agent_id?: number;
}

type AgentOption = { id: number; ism: string }

interface PhotoStats {
  jami?: number
  bugun?: number
  hafta?: number
  oy?: number
  agentlar_soni?: number
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
  const { locale } = useLocale()
  const [items, setItems] = useState<PhotoItem[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [stats, setStats] = useState<PhotoStats>({})
  const [search, setSearch] = useState("")
  const [sanaDan, setSanaDan] = useState(monthAgoISO())
  const [sanaGacha, setSanaGacha] = useState(todayISO())
  const [agentId, setAgentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<PhotoItem | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = new URLSearchParams({ sana_dan: sanaDan, sana_gacha: sanaGacha })
      if (search) qs.set("qidiruv", search)
      if (agentId) qs.set("agent_id", String(agentId))
      const data = await api<{ items: PhotoItem[]; stats: PhotoStats; agents: AgentOption[] }>(
        `/api/v1/photo-reports?${qs}`
      )
      setItems(data.items || [])
      setStats(data.stats || {})
      setAgents(data.agents || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [sanaDan, sanaGacha, search, agentId])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  const statCards = [
    {
      label: locale === "uz" ? "Jami fotolar" : "Всего фото",
      value: String(stats.jami || 0),
      icon: Camera,
      tone: "violet" as const,
    },
    {
      label: locale === "uz" ? "Agentlar soni" : "Кол-во агентов",
      value: String(stats.agentlar_soni || 0),
      icon: Users,
      tone: "emerald" as const,
    },
    {
      label: locale === "uz" ? "Bu hafta" : "На этой неделе",
      value: String(stats.hafta || 0),
      icon: ImagePlus,
      tone: "blue" as const,
    },
    {
      label: locale === "uz" ? "Bugungi" : "Сегодня",
      value: String(stats.bugun || 0),
      icon: CheckCircle2,
      tone: "amber" as const,
    },
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={Camera}
          gradient="violet"
          title={locale === "uz" ? "Foto hisobotlar" : "Фотоотчёты"}
          subtitle={locale === "uz"
            ? "Agentlar tomonidan yuklangan check-in/check-out rasmlari"
            : "Фото с полевых визитов агентов (check-in / check-out)"}
          action={
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="date"
                value={sanaDan}
                onChange={e => setSanaDan(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <input
                type="date"
                value={sanaGacha}
                onChange={e => setSanaGacha(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <select
                value={agentId ?? ""}
                onChange={e => setAgentId(e.target.value ? Number(e.target.value) : null)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm min-w-[140px]"
              >
                <option value="">{locale === "uz" ? "Barcha agentlar" : "Все агенты"}</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.ism}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={fetchData}>
                {locale === "uz" ? "Yangilash" : "Обновить"}
              </Button>
            </div>
          }
        />

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className={cn(
                "p-2 rounded-xl ring-1 shrink-0",
                s.tone === "violet"  ? "bg-violet-500/15 text-violet-500 ring-violet-500/30" :
                s.tone === "emerald" ? "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30" :
                s.tone === "blue"    ? "bg-blue-500/15 text-blue-500 ring-blue-500/30" :
                                       "bg-amber-500/15 text-amber-500 ring-amber-500/30",
              )}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-base font-bold text-foreground mt-0.5 tabular-nums">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={locale === "uz" ? "Mijoz ismi bo'yicha..." : "Поиск по клиенту..."}
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

        {loading ? (
          <PageLoading />
        ) : items.length === 0 ? (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-12 text-center">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-foreground">
              {locale === "uz" ? "Foto hisobotlar topilmadi" : "Фотоотчёты не найдены"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "uz"
                ? "Agentlar checkin/checkout qilganda rasmlar bu yerda ko'rinadi"
                : "Фото появятся когда агенты сделают checkin/checkout"}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60">
                <p className="text-sm font-semibold text-foreground">
                  {locale === "uz"
                    ? `Rasmlar (${items.length})`
                    : `Фотографии (${items.length})`}
                </p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {items.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.25 }}
                      className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer group"
                      onClick={() => setPreview(p)}
                    >
                      <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden relative">
                        {p.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.foto_url} alt={p.klient_nomi || "foto"}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                        )}
                        {/* Type badge overlay */}
                        <Badge
                          variant={p.turi === "checkin" ? "default" : "secondary"}
                          className="absolute top-2 left-2 text-[10px] backdrop-blur"
                        >
                          {p.turi === "checkin"
                            ? <><CheckCircle2 className="w-3 h-3 mr-1 inline" />In</>
                            : <><LogOut className="w-3 h-3 mr-1 inline" />Out</>}
                        </Badge>
                      </div>
                      <div className="p-3 space-y-1">
                        {p.agent_ismi && (
                          <div className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 truncate">
                            <Users className="w-3 h-3 shrink-0" /> {p.agent_ismi}
                          </div>
                        )}
                        <div className="font-medium text-sm truncate text-foreground">
                          {p.klient_nomi || (locale === "uz" ? "Mijoz" : "Клиент")}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {new Date(p.vaqt).toLocaleString(locale === "uz" ? "uz-UZ" : "ru-RU", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                        {p.manzil && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {p.manzil}
                          </div>
                        )}
                        {p.izoh && (
                          <p className="text-[11px] text-muted-foreground italic truncate">{p.izoh}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Preview dialog */}
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{preview?.klient_nomi || (locale === "uz" ? "Foto" : "Фото")}</DialogTitle>
            </DialogHeader>
            {preview && (
              <div className="space-y-3">
                {preview.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.foto_url} alt="preview"
                       className="w-full max-h-[70vh] object-contain rounded-lg" />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {preview.agent_ismi && (
                    <div>
                      <span className="text-muted-foreground">{locale === "uz" ? "Agent:" : "Агент:"}</span>{" "}
                      <span className="font-medium">{preview.agent_ismi}</span>
                    </div>
                  )}
                  {preview.klient_nomi && (
                    <div>
                      <span className="text-muted-foreground">{locale === "uz" ? "Mijoz:" : "Клиент:"}</span>{" "}
                      <span className="font-medium">{preview.klient_nomi}</span>
                    </div>
                  )}
                  {preview.manzil && (
                    <div><span className="text-muted-foreground">{locale === "uz" ? "Manzil:" : "Адрес:"}</span> {preview.manzil}</div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{locale === "uz" ? "Sana:" : "Дата:"}</span>{" "}
                    {new Date(preview.vaqt).toLocaleString(locale === "uz" ? "uz-UZ" : "ru-RU")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{locale === "uz" ? "Turi:" : "Тип:"}</span>{" "}
                    <Badge variant={preview.turi === "checkin" ? "default" : "secondary"} className="text-xs">
                      {preview.turi === "checkin" ? "Check-in" : "Check-out"}
                    </Badge>
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
                      <span className="text-muted-foreground">{locale === "uz" ? "Izoh:" : "Коммент:"}</span> {preview.izoh}
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
