"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, RefreshCw, Filter as FilterIcon, Download } from "lucide-react"
import Link from "next/link"

const CLIENTS = [
  { id: 1, code: "0_1", name: "ХАСА", company: "Akva", agent: "Bulungor", region: "Cp", balance: 0, ytd: 0, sum: 0 },
  { id: 2, code: "0_2", name: "Десфия Аноистикон", company: "Каняфабои", agent: "Buloqzor", region: "Cp", balance: 0, ytd: 0, sum: 0 },
  { id: 3, code: "0_3", name: "ВНУП Пакана", company: "Истилон Млан Бенисле", agent: "Бекох Базар", region: "Бп.", balance: -240_000, ytd: -340_000, sum: 0 },
  { id: 4, code: "0_4", name: "Дамин Аса Лоиш Сан №1", company: "Раздумон", agent: "Лоч", region: "СБ", balance: -480_000, ytd: -680_000, sum: 0 },
  { id: 5, code: "0_5", name: "ARA KARAGANDA SAVDO PLUS HMT (Movmif)", company: "MARQQAND", agent: "BoyEm | Pavidobi", region: "Cp", balance: 0, ytd: 0, sum: 0 },
  { id: 6, code: "0_6", name: "Захобла Шафанаулна", company: "Sigotodion", agent: "ДАВЛАТ", region: "Бп.", balance: 0, ytd: 0, sum: 0 },
  { id: 7, code: "0_7", name: "Mariam Akin (Gh)", company: "MAGAZIN OK", agent: "M.NEKAR Аф", region: "Бп.", balance: 0, ytd: 0, sum: 0 },
  { id: 8, code: "0_8", name: "Камаран а к Дим", company: "MOH'SAN SUPER FOODS", agent: "Bobudgemi.Asa, Tcabok", region: "Сергели", balance: -8_400_000, ytd: -9_800_000, sum: 0 },
  { id: 9, code: "0_9", name: "Авина Муали Доним", company: "ДСК", agent: "Babadjanova Nargiza", region: "Сергели", balance: 0, ytd: 0, sum: 0 },
  { id: 10, code: "0_10", name: "Свеген Ола а с Бадион", company: "Прлгрес Финанс зи МЯК", agent: "Boy Em /pl Bog", region: "СБ", balance: -240_000, ytd: -680_000, sum: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function BalansyClientovPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const filtered = CLIENTS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const totalBalance = CLIENTS.reduce((s, c) => s + c.balance, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Балансы клиентов</h1>
          <div className="text-right">
            <div className="text-xs text-slate-500">Сум (gross прирост)</div>
            <div className="text-base font-bold text-rose-700">−{fmt(Math.abs(totalBalance))}</div>
            <div className="text-xs text-slate-500">Доллар США</div>
            <div className="text-base font-bold">1 169 063 023</div>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <button className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs">Поступления</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Списания</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Корректировки товара</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Возврат с поставщика</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Возврат с клиента</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Обмен (взаимозачёт)</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Перемещение</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Приходование товара</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Отчёт по постановкам</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Отчёт по постановкам</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Отчёт по складу</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Отчёт по корзине</button>
            <button className="px-3 py-1.5 border border-slate-300 rounded text-xs">Возврат с поставщика</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {["Категория клиента", "Поиск", "Территория"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs flex items-center justify-between">
                <span className="text-slate-700">{f}</span><span className="text-slate-400">▾</span>
              </button>
            ))}
            <Button variant="outline" size="sm" className="gap-1"><RefreshCw className="w-3 h-3" /> Сбросить</Button>
            <Button size="sm" className="gap-1"><FilterIcon className="w-3 h-3" /> Filtr</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">Быстрый поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-1 w-8"></th>
                  <th className="border border-slate-300 py-2 px-1 w-10">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИД клиента</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Название клиента</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Код клиента</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Юр. название</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Тип клиента</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Территория</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Посещение А...</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-1 text-center">
                      <input type="checkbox" />
                    </td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{c.code}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-semibold">{c.name}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-500">{`SKU${c.id.toString().padStart(4, "0")}`}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-600">{c.company}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-xs text-slate-500">Wholesaler</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-xs">{c.agent}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-xs">{c.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - 2 0 / 7 4 0</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-300 rounded">Пред..</button>
              <button className="px-2 py-1 bg-emerald-600 text-white rounded">2</button>
              <button className="px-2 py-1 border border-slate-300 rounded">3</button>
              <button className="px-2 py-1 border border-slate-300 rounded">След..</button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
