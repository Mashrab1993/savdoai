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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Tovar <span className="italic text-[#C75D3C]">agent limitlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Распределения товара по агентам · {LIMITS.length} ta agent</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Info className="w-4 h-4" /> Текущий статус лимита</Button>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <button className="px-3 py-1.5 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D]">По 50</button>
              <button className="px-3 py-1.5 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D]">Показ./Скр. столбцы</button>
              <span className="ml-auto text-xs text-[#9C8A6E] uppercase tracking-wider">Быстрый поиск:</span>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48 border-[#E8E0D3]" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-center w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">
                      <input type="checkbox" />
                    </th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Продукты по категориями</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Количество</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Тип</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Изменить</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center">
                        <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                      </td>
                      <td className="py-3 px-2 font-medium">
                        <Link href={`/komanda/${l.id}`} className="text-[#C75D3C] hover:underline">{l.agent}</Link>
                      </td>
                      <td className={`py-3 px-2 ${l.products === "не определен" ? "text-[#9C8A6E] italic" : "text-[#1A1A1A]"}`}>{l.products}</td>
                      <td className={`py-3 px-2 ${l.count === "-" ? "text-[#9C8A6E]" : "font-medium font-mono tabular-nums text-[#1A1A1A]"}`}>{l.count}</td>
                      <td className="py-3 px-2">{l.type === "—" ? <span className="text-[#9C8A6E]">—</span> : <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{l.type}</span>}</td>
                      <td className="py-3 px-2">
                        <Button size="sm" onClick={() => toast.info(`${l.agent} uchun ограничение`)} className="gap-1 text-white" style={{ background: "#C75D3C" }}>
                          <Plus className="w-3 h-3" /> Создать ограничения
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#9C8A6E]">
              <span className="font-mono tabular-nums">1 - 6 / 6</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 border border-[#E8E0D3] rounded text-[#6B5B4D]">Пред.</button>
                <button className="px-2 py-1 text-white rounded" style={{ background: "#C75D3C" }}>1</button>
                <button className="px-2 py-1 border border-[#E8E0D3] rounded text-[#6B5B4D]">След.</button>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <Button onClick={() => toast.success(`${selected.size} agentga ограничение yaratildi`)} disabled={selected.size === 0} className="gap-2 text-white" style={{ background: "#C75D3C" }}>
                <Edit2 className="w-4 h-4" /> Создать / изменить ограничения
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
