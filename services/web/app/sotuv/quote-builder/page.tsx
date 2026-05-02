"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Trash2, Send, FileText, Save, Calculator, Sparkles } from "lucide-react"
import Link from "next/link"

type QuoteItem = {
  id: number; product: string; price: number; qty: number; discount: number;
}

const PRODUCT_OPTIONS = [
  { name: "Choco-Boom 75g", price: 12_000 },
  { name: "Coca-Cola 1.5L", price: 18_000 },
  { name: "Bonjur 50g", price: 6_000 },
  { name: "Sok Apelsin 1L", price: 14_000 },
  { name: "Pechenye Yubileynoye", price: 8_400 },
  { name: "Voda Premium 1L", price: 4_500 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function QuoteBuilderPage() {
  const [client, setClient] = useState("Salom Magazin №1")
  const [validTill, setValidTill] = useState("2026-05-15")
  const [notes, setNotes] = useState("Birinchi to'lov 50% oldindan, qolgan 50% — yetkazib berishdan keyin 7 kun ichida.")
  const [items, setItems] = useState<QuoteItem[]>([
    { id: 1, product: "Choco-Boom 75g", price: 12_000, qty: 100, discount: 5 },
    { id: 2, product: "Coca-Cola 1.5L", price: 18_000, qty: 50, discount: 10 },
    { id: 3, product: "Bonjur 50g", price: 6_000, qty: 200, discount: 0 },
  ])

  const addItem = () => {
    setItems([...items, { id: Date.now(), product: PRODUCT_OPTIONS[0].name, price: PRODUCT_OPTIONS[0].price, qty: 1, discount: 0 }])
  }
  const removeItem = (id: number) => setItems(items.filter(i => i.id !== id))
  const updateItem = (id: number, field: keyof QuoteItem, value: number | string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const totalDiscount = items.reduce((s, i) => s + (i.price * i.qty * i.discount / 100), 0)
  const tax = (subtotal - totalDiscount) * 0.12
  const total = subtotal - totalDiscount + tax

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Taklif (KP) konstruktori</h1>
            <p className="text-sm text-slate-500">Klientga rasmiy narx-takliflarini yaratish</p>
          </div>
          <Button variant="outline" className="gap-2"><Save className="w-4 h-4" /> Qoralama saqla</Button>
          <Button variant="outline" className="gap-2"><FileText className="w-4 h-4" /> PDF</Button>
          <Button className="gap-2"><Send className="w-4 h-4" /> Klientga yuborish</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4">Asosiy ma'lumotlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Klient</label>
                  <select value={client} onChange={e => setClient(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>Salom Magazin №1</option>
                    <option>Bona Магазин</option>
                    <option>Дастархон Сервис</option>
                    <option>Гулямов Маркет</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">KP raqami</label>
                  <Input value="KP-2026-0042" readOnly className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Yaratilgan</label>
                  <Input value="2026-05-02" readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Amal qilish muddati</label>
                  <Input type="date" value={validTill} onChange={e => setValidTill(e.target.value)} />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Tovarlar ro'yxati</h2>
                <Button size="sm" onClick={addItem} className="gap-1"><Plus className="w-4 h-4" /> Qo'shish</Button>
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const lineTotal = item.price * item.qty * (1 - item.discount / 100)
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded">
                      <select value={item.product} onChange={e => {
                        const opt = PRODUCT_OPTIONS.find(p => p.name === e.target.value)
                        updateItem(item.id, "product", e.target.value)
                        if (opt) updateItem(item.id, "price", opt.price)
                      }} className="col-span-4 border border-slate-300 rounded px-2 py-1.5 text-sm">
                        {PRODUCT_OPTIONS.map(p => <option key={p.name}>{p.name}</option>)}
                      </select>
                      <Input type="number" value={item.price} onChange={e => updateItem(item.id, "price", Number(e.target.value))} className="col-span-2 h-8 text-sm font-mono" />
                      <Input type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} className="col-span-2 h-8 text-sm font-mono" />
                      <div className="col-span-2 flex items-center gap-1">
                        <Input type="number" value={item.discount} onChange={e => updateItem(item.id, "discount", Number(e.target.value))} className="h-8 text-sm font-mono" />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <span className="col-span-1 text-right text-sm font-mono font-bold text-emerald-700">{fmt(lineTotal / 1000)}k</span>
                      <button onClick={() => removeItem(item.id)} className="col-span-1 text-rose-600 hover:bg-rose-50 rounded p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-12 gap-2 mt-2 pt-2 border-t text-xs text-slate-500">
                <span className="col-span-4">Tovar</span>
                <span className="col-span-2">Narx</span>
                <span className="col-span-2">Miqdor</span>
                <span className="col-span-2">Chegirma</span>
                <span className="col-span-1 text-right">Jami</span>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold mb-3">Izohlar va shartlar</h2>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="To'lov shartlari, yetkazib berish muddati, va h.k."
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 sticky top-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-600" /> Hisoblash</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-rose-600">Chegirma</span>
                  <span className="font-mono text-rose-700">−{fmt(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">QQS (12%)</span>
                  <span className="font-mono">+{fmt(Math.round(tax))}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>JAMI</span>
                  <span className="font-mono text-emerald-700">{fmt(Math.round(total))}</span>
                </div>
                <div className="text-xs text-slate-500 text-center pt-2">{items.length} pozitsiya</div>
              </div>
            </Card>

            <Card className="p-5 bg-violet-50 border-violet-200">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-violet-800 text-sm mb-1">AI tavsiya</h3>
                  <p className="text-xs text-slate-700">
                    Bu klient uchun chegirmа 12-15% optimal. Joriy {Math.round(totalDiscount / subtotal * 100)}% — yana {Math.max(0, 12 - Math.round(totalDiscount / subtotal * 100))}% qo'shish mumkin (konversiya 78%).
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
