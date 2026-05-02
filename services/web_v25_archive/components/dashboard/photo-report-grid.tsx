"use client"

/**
 * PhotoReportGrid — grid of visit/stock photos taken by agents.
 *
 * SalesDoc /audit/photoReport equivalent. Visual stream of agent
 * field photos with filters, lightbox overlay, and metadata overlay.
 */

import { useMemo, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera, X, ChevronLeft, ChevronRight, User, MapPin,
  Calendar, Tag, ImageOff,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export type PhotoType = "tashrif" | "qoldiq" | "aksiya" | "defekt" | "boshqa"

export interface PhotoReportItem {
  id:          number
  url:         string
  thumb_url?:  string
  agent_ismi:  string
  klient_ismi?: string
  manzil?:     string
  turi:        PhotoType
  vaqt:        string   // ISO
  izoh?:       string
}

interface Props {
  photos:     PhotoReportItem[]
  className?:  string
}

type Lang = "uz" | "ru"
type FilterKey = "all" | PhotoType

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    title:      "Foto hisobotlar",
    subtitle:   "Dala tashrifidan rasmlar",
    all:        "Barchasi",
    tashrif:    "Tashrif",
    qoldiq:     "Qoldiq",
    aksiya:     "Aksiya",
    defekt:     "Defekt",
    boshqa:     "Boshqa",
    empty:      "Fotosuratlar yo'q",
    empty_hint: "Agentlar tashrif paytida rasm yuklaganda bu yerda ko'rinadi",
    close:      "Yopish",
    today:      "bugun",
    yesterday:  "kecha",
    days_ago:   (n: number) => `${n} kun oldin`,
  },
  ru: {
    title:      "Фотоотчёты",
    subtitle:   "Фото с полевых визитов",
    all:        "Все",
    tashrif:    "Визит",
    qoldiq:     "Остатки",
    aksiya:     "Акция",
    defekt:     "Дефект",
    boshqa:     "Прочее",
    empty:      "Фото нет",
    empty_hint: "Фото появятся здесь, когда агенты их загрузят",
    close:      "Закрыть",
    today:      "сегодня",
    yesterday:  "вчера",
    days_ago:   (n: number) => `${n} дн назад`,
  },
}

// ─── Type → tone ────────────────────────────────────────────

const TYPE_META: Record<PhotoType, { tone: string; dot: string }> = {
  tashrif: { tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/30",   dot: "bg-blue-500" },
  qoldiq:  { tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-500" },
  aksiya:  { tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",       dot: "bg-amber-500" },
  defekt:  { tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",          dot: "bg-rose-500" },
  boshqa:  { tone: "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/30",       dot: "bg-slate-500" },
}

// ─── Helpers ────────────────────────────────────────────────

function relDays(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return LABELS[lang].today
  if (days === 1) return LABELS[lang].yesterday
  return LABELS[lang].days_ago(days)
}

function fmtTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(d)
}

// ─── Chip ───────────────────────────────────────────────────

interface ChipProps {
  label:   string
  count:   number
  active:  boolean
  tone?:   PhotoType
  onClick: () => void
}

function Chip({ label, count, active, tone, onClick }: ChipProps) {
  const meta = tone ? TYPE_META[tone] : null
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
        active
          ? meta
            ? cn(meta.tone, "ring-1 shadow-sm")
            : "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground",
      )}
    >
      {meta && <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />}
      {label}
      <span className={cn(
        "inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-semibold",
        active && !meta ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
      )}>
        {count}
      </span>
    </button>
  )
}

// ─── Thumbnail ──────────────────────────────────────────────

interface ThumbProps {
  photo:    PhotoReportItem
  onClick:  () => void
  lang:     Lang
  index:    number
}

function Thumb({ photo: p, onClick, lang, index }: ThumbProps) {
  const [failed, setFailed] = useState(false)
  const meta = TYPE_META[p.turi]
  const L = LABELS[lang]

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative block aspect-square rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-sm hover:shadow-lg hover:shadow-black/5 transition-shadow"
    >
      {p.url && !failed ? (
        <img
          src={p.thumb_url || p.url}
          alt={p.izoh || p.klient_ismi || ""}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <ImageOff className="w-8 h-8" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Type pill */}
      <span className={cn(
        "absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 backdrop-blur",
        meta.tone,
      )}>
        <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
        {L[p.turi]}
      </span>

      {/* Meta footer */}
      <div className="absolute bottom-0 inset-x-0 p-2.5 text-left">
        <p className="text-[11px] font-bold text-white truncate drop-shadow">
          {p.klient_ismi || p.agent_ismi}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/80">
          <User className="w-2.5 h-2.5" />
          <span className="truncate">{p.agent_ismi}</span>
          <span>·</span>
          <span>{relDays(p.vaqt, lang)}</span>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Lightbox ───────────────────────────────────────────────

interface LightboxProps {
  photos:   PhotoReportItem[]
  index:    number
  lang:     Lang
  onClose:  () => void
  onPrev:   () => void
  onNext:   () => void
}

function Lightbox({ photos, index, lang, onClose, onPrev, onNext }: LightboxProps) {
  const L = LABELS[lang]
  const photo = photos[index]

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose()
      if (e.key === "ArrowLeft")  onPrev()
      if (e.key === "ArrowRight") onNext()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose, onPrev, onNext])

  if (!photo) return null
  const meta = TYPE_META[photo.turi]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label={L.close}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Content */}
      <motion.div
        key={photo.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full flex flex-col items-center gap-4"
      >
        <img
          src={photo.url}
          alt={photo.izoh || ""}
          className="max-h-[75vh] rounded-2xl object-contain shadow-2xl"
        />

        {/* Info bar */}
        <div className="w-full max-w-2xl rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 text-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                meta.tone,
              )}>
                <Tag className="w-2.5 h-2.5" />
                {L[photo.turi]}
              </span>
              <h3 className="text-sm font-bold truncate">{photo.klient_ismi || "—"}</h3>
            </div>
            <span className="text-[11px] text-white/70">
              {index + 1} / {photos.length}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/80">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {photo.agent_ismi}
            </span>
            {photo.manzil && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {photo.manzil}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fmtTime(photo.vaqt, lang)}
            </span>
          </div>
          {photo.izoh && (
            <p className="mt-2 text-xs text-white/90 italic">{photo.izoh}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main ───────────────────────────────────────────────────

export default function PhotoReportGrid({ photos, className }: Props) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [active, setActive]   = useState<FilterKey>("all")
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const counts = useMemo(() => {
    const base = { all: photos.length, tashrif: 0, qoldiq: 0, aksiya: 0, defekt: 0, boshqa: 0 }
    for (const p of photos) base[p.turi] += 1
    return base
  }, [photos])

  const filtered = useMemo(
    () => active === "all" ? photos : photos.filter(p => p.turi === active),
    [photos, active],
  )

  const handleClose = useCallback(() => setLightboxIdx(null), [])
  const handlePrev  = useCallback(
    () => setLightboxIdx(i => i === null ? null : (i - 1 + filtered.length) % filtered.length),
    [filtered.length],
  )
  const handleNext  = useCallback(
    () => setLightboxIdx(i => i === null ? null : (i + 1) % filtered.length),
    [filtered.length],
  )

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">{L.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{L.subtitle}</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <Chip label={L.all}     count={counts.all}     active={active === "all"}     onClick={() => setActive("all")} />
        <Chip label={L.tashrif} count={counts.tashrif} active={active === "tashrif"} tone="tashrif" onClick={() => setActive("tashrif")} />
        <Chip label={L.qoldiq}  count={counts.qoldiq}  active={active === "qoldiq"}  tone="qoldiq"  onClick={() => setActive("qoldiq")} />
        <Chip label={L.aksiya}  count={counts.aksiya}  active={active === "aksiya"}  tone="aksiya"  onClick={() => setActive("aksiya")} />
        <Chip label={L.defekt}  count={counts.defekt}  active={active === "defekt"}  tone="defekt"  onClick={() => setActive("defekt")} />
        {counts.boshqa > 0 && (
          <Chip label={L.boshqa} count={counts.boshqa} active={active === "boshqa"} tone="boshqa" onClick={() => setActive("boshqa")} />
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((p, i) => (
            <Thumb
              key={p.id}
              photo={p}
              lang={lang}
              index={i}
              onClick={() => setLightboxIdx(i)}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center"
        >
          <div className="inline-flex p-4 rounded-2xl bg-muted mb-3">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{L.empty}</p>
          <p className="text-xs text-muted-foreground mt-1">{L.empty_hint}</p>
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && filtered.length > 0 && (
          <Lightbox
            photos={filtered}
            index={lightboxIdx}
            lang={lang}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
