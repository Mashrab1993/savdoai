"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Plus, Pencil, Trash2, Banknote, Smartphone, Building2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const DEFAULT_METHODS = [
  { id: 1, nomi: "Naqd pul", kod: "CASH", turi: "naqd", icon: Banknote, faol: true },
  { id: 2, nomi: "Plastik karta (UzCard)", kod: "UZCARD", turi: "karta", icon: CreditCard, faol: true },
  { id: 3, nomi: "Plastik karta (Humo)", kod: "HUMO", turi: "karta", icon: CreditCard, faol: true },
  { id: 4, nomi: "Pul o'tkazma (bank)", kod: "BANK", turi: "otkazma", icon: Building2, faol: true },
  { id: 5, nomi: "Click", kod: "CLICK", turi: "elektron", icon: Smartphone, faol: true },
  { id: 6, nomi: "Payme", kod: "PAYME", turi: "elektron", icon: Smartphone, faol: true },
  { id: 7, nomi: "Qarz", kod: "DEBT", turi: "qarz", icon: Banknote, faol: true },
]

export default function PaymentMethodsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [methods] = useState(DEFAULT_METHODS)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-7 h-7 text-emerald-600" /> To'lov usullari</h1>
            <p className="text-sm text-muted-foreground mt-1">Naqd, karta, o'tkazma, elektron to'lovlar</p></div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {methods.map(m => (
            <div key={m.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <m.icon className="w-8 h-8 text-emerald-600" />
                <Badge className={m.faol ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-muted text-muted-foreground"}>{m.faol ? "Faol" : "Nofaol"}</Badge>
              </div>
              <div className="font-bold">{m.nomi}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{m.kod}</div>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" className="flex-1"><Pencil className="w-3 h-3 mr-1" /> Tahrirlash</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
