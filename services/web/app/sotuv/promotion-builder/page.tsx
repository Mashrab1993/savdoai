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

const CLIENT_TYPES = ["Hammasi", "Champions (👑)", "Loyal (⭐)", "At Risk (⚠️)", "VIP magazinlar"]
const TERRITORIES = ["Hammasi", "Toshkent — Yashnobod", "Toshkent — Sergeli", "Sirdaryo", "Samarqand"]

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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Promo konstruktori</h1>
            <p className="text-sm text-slate-500">Yangi promo aktsiyani yarating va target auditoriyaga jo'nating</p>
          </div>
          <Button variant="outline" className="gap-2"><Eye className="w-4 h-4" /> Ko'rib chiqish</Button>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash va boshlash</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-600" /> 1. Promo nomi va davri</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Promo nomi</label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="text-base" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Boshlanish</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Tugash</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Davomiyligi: {dayCount} kun
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-rose-600" /> 2. Chegirma turi</h2>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(["%", "fix", "1+1"] as const).map(t => (
                  <button key={t} onClick={() => setDiscountType(t)} className={`p-3 rounded-lg border-2 font-semibold text-sm transition-all ${discountType === t ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200"}`}>
                    {t === "%" ? "% chegirma" : t === "fix" ? "Fix summa" : "1+1 (BOGOF)"}
                  </button>
                ))}
              </div>
              {discountType !== "1+1" && (
                <div>
                  <label className="text-sm font-medium block mb-1">{discountType === "%" ? "Chegirma %" : "Chegirma summa (so'm)"}</label>
                  <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="text-2xl font-bold font-mono" />
                </div>
              )}
              {discountType === "1+1" && (
                <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
                  💡 Klient 1 ta tovar sotib olganda — 2-tasini bepul oladi (50% effective discount).
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> 3. Tovarlar ({selectedProducts.size}/5)</h2>
              <div className="space-y-2">
                {PRODUCTS.map(p => (
                  <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedProducts.has(p.id) ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                    <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{fmt(p.price)} so'm</div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" /> 4. Target auditoriya</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Klient segmenti</label>
                  <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Hudud</label>
                  <select value={territoryFilter} onChange={e => setTerritoryFilter(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    {TERRITORIES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Min. zakaz summasi</label>
                  <Input type="number" value={minOrderSum} onChange={e => setMinOrderSum(Number(e.target.value))} />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
              <h2 className="text-lg font-bold mb-4">📋 Promo ko'rinishi</h2>
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <div className="text-xs text-emerald-600 font-bold mb-1">{startDate} — {endDate}</div>
                <h3 className="text-2xl font-bold mb-3">{name}</h3>

                <div className="space-y-2 mb-4">
                  {selectedProductsArr.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="font-mono text-slate-500 line-through">{fmt(p.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-slate-300 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Eski narx</span>
                    <span className="font-mono line-through text-slate-500">{fmt(totalRegularPrice)} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-rose-700">Sizning iqtisodingiz</span>
                    <span className="font-mono text-rose-700">−{fmt(savings)} so'm</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                    <span className="text-emerald-700">YANGI NARX</span>
                    <span className="font-mono text-emerald-700">{fmt(promoPrice)} so'm</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-emerald-100 p-2 rounded text-center">
                    <div className="text-emerald-700 font-bold">Davr</div>
                    <div className="font-mono">{dayCount} kun</div>
                  </div>
                  <div className="bg-blue-100 p-2 rounded text-center">
                    <div className="text-blue-700 font-bold">Min. zakaz</div>
                    <div className="font-mono">{fmt(minOrderSum / 1000)}k</div>
                  </div>
                  <div className="bg-violet-100 p-2 rounded text-center">
                    <div className="text-violet-700 font-bold">Auditoriya</div>
                    <div className="font-mono text-[10px]">{clientFilter}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
