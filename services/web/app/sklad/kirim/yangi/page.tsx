"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Search, Plus, Trash2, Building2, Package, Loader2, Save, ScanLine } from "lucide-react"
import Link from "next/link"

interface CartItem { id: number; nomi: string; soni: number; narx: number; }

const SUPPLIERS = [
  { id: 1, name: "SLADUS" }, { id: 2, name: "Вафли" }, { id: 3, name: "PRIMA" },
  { id: 4, name: "EMERALD CANDY" }, { id: 5, name: "ARIEL" }, { id: 6, name: "PERSIL" },
  { id: 7, name: "Cosmo World" }, { id: 8, name: "Толиб Халва" },
]

const PRODUCTS = [
  { id: 64, nomi: "GANJAVALI-Krem", default_price: 28000 },
  { id: 65, nomi: "Муроджон ёнги шоколад", default_price: 9500 },
  { id: 66, nomi: "SLADUS", default_price: 19000 },
  { id: 67, nomi: "ERFIBLESS", default_price: 14000 },
  { id: 69, nomi: "PRIMA GREEN", default_price: 35000 },
  { id: 71, nomi: "PERSIL", default_price: 65000 },
]

export default function YangiKirimPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [supplier, setSupplier] = useState<typeof SUPPLIERS[0] | null>(null)
  const [warehouse, setWarehouse] = useState("Asosiy sklad")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredSuppliers = SUPPLIERS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredProducts = PRODUCTS.filter(p => p.nomi.toLowerCase().includes(productSearch.toLowerCase()))

  const addProduct = (p: typeof PRODUCTS[0]) => {
    const existing = cart.find(i => i.id === p.id)
    if (existing) setCart(cart.map(i => i.id === p.id ? { ...i, soni: i.soni + 1 } : i))
    else setCart([...cart, { id: p.id, nomi: p.nomi, soni: 1, narx: p.default_price }])
  }

  const updateQty = (id: number, soni: number) => {
    if (soni <= 0) setCart(cart.filter(i => i.id !== id))
    else setCart(cart.map(i => i.id === id ? { ...i, soni } : i))
  }
  const updatePrice = (id: number, narx: number) => {
    setCart(cart.map(i => i.id === id ? { ...i, narx } : i))
  }

  const total = cart.reduce((s, i) => s + i.narx * i.soni, 0)

  async function handleSubmit() {
    if (!supplier) return
    if (cart.length === 0) { toast.error("Tovar tanlang"); return }
    setLoading(true)
    try {
      await api.post("/api/v1/kirim", {
        postavshik_id: supplier.id,
        sklad: warehouse,
        sana: date,
        tovarlar: cart.map(i => ({ tovar_id: i.id, soni: i.soni, olish_narxi: i.narx })),
        izoh: comment,
      })
      toast.success("Kirim hujjat yaratildi!")
      router.push("/sklad/kirim")
    } catch (err: any) {
      toast.error(err?.detail || "Xato")
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <Link href="/sklad/kirim" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Kirimlar
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yangi kirim (Postuplenie)</h1>
            <p className="text-base text-slate-500 mt-1">Postavshikdan yuk qabul qilish — Накладная yaratish</p>
          </div>
          {cart.length > 0 && (
            <div className="text-right">
              <div className="text-sm text-slate-500">Umumiy summa</div>
              <div className="text-3xl font-bold text-emerald-700 tabular-nums">{total.toLocaleString()} so'm</div>
            </div>
          )}
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className={`flex-1 flex items-center gap-3 p-3 rounded-lg ${step === 1 ? 'bg-emerald-50 border-2 border-emerald-300' : supplier ? 'bg-slate-50' : 'bg-slate-50 opacity-60'}`}>
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
              <div>
                <div className="text-xs text-slate-500">1-bosqich</div>
                <div className="font-semibold">Postavshik tanlash</div>
                {supplier && <div className="text-sm text-emerald-700 mt-1">✓ {supplier.name}</div>}
              </div>
            </div>
            <div className={`flex-1 flex items-center gap-3 p-3 rounded-lg ${step === 2 ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50 opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500'} flex items-center justify-center font-bold`}>2</div>
              <div>
                <div className="text-xs text-slate-500">2-bosqich</div>
                <div className="font-semibold">Tovarlarni qo'shish</div>
                {cart.length > 0 && <div className="text-sm text-emerald-700 mt-1">✓ {cart.length} ta tovar</div>}
              </div>
            </div>
          </div>
        </Card>

        {step === 1 && (
          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Sklad</label>
                <select value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-full h-11 rounded-lg border-2 border-slate-300 px-4">
                  <option>Asosiy sklad</option>
                  <option>Химия sklad</option>
                  <option>VS sklad</option>
                  <option>Возврат sklad</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Sana</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Postavshik tanlang</h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Postavshik nomi..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {filteredSuppliers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSupplier(s); setStep(2) }}
                    className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                  >
                    <Building2 className="w-6 h-6 text-slate-400" />
                    <div className="font-semibold">{s.name}</div>
                    <ArrowRight className="ml-auto w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {step === 2 && supplier && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 p-6">
              <h3 className="text-lg font-semibold mb-3">Tovarlar</h3>
              <div className="text-sm text-slate-600 mb-3">Postavshik: <strong>{supplier.name}</strong> · Sklad: <strong>{warehouse}</strong></div>
              <div className="relative mb-4">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Skanerlash yoki tovar nomi..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-11" />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div>
                      <div className="font-semibold">{p.nomi}</div>
                      <div className="text-sm text-slate-500">Olish narxi: {p.default_price.toLocaleString()} so'm</div>
                    </div>
                    <Button size="sm" onClick={() => addProduct(p)}>
                      <Plus className="w-4 h-4" /> Qo'shish
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Накладная ({cart.length})</h3>
              {cart.length === 0 && <p className="text-sm text-slate-500">Tovarlar qo'shing →</p>}
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                {cart.map(i => (
                  <div key={i.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">{i.nomi}</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-xs text-slate-500">Soni</label>
                        <input type="number" value={i.soni} onChange={e => updateQty(i.id, +e.target.value)} className="w-full h-9 px-2 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Narx</label>
                        <input type="number" value={i.narx} onChange={e => updatePrice(i.id, +e.target.value)} className="w-full h-9 px-2 border rounded text-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => updateQty(i.id, 0)} className="text-rose-600 text-xs hover:underline">
                        <Trash2 className="w-3.5 h-3.5 inline" /> O'chirish
                      </button>
                      <span className="text-sm font-bold tabular-nums">{(i.narx * i.soni).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <>
                  <div className="border-t pt-3 mb-3">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Jami:</span>
                      <span className="tabular-nums text-emerald-700">{total.toLocaleString()}</span>
                    </div>
                  </div>
                  <textarea className="w-full rounded-lg border-2 border-slate-300 p-2 text-sm mb-3 min-h-[60px]" placeholder="Izoh..." value={comment} onChange={e => setComment(e.target.value)} />
                  <Button onClick={handleSubmit} className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4" /> Saqlash
                  </Button>
                </>
              )}
              <Button onClick={() => setStep(1)} variant="outline" className="w-full mt-2">
                <ArrowLeft className="w-4 h-4" /> Postavshik
              </Button>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
