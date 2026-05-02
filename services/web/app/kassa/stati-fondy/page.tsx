"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, ChevronUp, ChevronDown, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"

const STATI = [
  { id: 1, fond: "Фонд расходов · Operations", statya: "Аренда офиса", sort: 10, active: true },
  { id: 2, fond: "Фонд расходов · Operations", statya: "Коммунальные платежи", sort: 20, active: true },
  { id: 3, fond: "Фонд зарплаты", statya: "Заработная плата", sort: 30, active: true },
  { id: 4, fond: "Фонд зарплаты", statya: "Премии и бонусы", sort: 40, active: true },
  { id: 5, fond: "Фонд транспорта", statya: "Топливо ГСМ", sort: 50, active: true },
  { id: 6, fond: "Фонд транспорта", statya: "Ремонт автомобилей", sort: 60, active: true },
  { id: 7, fond: "Фонд маркетинга", statya: "Реклама в соцсетях", sort: 70, active: true },
  { id: 8, fond: "Фонд маркетинга", statya: "Печатная реклама", sort: 80, active: false },
  { id: 9, fond: "Прочие", statya: "Канцелярия", sort: 90, active: true },
]

const FONDY = [
  { id: 1, name: "Фонд расходов · Operations", articles: 2, total: 24_500_000, active: true },
  { id: 2, name: "Фонд зарплаты", articles: 2, total: 142_800_000, active: true },
  { id: 3, name: "Фонд транспорта", articles: 2, total: 32_400_000, active: true },
  { id: 4, name: "Фонд маркетинга", articles: 2, total: 4_800_000, active: true },
  { id: 5, name: "Прочие", articles: 1, total: 850_000, active: true },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function StatiFondyPage() {
  const [tab, setTab] = useState<"stati" | "fondy">("stati")
  const [filter, setFilter] = useState("Активный")
  const [search, setSearch] = useState("")

  const filteredStati = STATI.filter(s => {
    const matchActive = filter === "Все" || (filter === "Активный" && s.active) || (filter === "Неактивный" && !s.active)
    const matchSearch = !search || s.statya.toLowerCase().includes(search.toLowerCase()) || s.fond.toLowerCase().includes(search.toLowerCase())
    return matchActive && matchSearch
  })

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Статьи и фонды расходов/приходов</h1>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button onClick={() => setTab("stati")} className={`px-6 py-3 font-semibold text-sm border-b-2 ${tab === "stati" ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-transparent text-slate-600"}`}>
              Статьи
            </button>
            <button onClick={() => setTab("fondy")} className={`px-6 py-3 font-semibold text-sm border-b-2 ${tab === "fondy" ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-transparent text-slate-600"}`}>
              Фонды
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Добавить новую {tab === "stati" ? "статью" : "фонд"}</Button>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option>Активный</option>
                <option>Неактивный</option>
                <option>Все</option>
              </select>
              <button className="px-3 py-1.5 border border-slate-300 rounded-md text-xs">По 2 0</button>
              <button className="px-3 py-1.5 border border-slate-300 rounded-md text-xs">Показ./Скр. столбцы</button>
              <button className="px-3 py-1.5 border border-slate-300 rounded-md text-xs">Excel</button>
              <div className="relative ml-auto max-w-xs">
                <span className="text-sm text-slate-500 mr-2">Поиск:</span>
                <Input value={search} onChange={e => setSearch(e.target.value)} className="inline-flex w-56" />
              </div>
            </div>

            {tab === "stati" && (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="py-3 px-3 text-left font-bold text-slate-700">Фонд <ChevronUp className="w-3 h-3 inline" /></th>
                    <th className="py-3 px-3 text-left font-bold text-slate-700">Статья <ChevronUp className="w-3 h-3 inline" /></th>
                    <th className="py-3 px-3 text-left font-bold text-slate-700">Сортировка <ChevronUp className="w-3 h-3 inline text-blue-600" /></th>
                    <th className="py-3 px-3 text-left font-bold text-slate-700">Активность <ChevronUp className="w-3 h-3 inline" /></th>
                    <th className="py-3 px-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStati.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">В таблице отсутствуют данные</td></tr>
                  ) : filteredStati.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-700">{s.fond}</td>
                      <td className="py-2 px-3">{s.statya}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{s.sort}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.active ? "Активный" : "Неактивный"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-blue-100 rounded"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>
                          <button className="p-1 hover:bg-rose-100 rounded"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "fondy" && (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="py-3 px-3 text-left font-bold text-slate-700">Название фонда</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-700">Статей</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-700">Сумма (oy)</th>
                    <th className="py-3 px-3 text-left font-bold text-slate-700">Активность</th>
                    <th className="py-3 px-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {FONDY.map(f => (
                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{f.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{f.articles}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">−{fmt(f.total)}</td>
                      <td className="py-2 px-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Активный</span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-blue-100 rounded"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>
                          <button className="p-1 hover:bg-rose-100 rounded"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>0 - 0 / 0</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-slate-300 rounded">Пред..</button>
                <button className="px-3 py-1 border border-slate-300 rounded">След..</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
