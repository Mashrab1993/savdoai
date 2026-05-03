"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Sparkles, Tag, Calendar, Users, Package, Save, Eye } from "lucide-react"
import Link from "next/link"

const PRODUCTS = [
  { id: 1, name: "Choco-Boom 75g", price: 12_000 },
  { id: 2, name: "Coca-Cola 1.5L", price: 18_000 },
  { id: 3, name: "Bonjur 50g", price: 6_000 },
  { id: 4, name: "Sok Apelsin 1L", price: 14_000 },
  { id: 5, name: "Pechenye Yubileynoye", price: 8_400 },
]

const CLIENT_TYPES = ["Hammasi", "Champions", "Loyal", "At Risk", "VIP magazinlar"]
const TERRITORIES = ["Hammasi", "Toshkent — Yashnobod", "Toshkent — Sergeli", "Sirdaryo", "Samarqand"]

const SERIF: React.CSSProperties = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function PromotionBuilderPage() {
  const [name, setName] = useState("Choco-Boom may aktsiyasi")
  const [discount, setDiscount] = useState(15)
  const [discountType, setDiscountType] = useState<"%" | "fix" | "1+1">("%")
  const [startDate, setStartDate] = useState("2026-05-05")
  const [endDate, setEndDate] = useState("2026-05-20")
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set([1]))
  const [clientFilter, setClientFilter] = useState("Hammasi")
  const [territoryFilter, setTerritoryFilter] = useState("Hammasi")
  const [minOrderSum, setMinOrderSum] = useState(50_000)

  const selectedProductsArr = PRODUCTS.filter(p => selectedProducts.has(p.id))
  const totalRegularPrice = selectedProductsArr.reduce((s, p) => s + p.price, 0)
  const promoPrice = discountType === "%"
    ? Math.round(totalRegularPrice * (1 - discount / 100))
    : discountType === "fix"
    ? totalRegularPrice - discount
    : Math.round(totalRegularPrice / 2)

  const savings = totalRegularPrice - promoPrice
  const dayCount = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)

  const toggleProduct = (id: number) => {
    const next = new Set(selectedProducts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedProducts(next)
  }

  const fmt = (n: number) => n.toLocaleString("ru-RU")

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Promo <span className="italic text-[#C75D3C]">konstruktori</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Yangi promo aktsiyani yarating va target auditoriyaga jo'nating</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Eye className="w-4 h-4" /> Ko'rib chiqish</Button>
            <Button className="gap-2 text-white" style={{ background: "#C75D3C" }}><Save className="w-4 h-4" /> Saqlash va boshlash</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={SERIF}>
                  <Sparkles className="w-5 h-5 text-[#C75D3C]" /> 1. Promo nomi va davri
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B5B4D] block mb-1">Promo nomi</label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="text-base border-[#E8E0D3]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-[#6B5B4D] block mb-1">Boshlanish</label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-[#E8E0D3]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#6B5B4D] block mb-1">Tugash</label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-[#E8E0D3]" />
                    </div>
                  </div>
                  <div className="text-xs text-[#9C8A6E] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Davomiyligi: {dayCount} kun
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={SERIF}>
                  <Tag className="w-5 h-5 text-[#C75D3C]" /> 2. Chegirma turi
                </h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(["%", "fix", "1+1"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setDiscountType(t)}
                      className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${discountType === t ? "bg-[#F5E5D6] border-[#C75D3C] text-[#C75D3C]" : "bg-white border-[#E8E0D3] text-[#6B5B4D]"}`}
                    >
                      {t === "%" ? "% chegirma" : t === "fix" ? "Fix summa" : "1+1 (BOGOF)"}
                    </button>
                  ))}
                </div>
                {discountType !== "1+1" && (
                  <div>
                    <label className="text-sm font-medium text-[#6B5B4D] block mb-1">{discountType === "%" ? "Chegirma %" : "Chegirma summa (so'm)"}</label>
                    <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="text-2xl font-light font-mono tabular-nums border-[#E8E0D3]" />
                  </div>
                )}
                {discountType === "1+1" && (
                  <div className="p-4 bg-[#FCE9DD] rounded-lg text-sm text-[#D97706]">
                    Klient 1 ta tovar sotib olganda — 2-tasini bepul oladi (50% effective discount).
                  </div>
                )}
              </Card>

              <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={SERIF}>
                  <Package className="w-5 h-5 text-blue-700" /> 3. Tovarlar ({selectedProducts.size}/5)
                </h2>
                <div className="space-y-2">
                  {PRODUCTS.map(p => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedProducts.has(p.id) ? "bg-[#F5E5D6] border-[#C75D3C]" : "bg-white border-[#E8E0D3] hover:border-[#9C8A6E]"}`}
                    >
                      <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-[#C75D3C]" />
                      <div className="flex-1">
                        <div className="font-medium text-[#1A1A1A]">{p.name}</div>
                        <div className="text-xs text-[#9C8A6E] font-mono tabular-nums">{fmt(p.price)} so'm</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={SERIF}>
                  <Users className="w-5 h-5 text-purple-700" /> 4. Target auditoriya
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#6B5B4D] block mb-1">Klient segmenti</label>
                    <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full border border-[#E8E0D3] rounded-md px-3 py-2 text-sm bg-white">
                      {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B5B4D] block mb-1">Hudud</label>
                    <select value={territoryFilter} onChange={e => setTerritoryFilter(e.target.value)} className="w-full border border-[#E8E0D3] rounded-md px-3 py-2 text-sm bg-white">
                      {TERRITORIES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B5B4D] block mb-1">Min. zakaz summasi</label>
                    <Input type="number" value={minOrderSum} onChange={e => setMinOrderSum(Number(e.target.value))} className="border-[#E8E0D3]" />
                  </div>
                </div>
              </Card>

              <Card className="bg-[#FAF7F2] border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <h2 className="text-xl font-light mb-4 text-[#1A1A1A]" style={SERIF}>Promo ko'rinishi</h2>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#F0EAE0]">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#C75D3C] font-medium mb-1">{startDate} — {endDate}</div>
                  <h3 className="text-2xl font-light mb-3 text-[#1A1A1A]" style={SERIF}>{name}</h3>

                  <div className="space-y-2 mb-4">
                    {selectedProductsArr.map(p => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-[#1A1A1A]">{p.name}</span>
                        <span className="font-mono tabular-nums text-[#9C8A6E] line-through">{fmt(p.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-[#E8E0D3] pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9C8A6E]">Eski narx</span>
                      <span className="font-mono tabular-nums line-through text-[#9C8A6E]">{fmt(totalRegularPrice)} so'm</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-[#C75D3C]">Sizning iqtisodingiz</span>
                      <span className="font-mono tabular-nums text-[#C75D3C]">−{fmt(savings)} so'm</span>
                    </div>
                    <div className="flex justify-between text-lg font-light border-t border-[#F0EAE0] pt-2" style={SERIF}>
                      <span className="text-emerald-700">YANGI NARX</span>
                      <span className="font-mono tabular-nums text-emerald-700">{fmt(promoPrice)} so'm</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-emerald-50 p-2 rounded text-center">
                      <div className="text-emerald-700 font-medium">Davr</div>
                      <div className="font-mono tabular-nums text-[#1A1A1A]">{dayCount} kun</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-blue-700 font-medium">Min. zakaz</div>
                      <div className="font-mono tabular-nums text-[#1A1A1A]">{fmt(minOrderSum / 1000)}k</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-purple-700 font-medium">Auditoriya</div>
                      <div className="font-mono tabular-nums text-[10px] text-[#1A1A1A]">{clientFilter}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
