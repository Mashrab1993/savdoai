"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Search, ShoppingCart, Plus, Minus, Send, Package, Phone,
  User, MessageSquare, CheckCircle2, Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getPublicApiBaseUrl } from "@/lib/api/base-url"

interface TovarItem {
  id: number
  nomi: string
  kategoriya?: string
  sotish_narxi: number
  birlik?: string
  qoldiq: number
}

interface CartItem extends TovarItem {
  miqdor: number
  jami: number
}

function fmt(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm"
}

export default function ShopPage() {
  const params = useParams()
  const dokonId = params.id as string

  const [tovarlar, setTovarlar] = useState<TovarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  // Buyurtma form
  const [ism, setIsm] = useState("")
  const [telefon, setTelefon] = useState("")
  const [izoh, setIzoh] = useState("")
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  // Tovarlarni yuklash
  useEffect(() => {
    async function load() {
      try {
        const base = getPublicApiBaseUrl()
        const res = await fetch(`${base}/api/v1/dokon/${dokonId}/tovarlar`)
        if (!res.ok) throw new Error("Tovarlar yuklanmadi")
        const data = await res.json()
        setTovarlar(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xato")
      } finally {
        setLoading(false)
      }
    }
    if (dokonId) load()
  }, [dokonId])

  // Filter
  const filtered = useMemo(() => {
    if (!search) return tovarlar
    const q = search.toLowerCase()
    return tovarlar.filter(
      (t) => t.nomi.toLowerCase().includes(q) ||
             (t.kategoriya || "").toLowerCase().includes(q)
    )
  }, [tovarlar, search])

  // Cart actions
  const addToCart = (t: TovarItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === t.id)
      if (existing) {
        return prev.map((c) =>
          c.id === t.id
            ? { ...c, miqdor: c.miqdor + 1, jami: (c.miqdor + 1) * c.sotish_narxi }
            : c
        )
      }
      return [...prev, { ...t, miqdor: 1, jami: t.sotish_narxi }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id
            ? { ...c, miqdor: c.miqdor + delta, jami: (c.miqdor + delta) * c.sotish_narxi }
            : c
        )
        .filter((c) => c.miqdor > 0)
    )
  }

  const total = cart.reduce((s, c) => s + c.jami, 0)

  // Buyurtma yuborish
  const handleSubmit = async () => {
    if (!ism.trim()) return
    setSending(true)
    try {
      const base = getPublicApiBaseUrl()
      const res = await fetch(`${base}/api/v1/dokon/${dokonId}/buyurtma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          klient_ismi: ism.trim(),
          telefon: telefon.trim(),
          izoh: izoh.trim(),
          tovarlar: cart.map((c) => ({ id: c.id, miqdor: c.miqdor })),
        }),
      })
      if (!res.ok) throw new Error("Buyurtma xatosi")
      setSuccess(true)
      setCart([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xato")
    } finally {
      setSending(false)
    }
  }

  // Muvaffaqiyat
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Buyurtma yuborildi!</h2>
          <p className="text-muted-foreground mb-6">
            Do&apos;konchi tez orada bog&apos;lanadi
          </p>
          <Button onClick={() => { setSuccess(false); setIsm(""); setTelefon(""); setIzoh("") }}>
            Yangi buyurtma
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm">SavdoAI Do&apos;kon</h1>
            <p className="text-[11px] text-muted-foreground">Buyurtma bering</p>
          </div>
          {cart.length > 0 && (
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="relative">
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {fmt(total)}
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 min-w-[20px] text-[10px]"
                  >
                    {cart.length}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Savat ({cart.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 overflow-y-auto max-h-[30vh]">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 py-2 border-b">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.nomi}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(item.sotish_narxi)} × {item.miqdor}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon" variant="outline" className="h-7 w-7"
                          onClick={() => updateQty(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.miqdor}
                        </span>
                        <Button
                          size="icon" variant="outline" className="h-7 w-7"
                          onClick={() => updateQty(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-bold text-sm w-24 text-right">{fmt(item.jami)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Jami:</span>
                    <span className="text-primary">{fmt(total)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Ismingiz *</Label>
                        <Input
                          value={ism} onChange={(e) => setIsm(e.target.value)}
                          placeholder="Ismingizni kiriting"
                          className="h-9"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Telefon</Label>
                        <Input
                          value={telefon} onChange={(e) => setTelefon(e.target.value)}
                          placeholder="+998..."
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Textarea
                      value={izoh} onChange={(e) => setIzoh(e.target.value)}
                      placeholder="Izoh (ixtiyoriy)"
                      rows={2}
                    />
                  </div>
                  <Button
                    className="w-full h-12 text-base"
                    onClick={handleSubmit}
                    disabled={!ism.trim() || cart.length === 0 || sending}
                  >
                    {sending ? (
                      <span className="animate-spin mr-2">⏳</span>
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    Buyurtma yuborish
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="sticky top-[57px] z-10 bg-background/95 backdrop-blur-sm px-4 py-2 border-b">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tovar qidirish..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12 text-red-500">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Tovarlar topilmadi</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((t) => {
            const inCart = cart.find((c) => c.id === t.id)
            return (
              <button
                key={t.id}
                onClick={() => addToCart(t)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  "hover:shadow-md active:scale-[0.97]",
                  "bg-card",
                  inCart && "border-primary/50 bg-primary/5",
                  t.qoldiq <= 0 && "opacity-40 pointer-events-none"
                )}
              >
                <div className="w-full h-16 bg-muted rounded-lg mb-2 flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground/20" />
                </div>
                <p className="font-medium text-sm truncate">{t.nomi}</p>
                {t.kategoriya && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t.kategoriya}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-bold text-primary text-sm">
                    {fmt(t.sotish_narxi)}
                  </span>
                  {inCart && (
                    <Badge variant="default" className="text-[10px] h-5">
                      {inCart.miqdor}
                    </Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {/* Floating cart button (mobile) */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <Button
            size="lg"
            className="rounded-full shadow-xl h-14 px-6 gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{cart.length} ta</span>
            <span className="font-bold">{fmt(total)}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
