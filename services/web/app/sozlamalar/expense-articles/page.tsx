"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

type Article = { id: number; name: string; fund: string; sort: number; active: boolean }
type Fund = { id: number; name: string; sort: number; active: boolean }

const ARTICLES_INIT: Article[] = [
  { id: 1, name: "Аренда офиса", fund: "Операционные расходы", sort: 1, active: true },
  { id: 2, name: "Зарплата агентов", fund: "Операционные расходы", sort: 2, active: true },
  { id: 3, name: "Зарплата экспедиторов", fund: "Операционные расходы", sort: 3, active: true },
  { id: 4, name: "Топливо", fund: "Логистика", sort: 1, active: true },
  { id: 5, name: "Ремонт авто", fund: "Логистика", sort: 2, active: true },
  { id: 6, name: "Маркетинг", fund: "Маркетинг", sort: 1, active: true },
  { id: 7, name: "Налоги", fund: "Финансы", sort: 1, active: true },
  { id: 8, name: "Кредиты", fund: "Финансы", sort: 2, active: false },
]

const FUNDS_INIT: Fund[] = [
  { id: 1, name: "Операционные расходы", sort: 1, active: true },
  { id: 2, name: "Логистика", sort: 2, active: true },
  { id: 3, name: "Маркетинг", sort: 3, active: true },
  { id: 4, name: "Финансы", sort: 4, active: true },
  { id: 5, name: "Прочие", sort: 5, active: false },
]

export default function ExpenseArticlesPage() {
  const [tab, setTab] = useState<"articles" | "funds">("articles")
  const [search, setSearch] = useState("")
  const [articles] = useState(ARTICLES_INIT)
  const [funds] = useState(FUNDS_INIT)

  const filteredArticles = articles.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
  const filteredFunds = funds.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Статьи и фонды расходов/приходов</h1>
            <p className="text-sm text-slate-500">Xarajat va daromad statyalari va fondlari</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> {tab === "articles" ? "Добавить новую статью" : "Добавить фонд"}</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
            <button onClick={() => setTab("articles")} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "articles" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              Статьи ({articles.length})
            </button>
            <button onClick={() => setTab("funds")} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "funds" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              Фонды ({funds.length})
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <select className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option>Активный</option>
              <option>Неактивный</option>
              <option>Все</option>
            </select>
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
                  {tab === "articles" ? (
                    <>
                      <th className="border border-slate-300 py-2 px-3 w-12">#</th>
                      <th className="border border-slate-300 py-2 px-3 text-left">Фонд</th>
                      <th className="border border-slate-300 py-2 px-3 text-left">Статья</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-24">Сортировка</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-24">Активность</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-24">Действия</th>
                    </>
                  ) : (
                    <>
                      <th className="border border-slate-300 py-2 px-3 w-12">#</th>
                      <th className="border border-slate-300 py-2 px-3 text-left">Название фонда</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-24">Сортировка</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-24">Активность</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-24">Действия</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tab === "articles" ? filteredArticles.map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 text-center text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 py-2 px-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{a.fund}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{a.name}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono">{a.sort}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${a.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {a.active ? "✓ Faol" : "○ Off"}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-blue-600 hover:underline"><Pencil className="w-3.5 h-3.5" /></button>
                        <button className="text-rose-600 hover:underline"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : filteredFunds.map((f, i) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 text-center text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{f.name}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono">{f.sort}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${f.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {f.active ? "✓ Faol" : "○ Off"}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-blue-600 hover:underline"><Pencil className="w-3.5 h-3.5" /></button>
                        <button className="text-rose-600 hover:underline"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - {tab === "articles" ? filteredArticles.length : filteredFunds.length} / {tab === "articles" ? articles.length : funds.length}</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-300 rounded">Пред..</button>
              <button className="px-2 py-1 bg-emerald-600 text-white rounded">1</button>
              <button className="px-2 py-1 border border-slate-300 rounded">След..</button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
