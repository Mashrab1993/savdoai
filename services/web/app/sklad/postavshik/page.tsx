"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Download, MoreHorizontal } from "lucide-react"
import Link from "next/link"

type Postavshik = {
  id: number; name: string; phone: string; address: string; type: string; token: string; active: boolean;
}

const POSTAVSHIKLAR: Postavshik[] = [
  { id: 1, name: "Cosmo World", phone: "+998 90 123 45 67", address: "г. Ташкент", type: "OOO", token: "—", active: true },
  { id: 2, name: "Утёнок", phone: "+998 90 234 56 78", address: "г. Ташкент", type: "MChJ", token: "—", active: true },
  { id: 3, name: "GOLD-KEKS", phone: "+998 71 345 67 89", address: "г. Самарканд", type: "OOO", token: "✓", active: true },
  { id: 4, name: "Толиб Халва", phone: "+998 90 456 78 90", address: "г. Самарканд", type: "YaT", token: "—", active: true },
  { id: 5, name: "Сладкая Слобода", phone: "+998 71 567 89 01", address: "г. Ташкент", type: "OOO", token: "✓", active: true },
  { id: 6, name: "CANDY BAR", phone: "+998 90 678 90 12", address: "г. Ташкент", type: "OOO", token: "—", active: true },
  { id: 7, name: "СИББАЛТ", phone: "+998 90 789 01 23", address: "г. Ташкент", type: "MChJ", token: "—", active: true },
  { id: 8, name: "Hi baby", phone: "+998 71 890 12 34", address: "г. Ташкент", type: "OOO", token: "✓", active: true },
  { id: 9, name: "Персил Ирон Сфад Охалик", phone: "+998 90 901 23 45", address: "г. Самарканд", type: "OOO", token: "—", active: true },
  { id: 10, name: "Насриддин Ака", phone: "+998 90 012 34 56", address: "г. Самарканд", type: "YaT", token: "—", active: true },
  { id: 11, name: "Bizziki Murodillo", phone: "+998 90 111 22 33", address: "г. Ташкент", type: "MChJ", token: "—", active: true },
  { id: 12, name: "MUHAMMADJON SHOXRUZBEK FAYZ", phone: "+998 71 222 33 44", address: "Сирдарья", type: "OOO", token: "✓", active: true },
  { id: 13, name: "BAFFY", phone: "+998 90 333 44 55", address: "г. Ташкент", type: "OOO", token: "—", active: true },
  { id: 14, name: "Карамель", phone: "+998 90 444 55 66", address: "г. Ташкент", type: "MChJ", token: "—", active: true },
  { id: 15, name: "Конфеты Туркия", phone: "+998 71 555 66 77", address: "г. Ташкент", type: "OOO", token: "✓", active: true },
  { id: 16, name: "Асал", phone: "+998 90 666 77 88", address: "г. Самарканд", type: "YaT", token: "—", active: true },
  { id: 17, name: "Прима оранжевый", phone: "+998 90 777 88 99", address: "г. Ташкент", type: "OOO", token: "—", active: true },
  { id: 18, name: "PENDA", phone: "+998 71 888 99 00", address: "г. Ташкент", type: "MChJ", token: "✓", active: true },
  { id: 19, name: "EMERALD CANDY", phone: "+998 90 999 00 11", address: "г. Ташкент", type: "OOO", token: "—", active: true },
  { id: 20, name: "Косметика", phone: "+998 90 000 11 22", address: "г. Ташкент", type: "MChJ", token: "—", active: true },
]

export default function PostavshikListPage() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"active" | "inactive">("active")

  const filtered = POSTAVSHIKLAR
    .filter(p => p.active === (tab === "active"))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Поставщики
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{POSTAVSHIKLAR.filter(p => p.active).length} ta faol postavshik</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Button className="gap-1" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Добавить</Button>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-5 border-b border-[#E8E0D3]">
              <button onClick={() => setTab("active")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "active" ? "border-[#C75D3C] text-[#C75D3C]" : "border-transparent text-[#9C8A6E] hover:text-[#1A1A1A]"}`}>
                Активные ({POSTAVSHIKLAR.filter(p => p.active).length})
              </button>
              <button onClick={() => setTab("inactive")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "inactive" ? "border-[#C75D3C] text-[#C75D3C]" : "border-transparent text-[#9C8A6E] hover:text-[#1A1A1A]"}`}>
                Неактивные (0)
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button className="px-2 py-1 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D]">По 20</button>
              <button className="px-2 py-1 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D]">Excel</button>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-[#9C8A6E]">Поиск:</span>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поставщик..." className="pl-9 w-64 border-[#E8E0D3] bg-[#FAF7F2]" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Название</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Телефон</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Адрес</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Тип</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Токен</th>
                    <th className="py-3 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center font-mono text-[#9C8A6E]">{i + 1}</td>
                      <td className="py-2 px-2 font-medium text-[#1A1A1A] flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block flex-shrink-0" />
                        {p.name}
                      </td>
                      <td className="py-2 px-2 font-mono text-[#6B5B4D]">{p.phone}</td>
                      <td className="py-2 px-2 text-[#6B5B4D]">{p.address}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D] font-medium">{p.type}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[#1A1A1A]">{p.token}</td>
                      <td className="py-2 px-2 text-center">
                        <button className="text-[#9C8A6E] hover:text-[#C75D3C]"><MoreHorizontal className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#9C8A6E]">
              <span>1 - {filtered.length} / 78</span>
              <div className="flex gap-1">
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">Пред.</button>
                <button className="px-2.5 py-1 bg-[#C75D3C] text-white rounded">1</button>
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">2</button>
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">3</button>
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">4</button>
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">След.</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
