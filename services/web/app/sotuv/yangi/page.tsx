"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingBag, User, Package, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api"

const CLIENTS = [
  { id: 1, name: "Salom Magazin №1", region: "Sergeli", phone: "+998901234567", debt: 0 },
  { id: 2, name: "Asia Optom", region: "Sergeli", phone: "+998935678901", debt: 18_500_000 },
  { id: 3, name: "Lider Chakana", region: "Bog'ishamol", phone: "+998901112233", debt: 0 },
  { id: 4, name: "Globus Plus", region: "Markaz", phone: "+998975544332", debt: 12_300_000 },
  { id: 5, name: "Mega Market", region: "Sergeli", phone: "+998935544221", debt: 0 },
]

const PRODUCTS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", price: 5500, stock: 124 },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", price: 11200, stock: 86 },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", price: 8400, stock: 248 },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", price: 12500, stock: 156 },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", price: 6400, stock: 96 },
  { id: 6, name: "Pechenye Yubileynoye", code: "COOK-YUB-500", price: 10400, stock: 64 },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET", price: 14800, stock: 184 },
  { id: 8, name: "Fanta Orange 1.5L", code: "FT-15-PET", price: 14500, stock: 124 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function YangiSotuvPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [client, setClient] = useState<typeof CLIENTS[0] | null>(null)
  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [cart, setCart] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState("")

  const filteredClients = CLIENTS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const filteredProducts = PRODUCTS.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase()))

  const cartItems = Object.entries(cart).filter(([_, q]) => q > 0).map(([id, qty]) => ({
    product: PRODUCTS.find(p => p.id === Number(id))!,
    qty,
  }))
  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0)

  const updateQty = (id: number, delta: number) => {
    const newQty = Math.max(0, (cart[id] || 0) + delta)
    setCart({ ...cart, [id]: newQty })
  }

  const handleSubmit = async () => {
    if (!client || cartItems.length === 0) {
      toast.error("Klient va tovar tanlang")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/api/v1/zakaz", {
        klient_id: client.id,
        izoh: note,
        items: cartItems.map(i => ({ tovar_id: i.product.id, miqdor: i.qty, narx: i.product.price })),
      })
      toast.success("Zakaz yaratildi")
      router.push("/zakazlar")
    } catch (e: any) {
      toast.error(e?.detail || "Xato yuz berdi (login kerak bo'lishi mumkin)")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Yangi <span className="italic text-[#C75D3C]">zakaz</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">3 bosqich: Klient → Tovar → Tasdiqlash</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[
              { n: 1, label: "Klient", icon: User },
              { n: 2, label: "Tovarlar", icon: Package },
              { n: 3, label: "Tasdiqlash", icon: CheckCircle2 },
            ].map(s => {
              const Icon = s.icon
              const isActive = step === s.n
              const isDone = step > s.n
              return (
                <div key={s.n} className="flex items-center gap-2 flex-1">
                  <div className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                    isActive ? "border-[#C75D3C] bg-[#FCE9DD]/50" :
                    isDone ? "border-[#C75D3C]/40 bg-[#FCE9DD]/20" :
                    "border-[#E8E0D3] bg-white"
                  }`}>
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      isActive ? "text-white" :
                      isDone ? "text-white" :
                      "bg-[#F0EAE0] text-[#9C8A6E]"
                    }`} style={isActive || isDone ? { background: "#C75D3C" } : {}}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-medium" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.n}</span>}
                    </div>
                    <Icon className={`w-5 h-5 ${isActive || isDone ? "text-[#C75D3C]" : "text-[#9C8A6E]"}`} />
                    <span className={`font-medium ${isActive ? "text-[#C75D3C]" : isDone ? "text-[#C75D3C]/70" : "text-[#9C8A6E]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.label}</span>
                  </div>
                  {s.n < 3 && <div className={`w-4 h-0.5 ${isDone ? "bg-[#C75D3C]" : "bg-[#E8E0D3]"}`} />}
                </div>
              )
            })}
          </div>

          {step === 1 && (
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h2 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Klient tanlang</h2>
              <div className="relative max-w-md mb-5">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient nomi yoki telefon..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setClient(c); setStep(2) }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                      client?.id === c.id ? "border-[#C75D3C] bg-[#FCE9DD]/40" : "border-[#E8E0D3] bg-white hover:border-[#C75D3C]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{c.name}</div>
                        <div className="text-xs text-[#9C8A6E] mt-1">{c.region} · {c.phone}</div>
                      </div>
                      {c.debt > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-[#F5E5D6] text-[#C75D3C] rounded font-medium">
                          Qarz: {fmt(c.debt / 1_000_000)}M
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === 2 && client && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="p-6 lg:col-span-2 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Tovar qo'shing</h2>
                  <span className="text-sm text-[#9C8A6E]">{cartItems.length} ta tanlandi</span>
                </div>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                  <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Tovar nomi yoki kod..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredProducts.map(p => {
                    const qty = cart[p.id] || 0
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${qty > 0 ? "bg-[#FCE9DD]/40 border-[#C75D3C]/40" : "border-[#E8E0D3] hover:border-[#C75D3C]/30"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#1A1A1A] truncate" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{p.name}</div>
                          <div className="text-xs text-[#9C8A6E]">{p.code} · Sklad: {p.stock} dona</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium font-mono text-[#1A1A1A]">{fmt(p.price)} so'm</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => updateQty(p.id, -1)} disabled={qty === 0} className="w-8 h-8 rounded-lg bg-[#F0EAE0] hover:bg-[#E8E0D3] disabled:opacity-30 flex items-center justify-center text-[#6B5B4D]">
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={qty}
                            onChange={e => setCart({ ...cart, [p.id]: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-16 h-8 text-center font-medium border border-[#E8E0D3] rounded-lg bg-white"
                          />
                          <button onClick={() => updateQty(p.id, 1)} className="w-8 h-8 rounded-lg bg-[#FCE9DD] hover:bg-[#F5C9B0] text-[#C75D3C] flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-6 sticky top-4 self-start bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                <h2 className="text-xl font-light text-[#1A1A1A] mb-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Savatcha</h2>
                <div className="text-sm mb-4 pb-4 border-b border-[#F0EAE0]">
                  <div className="font-medium text-[#1A1A1A]">{client.name}</div>
                  <div className="text-xs text-[#9C8A6E]">{client.region}</div>
                </div>
                {cartItems.length === 0 ? (
                  <p className="text-center text-[#9C8A6E] py-8 text-sm">Hozircha bo'sh</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                      {cartItems.map(i => (
                        <div key={i.product.id} className="flex items-center gap-2 text-sm">
                          <button onClick={() => setCart({ ...cart, [i.product.id]: 0 })} className="flex-shrink-0 text-[#C75D3C] hover:bg-[#FCE9DD] rounded p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[#1A1A1A]">{i.product.name}</div>
                            <div className="text-xs text-[#9C8A6E]">{i.qty} × {fmt(i.product.price)}</div>
                          </div>
                          <div className="font-mono font-medium text-emerald-700">{fmt(i.product.price * i.qty)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#F0EAE0] pt-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#9C8A6E]">Tovar soni:</span>
                        <span className="font-medium text-[#1A1A1A]">{cartItems.reduce((s, i) => s + i.qty, 0)} dona</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[#1A1A1A] font-medium">Jami:</span>
                        <span className="text-2xl font-medium text-emerald-700 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(subtotal)} so'm</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="w-full border-[#E8E0D3] text-[#6B5B4D]">Ortga (Klient)</Button>
                  <Button onClick={() => setStep(3)} disabled={cartItems.length === 0} className="w-full gap-2" style={{ background: "#C75D3C" }}>
                    Davom etish <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 3 && client && (
            <Card className="p-7 max-w-3xl mx-auto bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h2 className="text-2xl font-light mb-6 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <CheckCircle2 className="w-6 h-6 text-[#C75D3C]" />
                Zakazni tasdiqlang
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[#FAF7F2] border border-[#E8E0D3] rounded-2xl">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#9C8A6E] mb-1">KLIENT</div>
                  <div className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{client.name}</div>
                  <div className="text-sm text-[#6B5B4D]">{client.region} · {client.phone}</div>
                </div>
                <div className="p-4 bg-[#FCE9DD]/50 border border-[#C75D3C]/30 rounded-2xl">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C] mb-1">JAMI SUMMA</div>
                  <div className="text-3xl font-medium text-emerald-800 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(subtotal)} so'm</div>
                  <div className="text-sm text-[#6B5B4D]">{cartItems.length} pozitsiya · {cartItems.reduce((s, i) => s + i.qty, 0)} dona</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Tovarlar:</h3>
                <table className="w-full text-sm">
                  <thead className="border-b border-[#E8E0D3]">
                    <tr>
                      <th className="text-left py-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                      <th className="text-right py-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                      <th className="text-right py-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Narx</th>
                      <th className="text-right py-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(i => (
                      <tr key={i.product.id} className="border-b border-[#F0EAE0]">
                        <td className="py-2 font-medium text-[#1A1A1A]">{i.product.name}</td>
                        <td className="py-2 text-right font-mono text-[#6B5B4D]">{i.qty}</td>
                        <td className="py-2 text-right font-mono text-[#6B5B4D]">{fmt(i.product.price)}</td>
                        <td className="py-2 text-right font-mono font-medium text-[#1A1A1A]">{fmt(i.product.price * i.qty)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#FAF7F2] text-base">
                      <td className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" colSpan={3}>Jami:</td>
                      <td className="py-3 text-right text-emerald-700 font-medium tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(subtotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-[#6B5B4D] mb-2 block">Izoh (ixtiyoriy)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Yetkazib berish vaqti, qo'shimcha shartlar..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-lg focus:border-[#C75D3C] focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-[#E8E0D3] text-[#6B5B4D]">Ortga (Tovar)</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2" style={{ background: "#C75D3C" }}>
                  {submitting ? "Yuborilmoqda..." : <><ShoppingBag className="w-4 h-4" /> Zakazni tasdiqlash</>}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
