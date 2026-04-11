"use client"

/**
 * ProductStockGrid — SalesDoc-inspired FMCG inventory grid.
 *
 * This one was written directly by Claude (v0 returned a description
 * instead of code on the first try). It follows the same project
 * conventions as the other 4 components in this folder — theme-safe
 * semantic tokens, useLocale() for uz/ru, framer-motion stagger,
 * UZS formatter, glassmorphism.
 */

import { useMemo, useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search, Package, TrendingUp, TrendingDown, AlertCircle,
  Barcode, SortAsc, ArrowUpDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface ProductCardData {
  id:           number
  nomi:         string
  brend?:       string
  kategoriya?:  string
  birlik:       string         // dona / kg / l
  sotish_narxi: number
  olish_narxi:  number
  qoldiq:       number
  min_qoldiq:   number
  rasm_url?:    string
  faol:         boolean
  shtrix_kod?:  string
}

interface ProductStockGridProps {
  products:       ProductCardData[]
  onProductClick?: (id: number) => void
  className?:     string
}

type Lang = "uz" | "ru"
type SortKey = "nom" | "stock" | "narx" | "margin"
type StockFilter = "all" | "kam" | "tugagan" | "faol"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    search_ph:   "Nom, brend yoki shtrix kod…",
    sort_nom:    "Nom",
    sort_stock:  "Qoldiq",
    sort_narx:   "Narx",
    sort_margin: "Foyda",
    all:         "Barchasi",
    kam:         "Kam qoldiq",
    tugagan:     "Tugagan",
    faol:        "Faol",
    margin:      "Foyda",
    no_stock:    "Tugagan",
    in_stock:    "Sotuvda",
    low:         "Kam qoldi",
    empty:       "Tovarlar topilmadi",
    counter:     (n: number, t: number) =>
                 `${t} tovardan ${n} tasi ko'rsatilmoqda`,
  },
  ru: {
    search_ph:   "Название, бренд или штрихкод…",
    sort_nom:    "Название",
    sort_stock:  "Остаток",
    sort_narx:   "Цена",
    sort_margin: "Маржа",
    all:         "Все",
    kam:         "Мало",
    tugagan:     "Нет",
    faol:        "Активные",
    margin:      "Маржа",
    no_stock:    "Нет в наличии",
    in_stock:    "В продаже",
    low:         "Мало на складе",
    empty:       "Товары не найдены",
    counter:     (n: number, t: number) =>
                 `Показано ${n} из ${t}`,
  },
}

// ─── Formatters ─────────────────────────────────────────────

function formatUzs(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt  = new Intl.NumberFormat(intl, { maximumFractionDigits: 0 })
  if (amount >= 1_000_000) {
    return `${new Intl.NumberFormat(intl, { maximumFractionDigits: 1 }).format(amount / 1_000_000)} mln`
  }
  return fmt.format(amount)
}

function initials(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase()
}

const GRAD = [
  "from-emerald-500/30 to-emerald-500/5",
  "from-blue-500/30 to-blue-500/5",
  "from-violet-500/30 to-violet-500/5",
  "from-amber-500/30 to-amber-500/5",
  "from-rose-500/30 to-rose-500/5",
  "from-cyan-500/30 to-cyan-500/5",
]
function gradForId(id: number): string {
  return GRAD[id % GRAD.length]!
}

function stockTone(p: ProductCardData): {
  barClass: string
  textClass: string
  badge: "tugagan" | "kam" | "ok"
} {
  if (p.qoldiq <= 0) {
    return {
      barClass:  "bg-rose-500",
      textClass: "text-rose-600 dark:text-rose-400",
      badge:     "tugagan",
    }
  }
  if (p.qoldiq <= p.min_qoldiq) {
    return {
      barClass:  "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
      badge:     "kam",
    }
  }
  return {
    barClass:  "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
    badge:     "ok",
  }
}

function marginPercent(p: ProductCardData): number {
  if (p.olish_narxi <= 0) return 0
  return Math.round(((p.sotish_narxi - p.olish_narxi) / p.olish_narxi) * 100)
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// ─── Sort button ────────────────────────────────────────────

interface SortButtonProps {
  label:   string
  active:  boolean
  onClick: () => void
}
function SortButton({ label, active, onClick }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-card/60 text-muted-foreground hover:text-foreground border border-border/60",
      )}
    >
      {label}
    </button>
  )
}

// ─── Filter chip ────────────────────────────────────────────

interface ChipProps {
  label:   string
  count:   number
  active:  boolean
  tone?:   "default" | "amber" | "rose"
  onClick: () => void
}
function FilterChip({ label, count, active, tone = "default", onClick }: ChipProps) {
  const activeClass =
    tone === "amber"
      ? "bg-amber-500 text-white border-amber-500"
      : tone === "rose"
        ? "bg-rose-500 text-white border-rose-500"
        : "bg-primary text-primary-foreground border-primary"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
        active
          ? cn(activeClass, "shadow-sm")
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground",
      )}
    >
      {label}
      <span className={cn(
        "inline-flex items-center justify-center rounded-full min-w-4 h-4 text-[10px] font-semibold px-1",
        active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
      )}>
        {count}
      </span>
    </button>
  )
}

// ─── Product card ───────────────────────────────────────────

interface ProductCardProps {
  product:  ProductCardData
  lang:     Lang
  index:    number
  onClick?: (id: number) => void
}

function ProductCard({ product: p, lang, index, onClick }: ProductCardProps) {
  const L = LABELS[lang]
  const tone = stockTone(p)
  const margin = marginPercent(p)
  const stockPct = Math.min(100, Math.round((p.qoldiq / Math.max(1, p.min_qoldiq * 3)) * 100))

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.025,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(p.id)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 flex flex-col gap-3",
        "shadow-sm hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300",
        onClick && "cursor-pointer",
      )}
    >
      {/* Image/placeholder */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
        {p.rasm_url ? (
          <img
            src={p.rasm_url}
            alt={p.nomi}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center bg-gradient-to-br",
            gradForId(p.id),
          )}>
            <span className="text-4xl font-bold text-foreground/60">
              {initials(p.nomi)}
            </span>
          </div>
        )}

        {/* Category badge top-left */}
        {p.kategoriya && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-[10px] px-1.5 py-0 backdrop-blur bg-card/70"
          >
            {p.kategoriya}
          </Badge>
        )}

        {/* Status badge top-right */}
        {tone.badge !== "ok" && (
          <span className={cn(
            "absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border backdrop-blur",
            tone.badge === "tugagan"
              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30"
              : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
          )}>
            <AlertCircle className="w-3 h-3" />
            {tone.badge === "tugagan" ? L.no_stock : L.low}
          </span>
        )}
      </div>

      {/* Name + brand */}
      <div className="min-h-[2.5rem]">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {p.nomi}
        </p>
        {p.brend && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {p.brend}
          </p>
        )}
      </div>

      {/* Price + margin */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-base font-bold text-foreground tabular-nums leading-none">
            {formatUzs(p.sotish_narxi, lang)}
            <span className="text-[10px] text-muted-foreground font-medium ml-1">
              so'm
            </span>
          </p>
        </div>
        {margin !== 0 && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-md px-1.5 py-0.5 border",
            margin > 0
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          )}>
            {margin > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {margin > 0 ? "+" : ""}{margin}%
          </span>
        )}
      </div>

      {/* Stock bar */}
      <div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", tone.barClass)}
            initial={{ width: 0 }}
            animate={{ width: `${stockPct}%` }}
            transition={{ duration: 0.6, delay: index * 0.025 + 0.15 }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={cn("text-xs font-semibold tabular-nums", tone.textClass)}>
            {p.qoldiq.toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")} {p.birlik}
          </span>
          {p.shtrix_kod && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Barcode className="w-2.5 h-2.5" />
              {p.shtrix_kod.slice(-6)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

// ─── Main component ─────────────────────────────────────────

export default function ProductStockGrid({
  products,
  onProductClick,
  className,
}: ProductStockGridProps) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [search, setSearch] = useState("")
  const debounced = useDebounced(search, 150)
  const [sortKey, setSortKey] = useState<SortKey>("nom")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")

  const counts = useMemo(() => ({
    all:     products.length,
    kam:     products.filter(p => p.qoldiq > 0 && p.qoldiq <= p.min_qoldiq).length,
    tugagan: products.filter(p => p.qoldiq <= 0).length,
    faol:    products.filter(p => p.faol).length,
  }), [products])

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase().trim()
    let list = products.filter(p => {
      const matchSearch =
        !q ||
        p.nomi.toLowerCase().includes(q) ||
        (p.brend ?? "").toLowerCase().includes(q) ||
        (p.shtrix_kod ?? "").includes(q)
      const matchStock =
        stockFilter === "all" ? true :
        stockFilter === "kam" ? (p.qoldiq > 0 && p.qoldiq <= p.min_qoldiq) :
        stockFilter === "tugagan" ? p.qoldiq <= 0 :
        p.faol
      return matchSearch && matchStock
    })
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "nom":    return a.nomi.localeCompare(b.nomi)
        case "stock":  return b.qoldiq - a.qoldiq
        case "narx":   return b.sotish_narxi - a.sotish_narxi
        case "margin": return marginPercent(b) - marginPercent(a)
      }
    })
    return list
  }, [products, debounced, sortKey, stockFilter])

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {/* Top toolbar: search + sort */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={L.search_ph}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card/60 backdrop-blur-xl border-border/60"
          />
        </div>
        <div className="inline-flex gap-1.5 items-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-0.5" />
          <SortButton label={L.sort_nom}    active={sortKey === "nom"}    onClick={() => setSortKey("nom")} />
          <SortButton label={L.sort_stock}  active={sortKey === "stock"}  onClick={() => setSortKey("stock")} />
          <SortButton label={L.sort_narx}   active={sortKey === "narx"}   onClick={() => setSortKey("narx")} />
          <SortButton label={L.sort_margin} active={sortKey === "margin"} onClick={() => setSortKey("margin")} />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <FilterChip label={L.all}     count={counts.all}     active={stockFilter === "all"}     onClick={() => setStockFilter("all")} />
        <FilterChip label={L.kam}     count={counts.kam}     active={stockFilter === "kam"}     tone="amber" onClick={() => setStockFilter("kam")} />
        <FilterChip label={L.tugagan} count={counts.tugagan} active={stockFilter === "tugagan"} tone="rose"  onClick={() => setStockFilter("tugagan")} />
        <FilterChip label={L.faol}    count={counts.faol}    active={stockFilter === "faol"}    onClick={() => setStockFilter("faol")} />
      </div>

      {/* Grid or empty */}
      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                lang={lang}
                index={i}
                onClick={onProductClick}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground px-1">
            {L.counter(filtered.length, products.length)}
          </p>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-12 text-center"
        >
          <div className="inline-flex p-4 rounded-2xl bg-muted mb-3">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{L.empty}</p>
        </motion.div>
      )}
    </div>
  )
}
