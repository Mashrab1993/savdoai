"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, DollarSign, Pencil, Trash2, X, RefreshCw } from "lucide-react"
import Link from "next/link"

type Currency = {
  id: number; code: string; symbol: string; name: string;
  rate: number; default: boolean; active: boolean;
  lastUpdated: string;
}

const INITIAL: Currency[] = [
  { id: 1, code: "UZS", symbol: "so'm", name: "O'zbek so'mi", rate: 1, default: true, active: true, lastUpdated: "2026-05-02 09:00" },
  { id: 2, code: "USD", symbol: "$", name: "AQSh dollari", rate: 12_640, default: false, active: true, lastUpdated: "2026-05-02 09:00" },
  { id: 3, code: "EUR", symbol: "€", name: "Yevro", rate: 13_840, default: false, active: true, lastUpdated: "2026-05-02 09:00" },
  { id: 4, code: "RUB", symbol: "₽", name: "Rossiya rubli", rate: 142, default: false, active: true, lastUpdated: "2026-05-02 09:00" },
  { id: 5, code: "KZT", symbol: "₸", name: "Qozog'iston tengesi", rate: 28, default: false, active: true, lastUpdated: "2026-05-02 09:00" },
  { id: 6, code: "TRY", symbol: "₺", name: "Turk lirasi", rate: 380, default: false, active: false, lastUpdated: "2026-04-15 09:00" },
  { id: 7, code: "CNY", symbol: "¥", name: "Xitoy yuani", rate: 1_740, default: false, active: false, lastUpdated: "2026-04-15 09:00" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function CurrencyPage() {
  const [currs, setCurrs] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<Currency> | null>(null)

  const openAdd = () => setEditing({ id: 0, code: "", symbol: "", name: "", rate: 1, default: false, active: true, lastUpdated: new Date().toISOString().slice(0, 16).replace("T", " ") })
  const openEdit = (c: Currency) => setEditing({ ...c })

  const save = () => {
    if (!editing) return
    if (!editing.id) setCurrs([...currs, { ...editing as Currency, id: Math.max(0, ...currs.map(c => c.id)) + 1 }])
    else setCurrs(currs.map(c => c.id === editing.id ? editing as Currency : c))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-600" />
              Valyutalar
            </h1>
            <p className="text-sm text-slate-500">{currs.filter(c => c.active).length} ta faol valyuta · default: <span className="font-bold">UZS</span></p>
          </div>
          <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> CBU dan yangilash</Button>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi valyuta</Button>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">ID</th>
                  <th className="border border-slate-300 py-2 px-3 w-20 text-center">Code</th>
                  <th className="border border-slate-300 py-2 px-3 w-20 text-center">Belgi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Nom</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Kursi (UZS)</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Yangilangan</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-20">Default</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Status</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {currs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{c.id}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-base font-mono font-bold text-emerald-700">{c.code}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-2xl">{c.symbol}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{c.name}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold text-blue-700">
                      {c.rate === 1 ? "1.00" : fmt(c.rate)}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono text-xs text-slate-500">{c.lastUpdated}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      {c.default && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⭐ Default</span>}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      {c.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                                : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">○ Off</span>}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <button onClick={() => openEdit(c)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Pencil className="w-4 h-4" /></button>
                      <button className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">💱 Valyuta konversiyasi qanday ishlaydi?</h3>
          <p className="text-sm text-slate-700">
            Default valyuta (UZS) sotuvlarda asosiy hisoblanadi. Boshqa valyutadagi narxlar avtomatik UZSga aylantiriladi.
            Kurs CBU.uz dan har kuni soat 09:00 da yangilanadi (avtomatik). Manual yangilash uchun "CBU dan yangilash" tugmasini bosing.
          </p>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Valyuta #${editing.id}` : "Yangi valyuta"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Code (ISO) *</label>
                    <Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="USD" maxLength={3} className="font-mono uppercase" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Belgi</label>
                    <Input value={editing.symbol} onChange={e => setEditing({ ...editing, symbol: e.target.value })} placeholder="$" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Nom</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="AQSh dollari" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Kursi (UZSga nisbatan)</label>
                  <Input type="number" value={editing.rate} onChange={e => setEditing({ ...editing, rate: Number(e.target.value) })} className="font-mono" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="default" checked={editing.default} onChange={e => setEditing({ ...editing, default: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="default" className="text-sm cursor-pointer">Default valyuta</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Aktiv</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Bekor</Button>
                <Button onClick={save}>{editing.id ? "Saqlash" : "Yaratish"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
