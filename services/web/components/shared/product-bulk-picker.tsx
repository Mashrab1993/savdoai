"use client"

/**
 * ProductBulkPicker — SalesDoc Novyy prixod "Выберите товары из списка"
 * sahifasiga analog: kategoriya filter + qidiruv + checkbox + bulk add.
 *
 * SalesDocdan farqi:
 * - Kategoriya + brend + segment tabs (3 filter holatida)
 * - Tanlanganlar counter + "Hammasini olib tashlash"
 * - Touch-friendly (mobil uchun)
 */

import { useState, useEffect, useMemo } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Package, X, Check } from "lucide-react"
import { productService, classifierService } from "@/lib/api/services"
import type { ProductDto } from "@/lib/api/types"
import type { KlassifikatorItem } from "@/lib/api/services"

export interface BulkPickerResult {
  tovar_id: number
  nomi: string
  birlik: string
  olish_narxi: number
  sotish_narxi: number
  kategoriya?: string | null
  brend?: string | null
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (selected: BulkPickerResult[]) => void
  title?: string
  initialSelected?: number[]
}

type FilterKind = "all" | "kategoriya" | "brend" | "segment"

export function ProductBulkPicker({
  open, onOpenChange, onConfirm, title = "Tovar tanlash",
  initialSelected = [],
}: Props) {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [klf, setKlf] = useState<Record<string, KlassifikatorItem[]>>({})
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterKind, setFilterKind] = useState<FilterKind>("all")
  const [filterValue, setFilterValue] = useState<string>("")
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelected))

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      productService.list().catch(() => [] as ProductDto[]),
      classifierService.list().then(r => r.items).catch(() => null),
    ]).then(([prods, klfs]) => {
      setProducts(prods)
      if (klfs) setKlf(klfs as unknown as Record<string, KlassifikatorItem[]>)
    }).finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (open) setSelected(new Set(initialSelected))
  }, [open, initialSelected])

  // Filter pipeline
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return products.filter(p => {
      if (needle && !(p.nomi || "").toLowerCase().includes(needle)) return false

      if (filterKind !== "all" && filterValue) {
        const pAny = p as ProductDto & Record<string, string | undefined | null>
        const val = filterKind === "kategoriya" ? pAny.kategoriya
                  : filterKind === "brend" ? pAny.brend
                  : filterKind === "segment" ? pAny.segment
                  : null
        if (!val || String(val).toLowerCase() !== filterValue.toLowerCase()) return false
      }
      return true
    })
  }, [products, search, filterKind, filterValue])

  const filterOptions = useMemo(() => {
    if (filterKind === "all") return []
    const items = klf[filterKind] || []
    return items.filter(i => i.faol)
  }, [klf, filterKind])

  const toggle = (id: number) => {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleAllFiltered = () => {
    setSelected(s => {
      const n = new Set(s)
      const allInView = filtered.every(p => n.has(p.id))
      if (allInView) {
        filtered.forEach(p => n.delete(p.id))
      } else {
        filtered.forEach(p => n.add(p.id))
      }
      return n
    })
  }

  const handleConfirm = () => {
    const chosen: BulkPickerResult[] = products
      .filter(p => selected.has(p.id))
      .map(p => {
        const pAny = p as ProductDto & Record<string, unknown>
        return {
          tovar_id: p.id,
          nomi: p.nomi || "Nomsiz",
          birlik: String(pAny.birlik || "dona"),
          olish_narxi: Number(pAny.olish_narxi || 0),
          sotish_narxi: Number(pAny.sotish_narxi || 0),
          kategoriya: (pAny.kategoriya as string) || null,
          brend: (pAny.brend as string) || null,
        }
      })
    onConfirm(chosen)
    onOpenChange(false)
  }

  const clearAll = () => setSelected(new Set())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {title}
            {selected.size > 0 && (
              <Badge className="ml-2 bg-indigo-500">
                {selected.size} tanlandi
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden border-t">
          {/* LEFT — filter tree */}
          <div className="w-full lg:w-72 bg-muted/30 border-r flex flex-col">
            <div className="p-3 flex gap-1 flex-wrap border-b">
              {(["all", "kategoriya", "brend", "segment"] as FilterKind[]).map(k => (
                <Button
                  key={k}
                  size="sm"
                  variant={filterKind === k ? "default" : "ghost"}
                  onClick={() => { setFilterKind(k); setFilterValue("") }}
                  className="text-xs"
                >
                  {k === "all" ? "Hammasi" : k.charAt(0).toUpperCase() + k.slice(1)}
                </Button>
              ))}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filterKind === "all" ? (
                  <div className="text-sm text-muted-foreground p-3">
                    Yuqoridagi tablardan birini tanlang: Kategoriya, Brend, Segment
                  </div>
                ) : filterOptions.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3">
                    Hech qanday {filterKind} yo&apos;q.{" "}
                    <a href="/categories" className="underline">Qo&apos;shish</a>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setFilterValue("")}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                        !filterValue ? "bg-indigo-500 text-white" : "hover:bg-muted"
                      }`}
                    >
                      Barchasi ({products.length})
                    </button>
                    {filterOptions.map(it => (
                      <button
                        key={it.id}
                        onClick={() => setFilterValue(it.nomi)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${
                          filterValue === it.nomi ? "bg-indigo-500 text-white" : "hover:bg-muted"
                        }`}
                      >
                        <span className="truncate">{it.nomi}</span>
                        <Badge variant="outline" className={`ml-1 ${filterValue === it.nomi ? "border-white/30 text-white" : ""}`}>
                          {it.tovar_soni}
                        </Badge>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT — products */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b flex gap-2 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tovar qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button size="sm" variant="outline" onClick={toggleAllFiltered}>
                <Check className="w-3.5 h-3.5 mr-1" />
                Ko&apos;rsatilganlarni {filtered.every(p => selected.has(p.id)) ? "ochish" : "belgilash"}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  Tovar topilmadi
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map(p => {
                    const pAny = p as ProductDto & Record<string, unknown>
                    const isSel = selected.has(p.id)
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer ${
                          isSel ? "bg-indigo-500/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggle(p.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{p.nomi}</div>
                          <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                            {pAny.kategoriya ? <span>📁 {String(pAny.kategoriya)}</span> : null}
                            {pAny.brend ? <span>🏷️ {String(pAny.brend)}</span> : null}
                            {pAny.birlik ? <span>📏 {String(pAny.birlik)}</span> : null}
                            <span className="text-emerald-600">
                              {Number(pAny.olish_narxi || 0).toLocaleString()} so&apos;m
                            </span>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-3 flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <b className="text-foreground">{selected.size}</b> ta tanlandi
            </span>
            {selected.size > 0 && (
              <Button size="sm" variant="ghost" onClick={clearAll}>
                <X className="w-3.5 h-3.5 mr-1" /> Tozalash
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Bekor
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              {selected.size} ta qo&apos;shish
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
