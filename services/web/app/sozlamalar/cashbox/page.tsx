"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Pencil, Search, Wallet, X } from "lucide-react"
import Link from "next/link"

type Cashbox = { id: number; name: string; cashier: string; code: string; sort: number; active: boolean }

const CASHBOXES_INIT: Cashbox[] = [
  { id: 1, name: "Основная касса", cashier: "Все пользователи", code: "001", sort: 500, active: true },
  { id: 2, name: "Sergeli ombor kassa", cashier: "Aminov R.", code: "002", sort: 510, active: true },
  { id: 3, name: "Yashnobod ombor kassa", cashier: "Karimov F.", code: "003", sort: 520, active: true },
  { id: 4, name: "Kichik kassa (avans)", cashier: "Toxirov M.", code: "004", sort: 530, active: false },
]

export default function CashboxPage() {
  const [cashboxes, setCashboxes] = useState(CASHBOXES_INIT)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Cashbox | null>(null)

  const filtered = cashboxes.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const openEdit = (c: Cashbox) => setEditing({ ...c })
  const openNew = () => setEditing({ id: 0, name: "", cashier: "Все пользователи", code: "", sort: 500, active: true })
  const closeModal = () => setEditing(null)

  const save = () => {
    if (!editing) return
    if (editing.id === 0) {
      setCashboxes([...cashboxes, { ...editing, id: Math.max(0, ...cashboxes.map(c => c.id)) + 1 }])
    } else {
      setCashboxes(cashboxes.map(c => c.id === editing.id ? editing : c))
    }
    closeModal()
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Кассы</h1>
            <p className="text-sm text-slate-500">{cashboxes.filter(c => c.active).length} ta faol kassa · {cashboxes.length} jami</p>
          </div>
          <Button onClick={openNew} className="gap-1"><Plus className="w-4 h-4" /> Добавить кассу</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">По 20</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Показ./Скр. столбцы</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Excel</button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">Поиск:</span>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 w-20">Касса ID</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Касса</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Кассир</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Код кассы</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Сортировка</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Активность</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono text-slate-400">{c.id}</td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      {c.name}
                    </td>
                    <td className="border border-slate-300 py-2 px-3">{c.cashier}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono">{c.code}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono">{c.sort}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {c.active ? "✓ Faol" : "○ Off"}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="h-7 text-xs gap-1">
                        <Pencil className="w-3 h-3" /> Изменить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - {filtered.length} / {filtered.length}</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-300 rounded">Пред..</button>
              <button className="px-2 py-1 bg-emerald-600 text-white rounded">1</button>
              <button className="px-2 py-1 border border-slate-300 rounded">След..</button>
            </div>
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Касса {editing.id === 0 ? "(новая)" : `#${editing.id}`}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Название</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Основная касса" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Активность</label>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Кассир</label>
                  <select value={editing.cashier} onChange={e => setEditing({ ...editing, cashier: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>Все пользователи</option>
                    <option>Aminov R.</option>
                    <option>Karimov F.</option>
                    <option>Toxirov M.</option>
                    <option>Sobirov G.</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Код кассы</label>
                  <Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="001" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Сортировка</label>
                  <Input type="number" value={editing.sort} onChange={e => setEditing({ ...editing, sort: Number(e.target.value) })} />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <Button variant="outline" onClick={closeModal}>Bekor</Button>
                  <Button onClick={save}>{editing.id === 0 ? "Saqlash" : "Изменить"}</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
