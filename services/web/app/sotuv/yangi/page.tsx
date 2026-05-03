"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingBag, User, Package, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = {
  id: number
  ism: string
  telefon?: string
  manzil?: string
  qarz?: number
}

type KlientResp = { total: number; items: Klient[] }

type Tovar = {
  id: number
  nomi: string
  kod?: string
  artikul?: string
  birlik?: string
  qoldiq: number
  sotish_narxi: number
}

type TovarResp = { total: number; items: Tovar[] }

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function YangiSotuvPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [step, setStep] = useState(1)
  const [client, setClient] = useState<Klient | null>(null)
  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [cart, setCart] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState("")
  const [tolangan, setTolangan] = useState<string>("")

  const { data: klientResp, loading: klientLoading } = useApi<KlientResp>(
    isAuthenticated ? "/api/v1/klientlar?limit=200" : null
  )
  const { data: tovarResp, loading: tovarLoading } = useApi<TovarResp>(
    isAuthenticated ? "/api/v1/tovarlar?limit=300" : null
  )

  const allClients: Klient[] = klientResp?.items ?? []
  const allProducts: Tovar[] = tovarResp?.items ?? []

  const filteredClients = useMemo(
    () => allClients.filter(c => !search || (c.ism || "").toLowerCase().includes(search.toLowerCase()) || (c.telefon || "").includes(search)),
    [allClients, search],
  )
  const filteredProducts = useMemo(
    () => allProducts.filter(p =>
      !productSearch
      || (p.nomi || "").toLowerCase().includes(productSearch.toLowerCase())
      || (p.kod || "").toLowerCase().includes(productSearch.toLowerCase())
      || (p.artikul || "").toLowerCase().includes(productSearch.toLowerCase())
    ),
    [allProducts, productSearch],
  )

  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const product = allProducts.find(p => p.id === Number(id))
      return product ? { product, qty } : null
    })
    .filter((x): x is { product: Tovar; qty: number } => x !== null)

  const subtotal = cartItems.reduce((s, i) => s + Number(i.product.sotish_narxi) * i.qty, 0)
  const tolanganNum = Number(tolangan) || subtotal
  const qarzNum = Math.max(0, subtotal - tolanganNum)

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
      const payload = {
        klient: client.ism,
        tovarlar: cartItems.map(i => ({
          nomi: i.product.nomi,
          tovar_id: i.product.id,
          miqdor: i.qty,
          narx: Number(i.product.sotish_narxi),
          birlik: i.product.birlik || "dona",
        })),
        jami_summa: subtotal,
        tolangan: tolanganNum,
        qarz: qarzNum,
        izoh: note,
      }
      await api.post("/api/v1/sotuv", payload)
      toast.success("Sotuv saqlandi")
      router.push("/zakazlar")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xato yuz berdi"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl border border-[#E8E0D3] text-center">
          <h2 className="text-xl font-medium mb-2">Tizimga kirmagansiz</h2>
          <p className="text-sm text-[#6B5B4D] mb-4">Sotuv yaratish uchun login qiling.</p>
          <Link href="/login" className="inline-block px-5 py-2 bg-[#C75D3C] text-white rounded-md">Login</Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
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
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="relative max-w-md flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient nomi yoki telefon..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
                </div>
                <Link href="/klientlar/yangi">
                  <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">
                    <Plus className="w-4 h-4 mr-1" /> Yangi klient
                  </Button>
                </Link>
              </div>
              {klientLoading && <p className="text-sm text-[#9C8A6E]">Yuklanmoqda...</p>}
              {!klientLoading && filteredClients.length === 0 && (
                <p className="text-sm text-[#9C8A6E] py-6 text-center">
                  Klient topilmadi. <Link href="/klientlar/yangi" className="text-[#C75D3C] underline">Yangi klient qo'shing</Link>
                </p>
              )}
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
                        <div className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{c.ism}</div>
                        <div className="text-xs text-[#9C8A6E] mt-1">{c.manzil || "—"} · {c.telefon || "—"}</div>
                      </div>
                      {c.qarz && c.qarz > 0 ? (
                        <span className="text-xs px-2 py-0.5 bg-[#F5E5D6] text-[#C75D3C] rounded font-medium">
                          Qarz: {fmt(Math.round(c.qarz / 1000))}k
                        </span>
                      ) : null}
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
                {tovarLoading && <p className="text-sm text-[#9C8A6E]">Yuklanmoqda...</p>}
                {!tovarLoading && filteredProducts.length === 0 && (
                  <p className="text-sm text-[#9C8A6E] py-6 text-center">
                    Tovar topilmadi. <Link href="/sklad/yangi" className="text-[#C75D3C] underline">Yangi tovar qo'shing</Link>
                  </p>
                )}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredProducts.map(p => {
                    const qty = cart[p.id] || 0
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${qty > 0 ? "bg-[#FCE9DD]/40 border-[#C75D3C]/40" : "border-[#E8E0D3] hover:border-[#C75D3C]/30"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#1A1A1A] truncate" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{p.nomi}</div>
                          <div className="text-xs text-[#9C8A6E]">{p.kod || p.artikul || "—"} · Sklad: {p.qoldiq} {p.birlik || "dona"}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium font-mono text-[#1A1A1A]">{fmt(Number(p.sotish_narxi))} so'm</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => updateQty(p.id, -1)} disabled={qty === 0} className="w-8 h-8 rounded-lg bg-[#F0EAE0] hover:bg-[#E8E0D3] disabled:opacity-30 flex items-center justify-center text-[#6B5B4D]">
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={p.qoldiq || undefined}
                            value={qty}
                            onChange={e => {
                              const v = Number(e.target.value)
                              setCart({ ...cart, [p.id]: Number.isFinite(v) && v >= 0 ? v : 0 })
                            }}
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
                  <div className="font-medium text-[#1A1A1A]">{client.ism}</div>
                  <div className="text-xs text-[#9C8A6E]">{client.telefon || "—"}</div>
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
                            <div className="truncate text-[#1A1A1A]">{i.product.nomi}</div>
                            <div className="text-xs text-[#9C8A6E]">{i.qty} × {fmt(Number(i.product.sotish_narxi))}</div>
                          </div>
                          <div className="font-mono font-medium text-emerald-700">{fmt(Number(i.product.sotish_narxi) * i.qty)}</div>
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
                  <div className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{client.ism}</div>
                  <div className="text-sm text-[#6B5B4D]">{client.manzil || "—"} · {client.telefon || "—"}</div>
                </div>
                <div className="p-4 bg-[#FCE9DD]/50 border border-[#C75D3C]/30 rounded-2xl">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C] mb-1">JAMI SUMMA</div>
                  <div className="text-3xl font-medium text-emerald-800 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(subtotal)} so'm</div>
                  <div className="text-sm text-[#6B5B4D]">{cartItems.length} pozitsiya · {cartItems.reduce((s, i) => s + i.qty, 0)} dona</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-[#6B5B4D] mb-2 block">To'langan summa (so'm)</label>
                  <Input
                    type="number"
                    min={0}
                    max={subtotal}
                    value={tolangan}
                    onChange={e => setTolangan(e.target.value)}
                    placeholder={String(subtotal)}
                    className="border-[#E8E0D3]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B5B4D] mb-2 block">Qarz (avtomatik)</label>
                  <div className={`px-3 py-2 rounded-lg border bg-[#FAF7F2] font-mono font-medium ${qarzNum > 0 ? "text-rose-700 border-rose-200" : "text-emerald-700 border-[#E8E0D3]"}`}>
                    {fmt(qarzNum)} so'm
                  </div>
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
                        <td className="py-2 font-medium text-[#1A1A1A]">{i.product.nomi}</td>
                        <td className="py-2 text-right font-mono text-[#6B5B4D]">{i.qty}</td>
                        <td className="py-2 text-right font-mono text-[#6B5B4D]">{fmt(Number(i.product.sotish_narxi))}</td>
                        <td className="py-2 text-right font-mono font-medium text-[#1A1A1A]">{fmt(Number(i.product.sotish_narxi) * i.qty)}</td>
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
                  maxLength={500}
                  className="w-full px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-lg focus:border-[#C75D3C] focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-[#E8E0D3] text-[#6B5B4D]">Ortga (Tovar)</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2" style={{ background: "#C75D3C" }}>
                  {submitting ? "Yuborilmoqda..." : <><ShoppingBag className="w-4 h-4" /> Sotuvni saqlash</>}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
