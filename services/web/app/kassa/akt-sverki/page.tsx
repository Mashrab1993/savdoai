"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Building2, Calendar, Filter as FilterIcon, Download } from "lucide-react"
import Link from "next/link"

const CLIENTS = [
  { id: 1, name: "Чоко_лайфмотрид Ch...", sub: "Choco_Lifemotrid", balance: -1_240_000 },
  { id: 2, name: "Амир 999 Мухтаров (A...)", sub: "Mchj Amir Akmalovich 999", balance: 0 },
  { id: 3, name: "Янгибазар Азиз Ака №...", sub: "", balance: -3_840_000 },
  { id: 4, name: "SIFAT. UZ", sub: "", balance: 580_000 },
  { id: 5, name: "Диержон", sub: "ЧП Жалилов", balance: -2_400_000 },
  { id: 6, name: "Достон Пожарка (Пан...)", sub: "ASIL BEK VINO MCHJ", balance: -680_000 },
  { id: 7, name: "Жамил Ака Нур Марк...", sub: "", balance: 0 },
  { id: 8, name: "Кувонч Фарм Аптека ...", sub: "", balance: -8_900_000 },
  { id: 9, name: "Нигора Опа 25 м", sub: "", balance: -1_240_000 },
  { id: 10, name: "Оатовик Самиржон Зу...", sub: "Зульфия Шоп", balance: 240_000 },
  { id: 11, name: "Рахмат Ака (Панжоб)", sub: "Саид Олимхон Соб Савдо Мчж", balance: -4_500_000 },
  { id: 12, name: "Солежон (Сартепо) №0", sub: "", balance: 0 },
]

const TRANSACTIONS = [
  { date: "2026-04-30", type: "Зак.", num: "1024", debit: 1_240_000, credit: 0, balance: -1_240_000 },
  { date: "2026-04-28", type: "Опл.", num: "5012", debit: 0, credit: 800_000, balance: 0 },
  { date: "2026-04-25", type: "Зак.", num: "1018", debit: 2_840_000, credit: 0, balance: -800_000 },
  { date: "2026-04-22", type: "Опл.", num: "5004", debit: 0, credit: 3_840_000, balance: 2_040_000 },
  { date: "2026-04-15", type: "Зак.", num: "1008", debit: 5_240_000, credit: 0, balance: -1_800_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function AktSverkiPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<typeof CLIENTS[0] | null>(CLIENTS[0])
  const filtered = CLIENTS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const debit = TRANSACTIONS.reduce((s, t) => s + t.debit, 0)
  const credit = TRANSACTIONS.reduce((s, t) => s + t.credit, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Akt sverki</h1>
          <Button className="gap-2"><Download className="w-4 h-4" /> Загрузить</Button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Card className="p-3 col-span-12 lg:col-span-4 max-h-[80vh] overflow-y-auto">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск" className="pl-9" />
            </div>
            <div className="space-y-1.5">
              {filtered.map(c => {
                const isSelected = selected?.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${isSelected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{c.name}</div>
                      {c.sub && <div className="text-xs text-slate-500 truncate">{c.sub}</div>}
                    </div>
                    {c.balance !== 0 && (
                      <div className={`text-xs font-bold flex-shrink-0 ${c.balance < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                        {fmt(c.balance / 1_000)}K
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-5 col-span-12 lg:col-span-8">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    {selected.sub && <p className="text-sm text-slate-500">{selected.sub}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 border border-slate-300 bg-white rounded-md text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Весь период
                    </button>
                    <button className="px-3 py-2 border border-slate-300 bg-white rounded-md text-sm flex items-center gap-1">
                      <FilterIcon className="w-4 h-4" /> фильтр
                    </button>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" /> Показать
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Card className="p-3 bg-emerald-50 border-emerald-200">
                    <div className="text-xs font-bold text-emerald-700">Дебет (Sotuv)</div>
                    <div className="text-lg font-bold font-mono mt-1">{fmt(debit)} so'm</div>
                  </Card>
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="text-xs font-bold text-blue-700">Кредит (To'lov)</div>
                    <div className="text-lg font-bold font-mono mt-1">{fmt(credit)} so'm</div>
                  </Card>
                  <Card className={`p-3 ${selected.balance < 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className={`text-xs font-bold ${selected.balance < 0 ? "text-rose-700" : "text-slate-700"}`}>Сальдо</div>
                    <div className={`text-lg font-bold font-mono mt-1 ${selected.balance < 0 ? "text-rose-700" : ""}`}>{fmt(selected.balance)} so'm</div>
                  </Card>
                </div>

                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 py-2 px-2">Sana</th>
                      <th className="border border-slate-300 py-2 px-2">Tip</th>
                      <th className="border border-slate-300 py-2 px-2">№</th>
                      <th className="border border-slate-300 py-2 px-2 text-right">Дебет</th>
                      <th className="border border-slate-300 py-2 px-2 text-right">Кредит</th>
                      <th className="border border-slate-300 py-2 px-2 text-right">Сальдо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSACTIONS.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-2 px-2 font-mono text-xs">{t.date}</td>
                        <td className="border border-slate-300 py-2 px-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${t.type === "Зак." ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{t.type}</span>
                        </td>
                        <td className="border border-slate-300 py-2 px-2 font-mono">#{t.num}</td>
                        <td className="border border-slate-300 py-2 px-2 text-right font-mono text-amber-700">{t.debit ? fmt(t.debit) : "—"}</td>
                        <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-700">{t.credit ? fmt(t.credit) : "—"}</td>
                        <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${t.balance < 0 ? "text-rose-700" : "text-slate-700"}`}>{fmt(t.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500">
                <span className="text-2xl">👆</span>
                <p className="mt-2">Чтобы увидеть Акт Сверки - выберите клиента или найдите его в списке</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
