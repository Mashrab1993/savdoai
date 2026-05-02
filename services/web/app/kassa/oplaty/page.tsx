"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Calendar, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"

type Payment = {
  id: number; date: string; createdAt: string; inn: string; client: string; clientType: string;
  agent: string; region: string; expeditor: string; territory: string; method: string; sum: number;
}

const PAYMENTS: Payment[] = Array.from({ length: 18 }).map((_, i) => ({
  id: 8000 + i,
  date: `2026-05-0${(i % 9) + 1}`,
  createdAt: "2026-05-01 14:25",
  inn: `30213${4900 + i}`,
  client: ["Бегзод Ака MARKET", "ХАСАН MARKET", "M.NEKAR Аф", "Несаждан магазин", "ХУЖА Москва Магазин", "Ali Ake Магазин Сирож", "Раис Бола, Семурғ", "Билтек Маркет / OOO", "Мукл МО ИМ", "Ali Ake Магазин Шум", "Маркет Маҳкам", "Mu Magazin Бобо", "Юм Янги Бона Бой", "Жабиржон, Жабиржон", "ESKI MAGAZIN", "Дилёра, Истагикон М.А", "Магазин · Coq Sub MARKET", "Manzil MARKET CENTRAL ASIA SAVDO PLUS"][i % 18],
  clientType: ["Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "OOO", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "Магазин", "OOO"][i % 18],
  agent: ["Babadjanova Nargiza", "Berdiyev Rahmatillo", "Sayitqulov Mashrab", "ДАВЛАТ", "BORIEV MIRJALOL", "Турсунов Жамшед"][i % 6],
  region: ["Боидак", "Бектемир", "Янгийор", "Камашли", "Сергели", "Самарканд"][i % 6],
  expeditor: ["Toxirov M.", "Aminov R.", "Karimov F.", "Sobirov G."][i % 4],
  territory: ["Toshkent", "Sergeli", "Yashnobod"][i % 3],
  method: ["Наличные", "Click", "Payme", "Bank"][i % 4],
  sum: 1_000_000 + i * 240_000,
}))

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function OplatyClientsPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const filtered = PAYMENTS.filter(p => !search || p.client.toLowerCase().includes(search.toLowerCase()))

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }
  const toggleOne = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const totalSum = PAYMENTS.reduce((s, p) => s + p.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Оплаты клиентов</h1>
          <button className="px-3 py-2 border border-emerald-300 text-emerald-700 rounded-md text-sm bg-white hover:bg-emerald-50">Группировать</button>
          <button className="px-3 py-2 border border-emerald-300 text-emerald-700 rounded-md text-sm bg-white hover:bg-emerald-50">Активность</button>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Добавить оплату</Button>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            {["Касса", "Агент", "Территория", "Тип клиента", "Способ оплаты", "Сумма от"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Дата оплаты ▾
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> апр 2 6 — май 2 ▾
            </button>
            <Button size="sm" className="gap-1 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Button size="sm" className="gap-1" disabled={selected.size === 0}>
              <span className="text-xs">Группировка</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1" disabled={selected.size === 0}>
              <span className="text-xs">Удалить выбранные</span>
            </Button>
            {selected.size > 0 && <span className="text-xs text-slate-600">{selected.size} выбрано</span>}
            <button className="px-2 py-1 border border-slate-300 rounded text-xs ml-auto">По 2 0</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Показ./Скр. столбцы</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Excel</button>
            <span className="text-xs text-slate-500">Быстрый поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-8">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                  </th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИД оплаты</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Дата оплаты</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Дата создания записи</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИНН</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Клиент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Тип клиента</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИД Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИД Заказа</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50 ${selected.has(p.id) ? "bg-emerald-50" : ""}`}>
                    <td className="border border-slate-300 py-1.5 px-2 text-center">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">#{p.id}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{p.date}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-500">{p.createdAt}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{p.inn}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-semibold">{p.client}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{p.clientType}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-xs text-slate-600">{p.agent}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{p.id - 7000}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={9} className="border border-slate-300 py-2 px-2 text-center">Итого: {filtered.length} ta to'lov · {fmt(totalSum)} so'm</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - {filtered.length} / {PAYMENTS.length}</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-300 rounded">Пред..</button>
              <button className="px-2 py-1 bg-emerald-600 text-white rounded">1</button>
              <button className="px-2 py-1 border border-slate-300 rounded">2</button>
              <button className="px-2 py-1 border border-slate-300 rounded">След..</button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
