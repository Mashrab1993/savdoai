"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Save, X, Plus, Search, User, Trash2, Package } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function OrderCreatePage() {
  const [client, setClient] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [discount, setDiscount] = useState(0)
  const [comment, setComment] = useState("")

  const total = items.reduce((s, i) => s + i.qty * i.price, 0)
  const final = total * (1 - discount / 100)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            Yangi buyurtma
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Mijoz uchun yangi buyurtma yaratish</p>
        </div>

        {/* Client */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> Mijoz tanlash
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Mijoz qidirish (ism, telefon, kod)" value={client} onChange={e => setClient(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Package className="w-4 h-4" /> Tovarlar ({items.length})
            </h2>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-3 h-3 mr-1" /> Tovar qo'shish
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Tovar qo'shilmagan
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.nomi}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.qty}</div>
                  </div>
                  <div className="font-mono font-bold">{formatCurrency(item.qty * item.price)}</div>
                  <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Jami:</span>
            <span className="font-mono">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span>Chegirma %:</span>
            <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 text-right" />
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>To'lash kerak:</span>
            <span className="text-emerald-700">{formatCurrency(final)}</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Izoh</label>
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Buyurtma haqida..." rows={2} />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1"><X className="w-4 h-4 mr-1" /> Bekor</Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Save className="w-4 h-4 mr-1" /> Buyurtma saqlash</Button>
        </div>
      </div>
    </AdminLayout>
  )
}
