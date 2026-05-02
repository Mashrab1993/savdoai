"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Search, Plus, Trash2, Check, ShoppingBag, User, Package, Loader2 } from "lucide-react"
import Link from "next/link"

interface CartItem { id: number; nomi: string; narx: number; soni: number; }

const CLIENTS = [
  { id: 36, nomi: "Аббос Ака Мирбозор №55", phone: "+998 90 123" },
  { id: 4206, nomi: "Бегзод Маркет № 0", phone: "+998 91 316" },
  { id: 4797, nomi: "Akmal Aka Narimon №88", phone: "+998 90 567" },
  { id: 5301, nomi: "Булунгур Астановка №3", phone: "+998 90 234" },
]

const PRODUCTS = [
  { id: 64, nomi: "GANJAVALI-Krem", narx: 35000, qoldiq: 1250 },
  { id: 65, nomi: "Муроджон ёнги шоколад", narx: 12000, qoldiq: 850 },
  { id: 66, nomi: "SLADUS", narx: 24000, qoldiq: 320 },
  { id: 67, nomi: "ERFIBLESS", narx: 18000, qoldiq: 12 },
  { id: 69, nomi: "PRIMA GREEN", narx: 45000, qoldiq: 450 },
  { id: 71, nomi: "PERSIL", narx: 82000, qoldiq: 320 },
]

export default function YangiZakazPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [client, setClient] = useState<typeof CLIENTS[0] | null>(null)
  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredClients = CLIENTS.filter(c => c.nomi.toLowerCase().includes(search.toLowerCase()))
  const filteredProducts = PRODUCTS.filter(p => p.nomi.toLowerCase().includes(productSearch.toLowerCase()))

  const addToCart = (p: typeof PRODUCTS[0]) => {
    const existing = cart.find(i => i.id === p.id)
    if (existing) {
      setCart(cart.map(i => i.id === p.id ? { ...i, soni: i.soni + 1 } : i))
    } else {
      setCart([...cart, { id: p.id, nomi: p.nomi, narx: p.narx, soni: 1 }])
    }
  }

  const updateQty = (id: number, soni: number) => {
    if (soni <= 0) setCart(cart.filter(i => i.id !== id))
    else setCart(cart.map(i => i.id === id ? { ...i, soni } : i))
  }

  const total = cart.reduce((s, i) => s + i.narx * i.soni, 0)

  async function handleSubmit() {
    if (!client) return
    if (cart.length === 0) { toast.error("Tovar tanlang"); return }
    setLoading(true)
    try {
      await api.post("/api/v1/sotuv", {
        klient_id: client.id,
        tovarlar: cart.map(i => ({ tovar_id: i.id, soni: i.soni, narx: i.narx })),
        izoh: comment,
      })
      toast.success("Zakaz yaratildi!")
      router.push("/zakazlar")
    } catch (err: any) {
      toast.error(err?.detail || "Xato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <Link href="/zakazlar" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Zakazlar
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yangi zakaz</h1>
            <p className="text-base text-slate-500 mt-1">3 bosqichli wizard: Klient → Tovar → Tasdiqlash</p>
          </div>
          {cart.length > 0 && (
            <div className="text-right">
              <div className="text-sm text-slate-500">Joriy summa</div>
              <div className="text-3xl font-bold text-emerald-700 tabular-nums">{total.toLocaleString()} so'm</div>
            </div>
          )}
        </div>

        {/* Stepper */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Step n={1} active={step === 1} done={step > 1} icon={User} label="Klient tanlash" />
            <div className={`flex-1 h-1 mx-3 rounded ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <Step n={2} active={step === 2} done={step > 2} icon={Package} label="Tovar tanlash" />
            <div className={`flex-1 h-1 mx-3 rounded ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <Step n={3} active={step === 3} done={false} icon={Check} label="Tasdiqlash" />
          </div>
        </Card>

        {/* Step 1: Client */}
        {step === 1 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Klientni tanlang</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="Klient nomi yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" autoFocus />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setClient(c); setStep(2) }}
                  className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{c.nomi}</div>
                    <div className="text-sm text-slate-500">{c.phone}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 2: Products */}
        {step === 2 && client && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Product list */}
            <Card className="lg:col-span-2 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tovarlar</h3>
                <span className="text-sm text-slate-500">Klient: <strong>{client.nomi}</strong></span>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Tovar qidirish..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-11" />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div>
                      <div className="font-semibold">{p.nomi}</div>
                      <div className="text-sm text-slate-500">Narx: {p.narx.toLocaleString()} so'm · Qoldiq: {p.qoldiq}</div>
                    </div>
                    <Button size="sm" onClick={() => addToCart(p)}>
                      <Plus className="w-4 h-4" /> Qo'shish
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Savatda ({cart.length})</h3>
              {cart.length === 0 && <p className="text-sm text-slate-500">Tovarlar qo'shing</p>}
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                {cart.map(i => (
                  <div key={i.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">{i.nomi}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(i.id, i.soni - 1)} className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200">−</button>
                        <input type="number" value={i.soni} onChange={e => updateQty(i.id, +e.target.value)} className="w-14 h-8 text-center border rounded" />
                        <button onClick={() => updateQty(i.id, i.soni + 1)} className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200">+</button>
                      </div>
                      <button onClick={() => updateQty(i.id, 0)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="text-sm font-semibold text-right tabular-nums mt-1">
                      {(i.narx * i.soni).toLocaleString()} so'm
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Jami:</span>
                    <span className="tabular-nums text-emerald-700">{total.toLocaleString()} so'm</span>
                  </div>
                  <Button onClick={() => setStep(3)} className="w-full mt-3" size="lg">
                    Davom etish <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button onClick={() => setStep(1)} variant="outline" className="w-full mt-2">
                <ArrowLeft className="w-4 h-4" /> Klient o'zgartirish
              </Button>
            </Card>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && client && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tasdiqlang</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">Klient</div>
                <div className="text-lg font-semibold">{client.nomi}</div>
                <div className="text-sm text-slate-600">{client.phone}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">Umumiy summa</div>
                <div className="text-3xl font-bold text-emerald-700 tabular-nums">{total.toLocaleString()} so'm</div>
                <div className="text-sm text-slate-600">{cart.length} ta tovar · {cart.reduce((s, i) => s + i.soni, 0)} dona</div>
              </div>
            </div>

            <h4 className="text-base font-semibold mb-2">Tovarlar</h4>
            <table className="w-full mb-5">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 text-sm">Tovar</th>
                  <th className="text-right px-3 py-2 text-sm">Narx</th>
                  <th className="text-right px-3 py-2 text-sm">Soni</th>
                  <th className="text-right px-3 py-2 text-sm">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.map(i => (
                  <tr key={i.id}>
                    <td className="px-3 py-2 font-medium">{i.nomi}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.narx.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.soni}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{(i.narx * i.soni).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50 font-bold">
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-right text-lg">Jami:</td>
                  <td className="px-3 py-3 text-right text-2xl tabular-nums text-emerald-700">{total.toLocaleString()} so'm</td>
                </tr>
              </tfoot>
            </table>

            <div className="mb-5">
              <label className="text-sm font-medium mb-2 block">Izoh (ixtiyoriy)</label>
              <textarea className="w-full rounded-lg border-2 border-slate-300 p-3 min-h-[80px]" value={comment} onChange={e => setComment(e.target.value)} placeholder="Qo'shimcha izoh..." />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </Button>
              <Button size="lg" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                <ShoppingBag className="w-5 h-5" />
                {loading ? "Saqlanmoqda..." : "Zakazni yaratish"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

function Step({ n, active, done, icon: Icon, label }: { n: number; active: boolean; done: boolean; icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
        done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-100' : 'bg-slate-100 text-slate-400'
      }`}>
        {done ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
      </div>
      <div>
        <div className="text-xs text-slate-500">{n}-bosqich</div>
        <div className={`text-sm font-medium ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>{label}</div>
      </div>
    </div>
  )
}
