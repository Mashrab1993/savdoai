"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ShoppingCart, Save, X, Plus, Search, User, Trash2, Package,
  CreditCard, AlertCircle, Check,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { productService, clientService, savdoService } from "@/lib/api/services"

type Product = {
  id: number; nomi: string; birlik?: string;
  sotish_narxi?: number; olish_narxi?: number;
  qoldiq?: number;
}

type Client = {
  id: number; ism?: string; telefon?: string; manzil?: string;
  kredit_limit?: number; jami_sotib?: number;
}

type CartItem = {
  tovar_id?: number; nomi: string; birlik: string;
  miqdor: number; narx: number; jami: number;
  max_qoldiq?: number;
}

export default function OrderCreatePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cart, setCart] = useState<CartItem[]>([])

  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [newClient, setNewClient] = useState("")

  const [productSearch, setProductSearch] = useState("")
  const [showProductPicker, setShowProductPicker] = useState(false)

  const [tolangan, setTolangan] = useState("")
  const [izoh, setIzoh] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    productService.list()
      .then(items => setProducts(items.map(p => ({
        id: p.id, nomi: p.nomi || "", birlik: p.birlik,
        sotish_narxi: p.sotish_narxi, olish_narxi: p.olish_narxi,
        qoldiq: p.qoldiq,
      }))))
      .catch(() => {})
    clientService.list()
      .then(items => setClients(items))
      .catch(() => {})
  }, [])

  const jami = useMemo(
    () => cart.reduce((s, i) => s + Number(i.jami || 0), 0),
    [cart]
  )
  const qarz = Math.max(0, jami - (Number(tolangan) || 0))

  function addToCart(p: Product) {
    const existing = cart.findIndex(c => c.tovar_id === p.id)
    if (existing >= 0) {
      updateItem(existing, { miqdor: cart[existing].miqdor + 1 })
    } else {
      const narx = Number(p.sotish_narxi) || 0
      setCart([...cart, {
        tovar_id:  p.id,
        nomi:      p.nomi,
        birlik:    p.birlik || "dona",
        miqdor:    1,
        narx,
        jami:      narx,
        max_qoldiq: p.qoldiq,
      }])
    }
    setShowProductPicker(false)
    setProductSearch("")
  }

  function updateItem(idx: number, patch: Partial<CartItem>) {
    setCart(c => c.map((item, i) => {
      if (i !== idx) return item
      const merged = { ...item, ...patch }
      merged.jami = Number(merged.miqdor || 0) * Number(merged.narx || 0)
      return merged
    }))
  }

  function removeItem(idx: number) {
    setCart(c => c.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (cart.length === 0) { setError("Hech bo'lmaganda 1 ta tovar kerak"); return }
    setError(""); setSaving(true)
    try {
      const klientName = selectedClient?.ism || newClient.trim()
      await savdoService.create({
        klient: klientName || undefined,
        tovarlar: cart.map(c => ({
          nomi:   c.nomi,
          miqdor: c.miqdor,
          birlik: c.birlik,
          narx:   c.narx,
        })),
        jami_summa: jami,
        tolangan:   Number(tolangan) || 0,
        qarz:       qarz,
        izoh,
      })
      setSuccess(true)
      setTimeout(() => router.push("/orders"), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products
    .filter(p => !productSearch || p.nomi.toLowerCase().includes(productSearch.toLowerCase()))
    .slice(0, 30)

  const filteredClients = clients
    .filter(c =>
      !clientSearch ||
      (c.ism || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.telefon || "").includes(clientSearch)
    )
    .slice(0, 20)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            Yangi sotuv
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Web POS — mijoz, tovarlar, to&apos;lov va qarz
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 flex items-center gap-2">
            <Check className="w-5 h-5" /> Muvaffaqiyatli saqlandi! /orders sahifasiga yo&apos;naltirilmoqda...
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {/* Client */}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> Mijoz
          </h2>
          {selectedClient ? (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg p-3">
              <div>
                <div className="font-semibold">{selectedClient.ism}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedClient.telefon} · {selectedClient.manzil}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowClientPicker(true)}>
                <Search className="w-3 h-3 mr-1" /> Mavjud mijoz
              </Button>
              <Input
                placeholder="Yoki yangi mijoz ismini yozing..."
                value={newClient}
                onChange={e => setNewClient(e.target.value)}
                className="flex-1 min-w-40"
              />
            </div>
          )}
        </div>

        {/* Products */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Package className="w-4 h-4" /> Tovarlar ({cart.length})
            </h2>
            <Button size="sm" onClick={() => setShowProductPicker(true)}>
              <Plus className="w-3 h-3 mr-1" /> Tovar qo&apos;shish
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Tovar qo&apos;shilmagan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tovar</TableHead>
                  <TableHead className="w-24 text-center">Miqdor</TableHead>
                  <TableHead className="w-32 text-right">Narx</TableHead>
                  <TableHead className="w-32 text-right">Jami</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{item.nomi}</div>
                      {item.max_qoldiq !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Qoldiq: {item.max_qoldiq} {item.birlik}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.miqdor}
                             onChange={e => updateItem(i, { miqdor: Number(e.target.value) })}
                             className="text-center w-20 mx-auto" min="0" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.narx}
                             onChange={e => updateItem(i, { narx: Number(e.target.value) })}
                             className="text-right" />
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(item.jami)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                              onClick={() => removeItem(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Summary */}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> To&apos;lov
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Jami:</span>
              <span className="font-mono font-bold">{formatCurrency(jami)}</span>
            </div>
            <div>
              <Label>To&apos;langan summa</Label>
              <Input type="number" value={tolangan}
                     onChange={e => setTolangan(e.target.value)}
                     placeholder="0 (to'liq qarz)" />
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setTolangan(String(jami))}>
                  To&apos;liq ({formatCurrency(jami)})
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTolangan("0")}>
                  Qarz (0)
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTolangan(String(jami / 2))}>
                  Yarim
                </Button>
              </div>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-3">
              <span>Qarz qoladi:</span>
              <span className={qarz > 0 ? "text-rose-600 dark:text-rose-400 font-mono" : "text-emerald-600 font-mono"}>
                {formatCurrency(qarz)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label>Izoh</Label>
          <Textarea value={izoh} onChange={e => setIzoh(e.target.value)}
                    rows={2} placeholder="Buyurtma haqida qo'shimcha ma'lumot..." />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/orders")}>
            <X className="w-4 h-4 mr-1" /> Bekor
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving || cart.length === 0}>
            {saving ? (
              <>Saqlanmoqda...</>
            ) : (
              <><Save className="w-4 h-4 mr-1" /> Sotuv yaratish</>
            )}
          </Button>
        </div>

        {/* Client picker dialog */}
        <Dialog open={showClientPicker} onOpenChange={setShowClientPicker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mijoz tanlash</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Ism yoki telefon..." value={clientSearch}
                       onChange={e => setClientSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredClients.map(c => (
                  <button key={c.id} type="button"
                          onClick={() => {
                            setSelectedClient(c)
                            setNewClient("")
                            setShowClientPicker(false)
                          }}
                          className="w-full text-left p-3 border rounded-lg hover:bg-secondary/50 transition">
                    <div className="font-medium">{c.ism}</div>
                    <div className="text-xs text-muted-foreground flex gap-3">
                      {c.telefon && <span>📞 {c.telefon}</span>}
                      {Number(c.jami_sotib) > 0 && (
                        <span>Jami: {formatCurrency(Number(c.jami_sotib))}</span>
                      )}
                    </div>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Mijoz topilmadi
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product picker dialog */}
        <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tovar qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Tovar qidirish..." value={productSearch}
                       onChange={e => setProductSearch(e.target.value)} className="pl-10" autoFocus />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {filteredProducts.map(p => (
                  <button key={p.id} type="button"
                          onClick={() => addToCart(p)}
                          className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition">
                    <div className="text-left">
                      <div className="font-medium">{p.nomi}</div>
                      <div className="text-xs text-muted-foreground">
                        Qoldiq: {p.qoldiq || 0} {p.birlik}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{formatCurrency(Number(p.sotish_narxi) || 0)}</div>
                      <Badge variant="outline" className="text-xs">
                        +1 qo&apos;shish
                      </Badge>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Tovar topilmadi
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
