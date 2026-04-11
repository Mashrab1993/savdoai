"use client"

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Search, Plus, Trash2, ShoppingCart, CheckCircle2, User, Minus,
} from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { productService, clientService, savdoService } from "@/lib/api/services"
import { normalizeProduct } from "@/lib/api/normalizers"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm"
}

interface CartItem {
  id: number
  nomi: string
  birlik: string
  narx: number
  miqdor: number
  jami: number
}

export default function SalesPage() {
  const { locale } = useLocale()
  const { data: rawProducts } = useApi(productService.list)
  const { data: rawClients } = useApi(clientService.list)
  const products = useMemo(() => (rawProducts ?? []).map(normalizeProduct), [rawProducts])
  const clients = useMemo(() => (rawClients ?? []).map(c => c.ism || "").filter(Boolean), [rawClients])

  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [klient, setKlient] = useState("")
  const [klientSearch, setKlientSearch] = useState("")
  const [tolangan, setTolangan] = useState("")
  const [izoh, setIzoh] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<number | null>(null)

  // Tovar qidiruv
  const filteredProducts = search.trim().length >= 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  // Klient qidiruv
  const filteredClients = klientSearch.trim().length >= 1
    ? clients.filter(c => c.toLowerCase().includes(klientSearch.toLowerCase())).slice(0, 5)
    : []

  // Savatga qo'shish
  function addToCart(product: ReturnType<typeof normalizeProduct>) {
    const productId = Number(product.id)
    setCart(prev => {
      const existing = prev.find(c => c.id === productId)
      if (existing) {
        return prev.map(c => c.id === productId
          ? { ...c, miqdor: c.miqdor + 1, jami: (c.miqdor + 1) * c.narx }
          : c
        )
      }
      return [...prev, {
        id: productId,
        nomi: product.name,
        birlik: product.unit || "dona",
        narx: product.price,
        miqdor: 1,
        jami: product.price,
      }]
    })
    setSearch("")
  }

  // Miqdor o'zgartirish
  function updateQty(id: number, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c
      const newQty = Math.max(0, c.miqdor + delta)
      return newQty === 0 ? c : { ...c, miqdor: newQty, jami: newQty * c.narx }
    }).filter(c => c.miqdor > 0))
  }

  // Narx o'zgartirish
  function updatePrice(id: number, newPrice: number) {
    setCart(prev => prev.map(c =>
      c.id === id ? { ...c, narx: newPrice, jami: c.miqdor * newPrice } : c
    ))
  }

  // Olib tashlash
  function removeFromCart(id: number) {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  // Hisob-kitob
  const jamiSumma = cart.reduce((s, c) => s + c.jami, 0)
  const tolganSumma = Number(tolangan) || 0
  const qarzSumma = Math.max(0, jamiSumma - tolganSumma)

  // Saqlash
  async function handleSubmit() {
    if (cart.length === 0) return
    setSaving(true)
    setSuccess(null)
    try {
      const result = await savdoService.create({
        klient: klient.trim() || undefined,
        tovarlar: cart.map(c => ({
          nomi: c.nomi,
          miqdor: c.miqdor,
          birlik: c.birlik,
          narx: c.narx,
          kategoriya: "Boshqa",
        })),
        jami_summa: jamiSumma,
        tolangan: tolganSumma,
        qarz: qarzSumma,
        izoh: izoh.trim() || undefined,
      })
      setSuccess(result.sessiya_id)
      setCart([])
      setKlient("")
      setTolangan("")
      setIzoh("")
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const t = {
    title:     locale === "uz" ? "Yangi sotuv"       : "Новая продажа",
    search:    locale === "uz" ? "Tovar izlash..."    : "Поиск товара...",
    client:    locale === "uz" ? "Klient"             : "Клиент",
    clientHint:locale === "uz" ? "Klient ismi..."     : "Имя клиента...",
    cart:      locale === "uz" ? "Savat"              : "Корзина",
    empty:     locale === "uz" ? "Savat bo'sh"        : "Корзина пуста",
    product:   locale === "uz" ? "Tovar"              : "Товар",
    qty:       locale === "uz" ? "Miqdor"             : "Кол-во",
    price:     locale === "uz" ? "Narx"               : "Цена",
    total:     locale === "uz" ? "Jami"               : "Итого",
    paid:      locale === "uz" ? "To'langan"          : "Оплачено",
    debt:      locale === "uz" ? "Qarz"               : "Долг",
    note:      locale === "uz" ? "Izoh"               : "Примечание",
    save:      locale === "uz" ? "Sotuvni saqlash"    : "Сохранить продажу",
    saving:    locale === "uz" ? "Saqlanmoqda..."     : "Сохранение...",
    saved:     locale === "uz" ? "Sotuv saqlandi!"    : "Продажа сохранена!",
    addMore:   locale === "uz" ? "Yana sotuv"         : "Ещё продажа",
    stock:     locale === "uz" ? "Qoldiq"             : "Остаток",
  }

  return (
    <AdminLayout title={t.title}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chap: Tovar qidiruv */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tovar izlash */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {filteredProducts.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg max-h-64 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/70 transition-colors text-left"
                    onClick={() => addToCart(p)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · {p.unit}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold">{fmt(p.price)}</p>
                      <p className={cn("text-xs", p.stock <= 0 ? "text-destructive" : "text-muted-foreground")}>
                        {t.stock}: {p.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Savat jadvali */}
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t.cart} ({cart.length})</span>
            </div>
            {cart.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">{t.empty}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.product}</TableHead>
                    <TableHead className="w-32 text-center">{t.qty}</TableHead>
                    <TableHead className="w-32 text-right">{t.price}</TableHead>
                    <TableHead className="w-32 text-right">{t.total}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="text-sm font-medium">{item.nomi}</span>
                        <span className="text-xs text-muted-foreground ml-1">({item.birlik})</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7"
                                  onClick={() => updateQty(item.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.miqdor}
                            onChange={e => {
                              const v = Math.max(1, Number(e.target.value) || 1)
                              setCart(prev => prev.map(c =>
                                c.id === item.id ? { ...c, miqdor: v, jami: v * c.narx } : c
                              ))
                            }}
                            className="w-14 h-7 text-center text-sm px-1"
                          />
                          <Button variant="outline" size="icon" className="h-7 w-7"
                                  onClick={() => updateQty(item.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.narx}
                          onChange={e => updatePrice(item.id, Number(e.target.value) || 0)}
                          className="w-24 h-7 text-right text-sm ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {fmt(item.jami)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* O'ng: Klient + To'lov */}
        <div className="space-y-4">
          {/* Klient */}
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t.client}</span>
            </div>
            <div className="relative">
              <Input
                placeholder={t.clientHint}
                value={klient || klientSearch}
                onChange={e => {
                  setKlientSearch(e.target.value)
                  setKlient("")
                }}
              />
              {filteredClients.length > 0 && !klient && (
                <div className="absolute z-10 mt-1 w-full bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button key={c}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/70"
                      onClick={() => { setKlient(c); setKlientSearch("") }}
                    >{c}</button>
                  ))}
                </div>
              )}
            </div>
            {klient && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium">{klient}</span>
                <button className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => { setKlient(""); setKlientSearch("") }}>✕</button>
              </div>
            )}
          </div>

          {/* To'lov */}
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.total}</span>
              <span className="text-xl font-bold text-foreground">{fmt(jamiSumma)}</span>
            </div>
            <div>
              <Label className="text-xs">{t.paid}</Label>
              <Input
                type="number"
                placeholder={String(jamiSumma)}
                value={tolangan}
                onChange={e => setTolangan(e.target.value)}
                className="mt-1"
              />
            </div>
            {qarzSumma > 0 && (
              <div className="flex justify-between items-center bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                <span className="text-sm text-destructive">{t.debt}</span>
                <span className="text-sm font-bold text-destructive">{fmt(qarzSumma)}</span>
              </div>
            )}
            <div>
              <Label className="text-xs">{t.note}</Label>
              <Input
                placeholder={locale === "uz" ? "Ixtiyoriy izoh..." : "Комментарий..."}
                value={izoh}
                onChange={e => setIzoh(e.target.value)}
                className="mt-1"
              />
            </div>

            {success && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t.saved} #{success}
                </p>
                <Button variant="outline" size="sm" className="mt-2"
                        onClick={() => setSuccess(null)}>
                  {t.addMore}
                </Button>
              </div>
            )}

            {!success && (
              <Button
                className="w-full"
                disabled={cart.length === 0 || saving}
                onClick={handleSubmit}
              >
                {saving ? t.saving : t.save}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
