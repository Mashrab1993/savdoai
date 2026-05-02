"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Edit2, Save, AlertCircle, ArrowUp, ArrowDown, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const HISTORY = [
  { id: 1001, date: "2026-05-01", sklad: "Markaziy ombor", count: 8, total_diff: -340_000, user: "Mashrab S.", reason: "Inventarizatsiya farqi" },
  { id: 1002, date: "2026-04-28", sklad: "Sergeli filial", count: 4, total_diff: 1_240_000, user: "Nurmatov A.", reason: "Hisoblashda xato" },
  { id: 1003, date: "2026-04-25", sklad: "Markaziy ombor", count: 12, total_diff: -1_840_000, user: "Mashrab S.", reason: "Brak chiqarish" },
  { id: 1004, date: "2026-04-20", sklad: "Yangiyul filial", count: 3, total_diff: 480_000, user: "Yusupov D.", reason: "Topilgan tovar" },
]

const ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", current: 124, price: 5500 },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", current: 86, price: 11200 },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", current: 248, price: 8400 },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", current: 156, price: 12500 },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", current: 96, price: 6400 },
]

const REASONS = [
  "Inventarizatsiya farqi",
  "Hisoblashda xato",
  "Brak/Yaroqsiz",
  "Topilgan tovar",
  "Boshqa",
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function KorrektirovkaPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [adjustments, setAdjustments] = useState<Record<number, number>>({})
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState("")

  const filtered = ITEMS.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const totalDiff = ITEMS.reduce((s, it) => s + (adjustments[it.id] || 0) * it.price, 0)
  const changesCount = Object.values(adjustments).filter(v => v !== 0).length

  const handleSave = () => {
    if (changesCount === 0) {
      toast.error("Hech qanday o'zgartirish yo'q")
      return
    }
    toast.success(`${changesCount} ta korrektirovka saqlandi (${fmt(totalDiff)} so'm)`)
    setShowForm(false)
    setAdjustments({})
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Korrektirovka (Qoldiq tahrirlash)</h1>
            <p className="text-base text-slate-500 mt-1">Sklad qoldig'ini qo'lda to'g'rilash · Audit log saqlanadi</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Yangi korrektirovka</Button>
          )}
        </div>

        {showForm ? (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Yangi korrektirovka
              </h2>
              <span className="text-sm text-slate-500">{changesCount} ta o'zgartirish · Jami: <span className={`font-bold ${totalDiff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{totalDiff >= 0 ? "+" : ""}{fmt(totalDiff)} so'm</span></span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Sabab *</label>
                <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium">
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Sklad</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium">
                  <option>Markaziy ombor</option>
                  <option>Sergeli filial</option>
                  <option>Yangiyul filial</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Izoh (audit log uchun)</label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Korrektirovka sababi haqida batafsil..." />
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar..." className="pl-9" />
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-left">
                    <th className="py-3 px-2 font-semibold text-slate-600">Tovar</th>
                    <th className="py-3 px-2 font-semibold text-slate-600 text-right">Joriy</th>
                    <th className="py-3 px-2 font-semibold text-slate-600 text-center">+/− miqdor</th>
                    <th className="py-3 px-2 font-semibold text-slate-600 text-right">Yangi qoldiq</th>
                    <th className="py-3 px-2 font-semibold text-slate-600 text-right">Farq summa</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const adj = adjustments[it.id] || 0
                    const newQty = it.current + adj
                    const diffSum = adj * it.price
                    return (
                      <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div className="font-semibold text-slate-900">{it.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{it.code}</div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-700">{it.current}</td>
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            value={adj || ""}
                            onChange={e => setAdjustments({ ...adjustments, [it.id]: Number(e.target.value) || 0 })}
                            placeholder="0"
                            className={`w-24 px-2 py-1 border-2 rounded-md text-center font-mono font-bold focus:outline-none ${adj > 0 ? "border-emerald-400 bg-emerald-50 text-emerald-700" : adj < 0 ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-300"}`}
                          />
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-bold ${adj === 0 ? "text-slate-700" : adj > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {newQty}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-bold ${diffSum === 0 ? "text-slate-400" : diffSum > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {diffSum === 0 ? "—" : (diffSum > 0 ? "+" : "") + fmt(diffSum)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setAdjustments({}) }}>Bekor qilish</Button>
              <Button onClick={handleSave} disabled={changesCount === 0} className="gap-2"><Save className="w-4 h-4" /> Saqlash ({changesCount})</Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <FileText className="w-5 h-5 text-blue-600 mb-2" />
                <div className="text-xs font-bold text-blue-700">Jami korrektirovka</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{HISTORY.length}</div>
              </Card>
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <ArrowUp className="w-5 h-5 text-emerald-600 mb-2" />
                <div className="text-xs font-bold text-emerald-700">Ortish (jami)</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">+{fmt(HISTORY.filter(h => h.total_diff > 0).reduce((s, h) => s + h.total_diff, 0))}</div>
              </Card>
              <Card className="p-4 bg-rose-50 border-rose-200">
                <ArrowDown className="w-5 h-5 text-rose-600 mb-2" />
                <div className="text-xs font-bold text-rose-700">Kamayish (jami)</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{fmt(HISTORY.filter(h => h.total_diff < 0).reduce((s, h) => s + h.total_diff, 0))}</div>
              </Card>
            </div>

            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4">Korrektirovka tarixi</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-left">
                      <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                      <th className="py-3 px-2 font-semibold text-slate-600">Sana</th>
                      <th className="py-3 px-2 font-semibold text-slate-600">Sklad</th>
                      <th className="py-3 px-2 font-semibold text-slate-600">Sabab</th>
                      <th className="py-3 px-2 font-semibold text-slate-600 text-right">Tovar soni</th>
                      <th className="py-3 px-2 font-semibold text-slate-600 text-right">Farq summa</th>
                      <th className="py-3 px-2 font-semibold text-slate-600">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORY.map(h => (
                      <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2 text-slate-400 font-mono">#{h.id}</td>
                        <td className="py-3 px-2 text-slate-700 font-mono text-xs">{h.date}</td>
                        <td className="py-3 px-2 text-slate-700">{h.sklad}</td>
                        <td className="py-3 px-2 text-slate-700">{h.reason}</td>
                        <td className="py-3 px-2 text-right font-mono">{h.count}</td>
                        <td className={`py-3 px-2 text-right font-mono font-bold ${h.total_diff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {h.total_diff >= 0 ? "+" : ""}{fmt(h.total_diff)}
                        </td>
                        <td className="py-3 px-2 text-slate-600 text-xs">{h.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
