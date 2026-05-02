"use client"

/**
 * ClientDirectoryTable — rich filterable shop/customer directory.
 *
 * Pipeline: v0.dev drafted skeleton → GPT-5.4 audit (5 issues: AnimatePresence
 * inside <tbody> not valid DOM, non-debounced search, NaN date handling,
 * keyboard accessibility, hardcoded locale) → Claude rewrote.
 *
 * Fits the project `klientlar` schema with the new CRM columns
 * (kategoriya, jami_xaridlar, xarid_soni, oxirgi_sotuv).
 */

import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Search, Users, TrendingUp, ShoppingBag, Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────

export interface ClientRowData {
  id:            number
  ism:           string
  telefon?:      string
  manzil?:       string
  kategoriya?:   string
  kredit_limit:  number
  joriy_qarz:    number
  oxirgi_sotuv?: string   // ISO date
  jami_xaridlar: number
  xarid_soni:    number
  faol:          boolean
}

interface ClientDirectoryTableProps {
  clients: ClientRowData[]
  onClientClick?: (id: number) => void
  className?: string
}

type Lang = "uz" | "ru"
type DebtKey = "all" | "qarzdor" | "sof"

// ─── Labels ─────────────────────────────────────────────────

const LABELS = {
  uz: {
    search_ph:   "Ism, telefon yoki manzil bo'yicha qidiring…",
    all:         "Barchasi",
    qarzdor:     "Qarzdorlar",
    sof:         "Sof",
    hammasi:     "Hammasi",
    no_category: "Kategoriyasiz",
    col_client:  "Mijoz",
    col_cat:     "Kategoriya",
    col_credit:  "Kredit / Qarz",
    col_lifetime:"Jami xaridlar",
    col_last:    "Oxirgi sotuv",
    limit:       "Limit",
    xarid:       "xarid",
    empty_title: "Mijozlar topilmadi",
    empty_q:     (q: string) => `"${q}" bo'yicha natija yo'q`,
    empty_na:    "Hozircha bu kategoriyada mijozlar yo'q",
    counter:     (shown: number, total: number) =>
                 `${shown} ta mijoz ko'rsatilmoqda${shown !== total ? ` (jami ${total} tadan)` : ""}`,
    today:       "bugun",
    yesterday:   "kecha",
    days_ago:    (n: number) => `${n} kun oldin`,
    weeks_ago:   (n: number) => `${n} hafta oldin`,
    months_ago:  (n: number) => `${n} oy oldin`,
    never:       "yo'q",
  },
  ru: {
    search_ph:   "Поиск по имени, телефону или адресу…",
    all:         "Все",
    qarzdor:     "Должники",
    sof:         "Без долга",
    hammasi:     "Все",
    no_category: "Без категории",
    col_client:  "Клиент",
    col_cat:     "Категория",
    col_credit:  "Кредит / Долг",
    col_lifetime:"Всего покупок",
    col_last:    "Последняя продажа",
    limit:       "Лимит",
    xarid:       "покупок",
    empty_title: "Клиенты не найдены",
    empty_q:     (q: string) => `Нет результатов по "${q}"`,
    empty_na:    "В этой категории пока нет клиентов",
    counter:     (shown: number, total: number) =>
                 `Показано ${shown}${shown !== total ? ` из ${total}` : ""}`,
    today:       "сегодня",
    yesterday:   "вчера",
    days_ago:    (n: number) => `${n} дн. назад`,
    weeks_ago:   (n: number) => `${n} нед. назад`,
    months_ago:  (n: number) => `${n} мес. назад`,
    never:       "нет",
  },
}

// ─── Formatters ─────────────────────────────────────────────

function formatUzs(amount: number, lang: Lang): string {
  const intl = lang === "ru" ? "ru-RU" : "uz-UZ"
  const fmt  = new Intl.NumberFormat(intl, { maximumFractionDigits: 1 })
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${fmt.format(amount / 1_000_000_000)} mlrd so'm`
  if (abs >= 1_000_000)     return `${fmt.format(amount / 1_000_000)} mln so'm`
  if (abs >= 10_000)        return `${fmt.format(amount / 1_000)} ming so'm`
  return `${new Intl.NumberFormat(intl).format(amount)} so'm`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

// Stable gradient per name hash — works in both themes
const AVATAR_GRADIENTS = [
  "from-blue-500/40 to-blue-500/10",
  "from-emerald-500/40 to-emerald-500/10",
  "from-violet-500/40 to-violet-500/10",
  "from-amber-500/40 to-amber-500/10",
  "from-rose-500/40 to-rose-500/10",
  "from-cyan-500/40 to-cyan-500/10",
  "from-indigo-500/40 to-indigo-500/10",
  "from-teal-500/40 to-teal-500/10",
]
function avatarClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]!
}

function relativeLastOrder(
  iso: string | undefined,
  lang: Lang,
): { label: string; tone: "ok" | "warn" | "stale" | "neutral" } {
  if (!iso) return { label: LABELS[lang].never, tone: "neutral" }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { label: LABELS[lang].never, tone: "neutral" }
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diffDays < 0) return { label: LABELS[lang].today, tone: "ok" }
  if (diffDays === 0) return { label: LABELS[lang].today, tone: "ok" }
  if (diffDays === 1) return { label: LABELS[lang].yesterday, tone: "ok" }
  if (diffDays <= 7)  return { label: LABELS[lang].days_ago(diffDays), tone: "ok" }
  if (diffDays <= 30) return { label: LABELS[lang].weeks_ago(Math.floor(diffDays / 7)), tone: "warn" }
  return { label: LABELS[lang].months_ago(Math.floor(diffDays / 30)), tone: "stale" }
}

function toneBadge(tone: "ok" | "warn" | "stale" | "neutral"): string {
  switch (tone) {
    case "ok":      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    case "warn":    return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    case "stale":   return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
    case "neutral": return "bg-muted text-muted-foreground border-border"
  }
}

function debtRatio(q: number, limit: number): number {
  if (limit <= 0) return q > 0 ? 1 : 0
  return Math.min(q / limit, 1)
}

// ─── Debounce hook ──────────────────────────────────────────

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// ─── Filter chip ────────────────────────────────────────────

interface ChipProps {
  label:   string
  count:   number
  active:  boolean
  onClick: () => void
}
function FilterChip({ label, count, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full min-w-4 h-4 text-[10px] font-semibold px-1",
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ─── Credit bar ─────────────────────────────────────────────

function CreditBar({
  joriy_qarz,
  kredit_limit,
  lang,
}: {
  joriy_qarz: number
  kredit_limit: number
  lang: Lang
}) {
  const ratio = debtRatio(joriy_qarz, kredit_limit)
  const pct = Math.round(ratio * 100)
  const tone =
    ratio < 0.5 ? {
      bar:  "bg-emerald-500/80",
      text: "text-emerald-600 dark:text-emerald-400",
    } :
    ratio < 0.8 ? {
      bar:  "bg-amber-500/80",
      text: "text-amber-600 dark:text-amber-400",
    } :
    {
      bar:  "bg-rose-500/80",
      text: "text-rose-600 dark:text-rose-400",
    }
  return (
    <div className="flex flex-col gap-1 min-w-[110px]">
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", tone.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className={cn("text-[10px] font-medium tabular-nums", tone.text)}>
        {pct}% · {formatUzs(joriy_qarz, lang)}
      </span>
    </div>
  )
}

// ─── Client row ─────────────────────────────────────────────

interface ClientRowProps {
  client:   ClientRowData
  onClick?: (id: number) => void
  lang:     Lang
  index:    number
}

function ClientRow({ client, onClick, lang, index }: ClientRowProps) {
  const L = LABELS[lang]
  const rel = relativeLastOrder(client.oxirgi_sotuv, lang)
  const handleKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (!onClick) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick(client.id)
    }
  }
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02, ease: "easeOut" }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? "button" : undefined}
      onClick={() => onClick?.(client.id)}
      onKeyDown={handleKey}
      className={cn(
        "border-b border-border/60 transition-colors duration-150 outline-none",
        "focus-visible:bg-muted/70",
        onClick && "cursor-pointer hover:bg-muted/50",
      )}
    >
      {/* Avatar + Name */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "w-10 h-10 rounded-2xl ring-1 ring-border/60 flex items-center justify-center text-sm font-bold tracking-wide bg-gradient-to-br text-foreground",
                avatarClass(client.ism),
              )}
            >
              {initials(client.ism)}
            </div>
            {client.faol && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {client.ism}
            </p>
            {client.telefon ? (
              <a
                href={`tel:${client.telefon}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
              >
                <Phone className="w-3 h-3" />
                {client.telefon}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </td>

      {/* Category + Address */}
      <td className="py-3 px-3 hidden sm:table-cell">
        <div className="flex flex-col gap-1">
          {client.kategoriya ? (
            <Badge variant="secondary" className="w-fit text-[10px] px-2 py-0">
              {client.kategoriya}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {client.manzil && (
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {client.manzil}
            </span>
          )}
        </div>
      </td>

      {/* Credit bar */}
      <td className="py-3 px-3 hidden md:table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">
            {LABELS[lang].limit}: {formatUzs(client.kredit_limit, lang)}
          </span>
          <CreditBar
            joriy_qarz={client.joriy_qarz}
            kredit_limit={client.kredit_limit}
            lang={lang}
          />
        </div>
      </td>

      {/* Lifetime spend */}
      <td className="py-3 px-3 hidden lg:table-cell">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {formatUzs(client.jami_xaridlar, lang)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {client.xarid_soni} {L.xarid}
            </span>
          </div>
        </div>
      </td>

      {/* Last order */}
      <td className="py-3 pl-3 pr-4">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 text-[10px] font-medium border rounded-full whitespace-nowrap",
            toneBadge(rel.tone),
          )}
        >
          {rel.label}
        </span>
      </td>
    </motion.tr>
  )
}

// ─── Main component ─────────────────────────────────────────

export default function ClientDirectoryTable({
  clients,
  onClientClick,
  className,
}: ClientDirectoryTableProps) {
  const { locale } = useLocale()
  const lang: Lang = locale === "ru" ? "ru" : "uz"
  const L = LABELS[lang]

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounced(search, 150)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [debtFilter, setDebtFilter] = useState<DebtKey>("all")

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of clients) {
      const k = c.kategoriya?.trim() || L.no_category
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [clients, L.no_category])

  const debtCounts = useMemo(() => {
    const qarzdor = clients.filter(c => c.joriy_qarz > 0).length
    return { all: clients.length, qarzdor, sof: clients.length - qarzdor }
  }, [clients])

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim()
    return clients.filter(c => {
      const matchSearch =
        !q ||
        c.ism.toLowerCase().includes(q) ||
        (c.telefon ?? "").toLowerCase().includes(q) ||
        (c.manzil ?? "").toLowerCase().includes(q)
      const matchCat =
        !activeCategory ||
        (c.kategoriya?.trim() || L.no_category) === activeCategory
      const matchDebt =
        debtFilter === "all" ||
        (debtFilter === "qarzdor" ? c.joriy_qarz > 0 : c.joriy_qarz === 0)
      return matchSearch && matchCat && matchDebt
    })
  }, [clients, debouncedSearch, activeCategory, debtFilter, L.no_category])

  const debtLabels: Record<DebtKey, string> = {
    all:     L.all,
    qarzdor: L.qarzdor,
    sof:     L.sof,
  }

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {/* Search + debt filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
        <div className="flex gap-1.5 flex-shrink-0">
          {(["all", "qarzdor", "sof"] as const).map(key => (
            <FilterChip
              key={key}
              label={debtLabels[key]}
              count={debtCounts[key]}
              active={debtFilter === key}
              onClick={() => setDebtFilter(key)}
            />
          ))}
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <FilterChip
            label={L.hammasi}
            count={clients.length}
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map(([cat, count]) => (
            <FilterChip
              key={cat}
              label={cat}
              count={count}
              active={activeCategory === cat}
              onClick={() =>
                setActiveCategory(prev => (prev === cat ? null : cat))
              }
            />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="py-2.5 pl-4 pr-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {L.col_client}
                  </th>
                  <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    {L.col_cat}
                  </th>
                  <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    {L.col_credit}
                  </th>
                  <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {L.col_lifetime}
                  </th>
                  <th className="py-2.5 pl-3 pr-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {L.col_last}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onClick={onClientClick}
                    lang={lang}
                    index={i}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{L.empty_title}</p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              {debouncedSearch ? L.empty_q(debouncedSearch) : L.empty_na}
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer counter */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          {L.counter(filtered.length, clients.length)}
        </p>
      )}
    </div>
  )
}
