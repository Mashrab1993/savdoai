"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, CreditCard, Banknote, ArrowRightLeft, DollarSign, Edit2, Trash2, ToggleRight, ToggleLeft, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type Method = {
  id: number; name: string; type: string; currency: string; icon: any; color: string; active: boolean; usage: number; sum: number
}

const METHODS_INIT: Method[] = [
  { id: 1, name: "Naqd pul", type: "cash", currency: "UZS", icon: Banknote, color: "emerald", active: true, usage: 1248, sum: 286_400_000 },
  { id: 2, name: "Click", type: "transfer", currency: "UZS", icon: ArrowRightLeft, color: "blue", active: true, usage: 824, sum: 142_800_000 },
  { id: 3, name: "Payme", type: "transfer", currency: "UZS", icon: ArrowRightLeft, color: "violet", active: true, usage: 612, sum: 96_500_000 },
  { id: 4, name: "Bank o'tkazma (UZS)", type: "bank", currency: "UZS", icon: CreditCard, color: "amber", active: true, usage: 156, sum: 412_800_000 },
  { id: 5, name: "Bank o'tkazma (USD)", type: "bank", currency: "USD", icon: DollarSign, color: "lime", active: true, usage: 24, sum: 8_400 },
  { id: 6, name: "Naqd pul (USD)", type: "cash", currency: "USD", icon: Banknote, color: "cyan", active: true, usage: 18, sum: 4_200 },
  { id: 7, name: "Karta orqali (POS)", type: "card", currency: "UZS", icon: CreditCard, color: "rose", active: true, usage: 296, sum: 38_400_000 },
  { id: 8, name: "Webmoney", type: "transfer", currency: "USD", icon: ArrowRightLeft, color: "slate", active: false, usage: 12, sum: 1_200 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function PaymentTypePage() {
  const [methods, setMethods] = useState(METHODS_INIT)
  const [search, setSearch] = useState("")
  const [activeType, setActiveType] = useState<string | null>(null)

  const TYPES = [
    { key: "cash", name: "Naqd", color: "emerald" },
    { key: "transfer", name: "Перевод", color: "blue" },
    { key: "bank", name: "Bank", color: "amber" },
    { key: "card", name: "Karta", color: "rose" },
  ]

  const filtered = methods.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !activeType || m.type === activeType
    return matchSearch && matchType
  })

  const toggle = (id: number) => {
    setMethods(methods.map(m => m.id === id ? { ...m, active: !m.active } : m))
    toast.success("Yangilandi")
  }

  const totalSumUZS = methods.filter(m => m.currency === "UZS").reduce((s, m) => s + m.sum, 0)
  const totalSumUSD = methods.filter(m => m.currency === "USD").reduce((s, m) => s + m.sum, 0)
  const totalUsage = methods.reduce((s, m) => s + m.usage, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">To'lov usullari</h1>
            <p className="text-base text-slate-500 mt-1">{methods.length} ta metod · {methods.filter(m => m.active).length} faol · {totalUsage} marta ishlatilgan</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi metod</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Banknote className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami UZS</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalSumUZS)} so'm</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-lime-50 to-lime-100/50 border-lime-300 border-2">
            <DollarSign className="w-7 h-7 text-lime-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-lime-700">Jami USD</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalSumUSD)} $</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <CreditCard className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Operatsiyalar</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalUsage)}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Metod..." className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setActiveType(null)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${!activeType ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                Hammasi
              </button>
              {TYPES.map(t => (
                <button key={t.key} onClick={() => setActiveType(t.key)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeType === t.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {t.name}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(m => {
              const Icon = m.icon
              return (
                <Card key={m.id} className={`p-4 border-2 transition-all hover:shadow-md group bg-${m.color}-50 border-${m.color}-200 ${!m.active ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${m.color}-200 text-${m.color}-700 flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900">{m.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold bg-${m.color}-100 text-${m.color}-700`}>{m.currency}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{m.usage} marta · {fmt(m.sum)} {m.currency}</div>
                    </div>
                    <button onClick={() => toggle(m.id)}>
                      {m.active ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                  </div>
                  <div className="mt-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toast.info(`${m.name} tahrirlanmoqda`)} className="p-1.5 hover:bg-blue-100 rounded">
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button onClick={() => toast.error(`${m.name} o'chirildi`)} className="p-1.5 hover:bg-rose-100 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
