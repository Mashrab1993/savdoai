"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Edit2, Search, Info } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const LIMITS = [
  { id: 1, agent: "Babadjanova Nargiza", products: "не определен", count: "-", type: "—" },
  { id: 2, agent: "Berdiyev Rahmatillo", products: "не определен", count: "-", type: "—" },
  { id: 3, agent: "BORIEV MIRJALOL", products: "не определен", count: "-", type: "—" },
  { id: 4, agent: "Sayitqulov Mashrab.", products: "Бренд Bonjur (12 SKU)", count: "240 dona/oy", type: "Limit" },
  { id: 5, agent: "ДАВЛАТ.", products: "не определен", count: "-", type: "—" },
  { id: 6, agent: "Турсунов Жамшед.", products: "не определен", count: "-", type: "—" },
]

export default function AgentLimitPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const filtered = LIMITS.filter(l => !search || l.agent.toLowerCase().includes(search.toLowerCase()))

  const toggle = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Распределения товара по агентам</h1>
          <Button variant="outline" className="gap-2"><Info className="w-4 h-4" /> Текущий статус лимита</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">По 5 0</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Показ./Скр. столбцы</button>
            <span className="ml-auto text-xs text-slate-500">Быстрый поиск:</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200">
                <th className="border border-slate-300 py-2 px-2 w-12">
                  <input type="checkbox" />
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left font-bold">Агент</th>
                <th className="border border-slate-300 py-2 px-2 text-left font-bold">Продукты по категориями</th>
                <th className="border border-slate-300 py-2 px-2 text-left font-bold">Количество</th>
                <th className="border border-slate-300 py-2 px-2 text-left font-bold">Тип</th>
                <th className="border border-slate-300 py-2 px-2 text-left font-bold">Изменить</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 py-2 px-2 text-center">
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                  </td>
                  <td className="border border-slate-300 py-2 px-2 font-semibold">
                    <Link href={`/komanda/${l.id}`} className="text-emerald-700 hover:underline">{l.agent}</Link>
                  </td>
                  <td className={`border border-slate-300 py-2 px-2 ${l.products === "не определен" ? "text-slate-400 italic" : "text-slate-700"}`}>{l.products}</td>
                  <td className={`border border-slate-300 py-2 px-2 ${l.count === "-" ? "text-slate-400" : "font-bold"}`}>{l.count}</td>
                  <td className="border border-slate-300 py-2 px-2">{l.type === "—" ? "—" : <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{l.type}</span>}</td>
                  <td className="border border-slate-300 py-2 px-2">
                    <Button size="sm" onClick={() => toast.info(`${l.agent} uchun ограничение`)} className="gap-1 bg-emerald-600">
                      <Plus className="w-3 h-3" /> Создать ограничения
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - 6 / 6</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-300 rounded">Пред.</button>
              <button className="px-2 py-1 bg-emerald-600 text-white rounded">1</button>
              <button className="px-2 py-1 border border-slate-300 rounded">След.</button>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={() => toast.success(`${selected.size} agentga ограничение yaratildi`)} disabled={selected.size === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Edit2 className="w-4 h-4" /> Создать / изменить ограничения
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
