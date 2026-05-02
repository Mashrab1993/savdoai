"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Filter as FilterIcon, Calendar } from "lucide-react"
import Link from "next/link"

const CLIENTS = [
  { id: 1, name: "Аркат Плам", phone: "+998 90 X", agent: "Babadjanova Nargiza", expeditor: "Toxirov M.", territory: "Боидак", region: "Boidak Region" },
  { id: 2, name: "Зайнур Спайн", phone: "+998 91 X", agent: "Babadjanova Nargiza", expeditor: "Toxirov M.", territory: "Боидак", region: "Boidak" },
  { id: 3, name: "1.4 Магазин Багдадов Мух", phone: "+998 90 X", agent: "Sayitqulov Mashrab", expeditor: "Aminov R.", territory: "Сергели", region: "Sergeli" },
  { id: 4, name: "Азизбек Эжин", phone: "+998 90 X", agent: "ДАВЛАТ", expeditor: "Karimov F.", territory: "Самарканд", region: "Samarqand" },
  { id: 5, name: "ХУЖ Монаст ВНЕБИВ", phone: "+998 91 X", agent: "BORIEV MIRJALOL", expeditor: "Aminov R.", territory: "Бектемир", region: "Bektemir" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function OborotyPage() {
  const [search, setSearch] = useState("")

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Обороты по клиентам</h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            {["Супервайзер", "Экспедитор", "Группа клиента", "Категория клиента", "Территория", "Регион"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Дата отгрузки ▾
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> апр 2 6 — май 2 ▾
            </button>
            <Button size="sm" className="gap-1 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm">Группировка</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">По 2 0</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Показ./Скр. столбцы</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Excel</button>
            <span className="text-xs text-slate-500 ml-auto">Быстрый поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-8">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[200px]">Клиент (тип, название)</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Телефон</th>
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[140px]">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Экспедитор</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Территория</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Регион</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Открытие баланс</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Сумма (UZS)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Сумма (USD)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кредит</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Закрытие баланс</th>
                </tr>
              </thead>
              <tbody>
                {CLIENTS.map((c, i) => {
                  const openBal = 1_000_000 * (i + 1)
                  const sumUZS = 240_000 * (i + 1)
                  const credit = 100_000 * (i + 1)
                  const closeBal = openBal + sumUZS - credit
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{c.id}</td>
                      <td className="border border-slate-300 py-1.5 px-2 font-semibold">{c.name}</td>
                      <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-600">{c.phone}</td>
                      <td className="border border-slate-300 py-1.5 px-2">{c.agent}</td>
                      <td className="border border-slate-300 py-1.5 px-2">{c.expeditor}</td>
                      <td className="border border-slate-300 py-1.5 px-2">{c.territory}</td>
                      <td className="border border-slate-300 py-1.5 px-2">{c.region}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{fmt(openBal)}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-emerald-700 font-bold">{fmt(sumUZS)}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-400">—</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-rose-700">{fmt(credit)}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold">{fmt(closeBal)}</td>
                    </tr>
                  )
                })}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="border border-slate-300 py-2 px-2">Итог</td>
                  <td colSpan={5} className="border border-slate-300"></td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">15 000 000</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">3 600 000</td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">1 500 000</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">17 100 000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
