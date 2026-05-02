"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Pencil, Trash2, X, ArrowRight, Scale } from "lucide-react"
import Link from "next/link"

type Conversion = {
  id: number;
  fromUnit: string; fromQty: number;
  toUnit: string; toQty: number;
  product: string;
  active: boolean;
}

const INITIAL: Conversion[] = [
  { id: 1, fromUnit: "Karton", fromQty: 1, toUnit: "Dona", toQty: 24, product: "Choco-Boom 75g", active: true },
  { id: 2, fromUnit: "Karton", fromQty: 1, toUnit: "Dona", toQty: 6, product: "Coca-Cola 1.5L", active: true },
  { id: 3, fromUnit: "Karton", fromQty: 1, toUnit: "Dona", toQty: 24, product: "Bonjur 50g", active: true },
  { id: 4, fromUnit: "Karton", fromQty: 1, toUnit: "Dona", toQty: 12, product: "Pechenye Yubileynoye", active: true },
  { id: 5, fromUnit: "Paket", fromQty: 1, toUnit: "Dona", toQty: 50, product: "GUM 5g", active: true },
  { id: 6, fromUnit: "Paket", fromQty: 1, toUnit: "Dona", toQty: 100, product: "Konfet 1g", active: true },
  { id: 7, fromUnit: "Karton", fromQty: 1, toUnit: "Karton (small)", toQty: 4, product: "Universal", active: true },
  { id: 8, fromUnit: "Tonna", fromQty: 1, toUnit: "Kg", toQty: 1000, product: "Universal", active: true },
  { id: 9, fromUnit: "Kg", fromQty: 1, toUnit: "Gramm", toQty: 1000, product: "Universal", active: true },
  { id: 10, fromUnit: "Litr", fromQty: 1, toUnit: "Millilitr", toQty: 1000, product: "Universal", active: true },
]

export default function UnitConversionPage() {
  const [convs, setConvs] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<Conversion> | null>(null)

  const openAdd = () => setEditing({ id: 0, fromUnit: "Karton", fromQty: 1, toUnit: "Dona", toQty: 1, product: "", active: true })
  const openEdit = (c: Conversion) => setEditing({ ...c })

  const save = () => {
    if (!editing) return
    if (!editing.id) setConvs([...convs, { ...editing as Conversion, id: Math.max(0, ...convs.map(c => c.id)) + 1 }])
    else setConvs(convs.map(c => c.id === editing.id ? editing as Conversion : c))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="w-7 h-7 text-emerald-600" />
              O'lchov birliklari konversiyasi
            </h1>
            <p className="text-sm text-slate-500">{convs.filter(c => c.active).length} ta konversiya · Karton ↔ Dona, Tonna ↔ Kg va h.k.</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi konversiya</Button>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Scale className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800">Birlik konversiyasi nima uchun kerak?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Klient 5 dona Choco-Boom so'rasa, ombor "Karton" da hisoblansa — tizim avtomatik 5/24 = 0.21 karton deb hisoblaydi.
                Multi-unit pricing (dona / blok / karobka) uchun ham asos bo'lib xizmat qiladi.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Tovar</th>
                  <th className="border border-slate-300 py-2 px-3 text-right w-24">Boshlang'ich</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-32">Birlik</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-12"></th>
                  <th className="border border-slate-300 py-2 px-3 text-right w-24">Natija</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-32">Birlik</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Status</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {convs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{c.id}</td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{c.product}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold">{c.fromQty}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{c.fromUnit}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <ArrowRight className="w-4 h-4 text-slate-400 mx-auto" />
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold text-emerald-700">{c.toQty}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{c.toUnit}</span>
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

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Konversiya #${editing.id}` : "Yangi konversiya"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Tovar (yoki "Universal")</label>
                  <Input value={editing.product} onChange={e => setEditing({ ...editing, product: e.target.value })} placeholder="Choco-Boom 75g yoki Universal" />
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium block mb-1">Boshlang'ich miqdor</label>
                    <Input type="number" value={editing.fromQty} onChange={e => setEditing({ ...editing, fromQty: Number(e.target.value) })} className="font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Boshlang'ich birlik</label>
                    <select value={editing.fromUnit} onChange={e => setEditing({ ...editing, fromUnit: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      <option>Karton</option>
                      <option>Paket</option>
                      <option>Tonna</option>
                      <option>Kg</option>
                      <option>Litr</option>
                    </select>
                  </div>
                </div>

                <div className="text-center text-2xl text-slate-400">↓</div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium block mb-1">Natija miqdor *</label>
                    <Input type="number" value={editing.toQty} onChange={e => setEditing({ ...editing, toQty: Number(e.target.value) })} className="font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Natija birlik *</label>
                    <select value={editing.toUnit} onChange={e => setEditing({ ...editing, toUnit: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      <option>Dona</option>
                      <option>Karton (small)</option>
                      <option>Kg</option>
                      <option>Gramm</option>
                      <option>Millilitr</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Aktiv</label>
                </div>

                {editing.fromQty && editing.toQty && (
                  <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
                    💡 1 ta {editing.fromUnit} = <span className="font-bold font-mono">{editing.toQty / editing.fromQty}</span> ta {editing.toUnit}
                  </div>
                )}
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
