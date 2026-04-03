"use client"

import { useState, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Users, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { searchService } from "@/lib/api/services"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function SearchPage() {
  const { locale } = useLocale()
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    tovarlar: Array<{ id: number; nomi: string; kategoriya: string; qoldiq: number; sotish_narxi: number }>
    klientlar: Array<{ id: number; ism: string; telefon: string; jami_sotib: number }>
    jami: number
  } | null>(null)

  const t = {
    title: locale === "uz" ? "Qidiruv" : "Поиск",
    hint: locale === "uz" ? "Tovar yoki klient izlash..." : "Поиск товара или клиента...",
    products: locale === "uz" ? "Tovarlar" : "Товары",
    clients: locale === "uz" ? "Klientlar" : "Клиенты",
    noResults: locale === "uz" ? "Hech narsa topilmadi" : "Ничего не найдено",
    minChars: locale === "uz" ? "Kamida 2 belgi kiriting" : "Введите минимум 2 символа",
    stock: locale === "uz" ? "Qoldiq" : "Остаток",
    total: locale === "uz" ? "Jami sotib olgan" : "Всего купил",
    found: locale === "uz" ? "ta topildi" : "найдено",
  }

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const data = await searchService.search(q.trim())
      setResults(data)
    } catch { setResults(null) }
    finally { setLoading(false) }
  }, [])

  return (
    <AdminLayout title={t.title}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            className="pl-12 h-12 text-base"
            placeholder={t.hint}
            value={query}
            onChange={e => { setQuery(e.target.value); doSearch(e.target.value) }}
            autoFocus
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-5">
            {results.jami > 0 && (
              <p className="text-xs text-muted-foreground">{results.jami} {t.found}</p>
            )}

            {/* Tovarlar */}
            {results.tovarlar.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t.products} ({results.tovarlar.length})</h3>
                </div>
                <div className="space-y-2">
                  {results.tovarlar.map(tv => (
                    <Link key={tv.id} href="/products">
                      <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-foreground">{tv.nomi}</p>
                          <p className="text-xs text-muted-foreground">{tv.kategoriya}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-semibold">{fmt(tv.sotish_narxi)} so'm</p>
                          <p className={cn("text-xs", tv.qoldiq <= 0 ? "text-destructive" : "text-muted-foreground")}>
                            {t.stock}: {tv.qoldiq}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Klientlar */}
            {results.klientlar.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold">{t.clients} ({results.klientlar.length})</h3>
                </div>
                <div className="space-y-2">
                  {results.klientlar.map(kl => (
                    <Link key={kl.id} href="/clients">
                      <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-foreground">{kl.ism}</p>
                          <p className="text-xs text-muted-foreground">{kl.telefon || "—"}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-xs text-muted-foreground">{t.total}</p>
                          <p className="text-sm font-semibold">{fmt(kl.jami_sotib)} so'm</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {results.jami === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">{t.noResults}</div>
            )}
          </div>
        )}

        {/* Hint */}
        {!results && query.length < 2 && query.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t.minChars}</p>
        )}
      </div>
    </AdminLayout>
  )
}
