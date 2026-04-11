"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Banknote, Plus, TrendingUp, TrendingDown, Wallet, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/format"

const CASHBOXES = [
  { id: 1, nomi: "Asosiy kassa", turi: "naqd", balans: 5_500_000, kassir: "Aliyev S." },
  { id: 2, nomi: "Karta kassa", turi: "karta", balans: 12_300_000, kassir: "Aliyev S." },
  { id: 3, nomi: "Bank hisob", turi: "bank", balans: 45_700_000, kassir: "Boshqaruv" },
  { id: 4, nomi: "Click hisobi", turi: "online", balans: 850_000, kassir: "Tizim" },
  { id: 5, nomi: "Payme hisobi", turi: "online", balans: 320_000, kassir: "Tizim" },
]

export default function CashboxesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [boxes] = useState(CASHBOXES)
  const total = boxes.reduce((s, b) => s + b.balans, 0)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7 text-emerald-600" />
              Kassalar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Barcha kassalar va balanslar</p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi kassa
          </Button>
        </div>

        {/* Total balance */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Umumiy balans</div>
          <div className="text-3xl font-bold mt-1">{formatCurrency(total)}</div>
          <div className="flex gap-4 mt-4 text-sm opacity-90">
            <div>Kassalar: {boxes.length}</div>
            <div>Faol: {boxes.length}</div>
          </div>
        </div>

        {/* Cashboxes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map(b => (
            <div key={b.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <Wallet className="w-8 h-8 text-emerald-600" />
                <Badge variant="secondary">{b.turi === "naqd" ? "Naqd" : b.turi === "karta" ? "Karta" : b.turi === "bank" ? "Bank" : "Onlayn"}</Badge>
              </div>
              <div className="font-bold">{b.nomi}</div>
              <div className="text-2xl font-bold mt-1 text-emerald-700">{formatCurrency(b.balans)}</div>
              <div className="text-xs text-muted-foreground mt-1">Kassir: {b.kassir}</div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1"><TrendingUp className="w-3 h-3 mr-1 text-emerald-500" /> Kirim</Button>
                <Button variant="outline" size="sm" className="flex-1"><TrendingDown className="w-3 h-3 mr-1 text-red-500" /> Chiqim</Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2"><Eye className="w-3 h-3 mr-1" /> Tafsilot</Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
