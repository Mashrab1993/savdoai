"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Calendar, Filter as FilterIcon, FileText, Eye, Pencil, Truck, Download } from "lucide-react"
import Link from "next/link"

type Order = {
  id: number; row: number; date: string; createdAt: string; agent: string; client: string;
  expeditor: string; orderType: string; payType: string;
  qty: number; sum: number; status: "novyy" | "podtv" | "v_obrabotke" | "vypolnen" | "otmenen";
  cashbox: string; territory: string;
}

const STATUS_BADGE: Record<string, string> = {
  novyy: "bg-slate-100 text-slate-700",
  podtv: "bg-blue-100 text-blue-700",
  v_obrabotke: "bg-amber-100 text-amber-700",
  vypolnen: "bg-emerald-100 text-emerald-700",
  otmenen: "bg-rose-100 text-rose-700",
}
const STATUS_LABEL: Record<string, string> = {
  novyy: "Yangi",
  podtv: "✓ Tasdiq",
  v_obrabotke: "⏳ Ishlanmoqda",
  vypolnen: "✓✓ Bajarildi",
  otmenen: "✕ Bekor",
}

const ORDERS: Order[] = Array.from({ length: 24 }).map((_, i) => ({
  id: 9000 + i,
  row: i + 1,
  date: `2026-05-0${(i % 9) + 1}`,
  createdAt: `2026-05-0${(i % 9) + 1} 1${i % 5}:25`,
  agent: ["Babadjanova N.", "Berdiyev R.", "Sayitqulov M.", "ДАВЛАТ", "BORIEV M.", "Турсунов Ж."][i % 6],
  client: ["Salom Magazin №1", "Bona Магазин", "Дастархон Сервис", "Гулямов Маркет", "Турсун Ake Магазин", "Ali Ake Магазин", "Билтек Маркет", "Юсупов Магазин"][i % 8],
  expeditor: ["Toxirov M.", "Aminov R.", "Karimov F.", "Sobirov G."][i % 4],
  orderType: ["Заявка", "Возврат", "Доставка"][i % 3],
  payType: ["Наличные", "Click", "Payme", "Bank"][i % 4],
  qty: 12 + (i % 8) * 6,
  sum: 1_240_000 + i * 180_000,
  status: ["novyy", "podtv", "v_obrabotke", "vypolnen", "vypolnen", "otmenen"][i % 6] as Order["status"],
  cashbox: "Основная касса",
  territory: ["Toshkent", "Sergeli", "Yashnobod"][i % 3],
}))

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ZayavkalarPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const filtered = ORDERS
    .filter(o => status === "all" || o.status === status)
    .filter(o => !search || o.client.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search))

  const totalSum = filtered.reduce((s, o) => s + o.sum, 0)

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(o => o.id)))
  }
  const toggleOne = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Заявки (Zayavkalar)</h1>
            <p className="text-sm text-slate-500">{filtered.length} ta zayavka · {fmt(totalSum / 1_000_000)} M so'm</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Link href="/sotuv/yangi"><Button className="gap-1"><Plus className="w-4 h-4" /> Yangi zakaz</Button></Link>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-3">
            {["Агент", "Экспедитор", "Тип заказа", "Статус", "Способ оплаты", "Сумма от", "Сумма до"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Дата заказа ▾
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> апр 2 6 — май 2 ▾
            </button>
            <Button size="sm" className="gap-1 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <div className="flex items-center gap-2 flex-wrap">
          {["all", "novyy", "podtv", "v_obrabotke", "vypolnen", "otmenen"].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${status === s ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 hover:bg-slate-50"}`}>
              {s === "all" ? "Hammasi" : STATUS_LABEL[s]}
              <span className="ml-2 opacity-60">{s === "all" ? ORDERS.length : ORDERS.filter(o => o.status === s).length}</span>
            </button>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">По 20</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Показ./Скр. столбцы</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Excel</button>
            <span className="text-xs text-slate-500 ml-2">Поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" placeholder="Klient yoki #..." />
            <span className="text-xs text-slate-500 ml-auto">Tanlangan: {selected.size}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-8">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                  </th>
                  <th className="border border-slate-300 py-2 px-2 w-10">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">ИД заказа</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Дата</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Создан</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Клиент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Экспедитор</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Тип</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Оплата</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кол-во</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Сумма</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Статус</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className={`hover:bg-slate-50 ${selected.has(o.id) ? "bg-emerald-50" : ""}`}>
                    <td className="border border-slate-300 py-1.5 px-2 text-center">
                      <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} />
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-400">{o.row}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-blue-700">#{o.id}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{o.date}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-500 text-[10px]">{o.createdAt}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{o.agent}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-semibold">{o.client}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{o.expeditor}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">{o.orderType}</span>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center text-[10px]">{o.payType}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{o.qty}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold text-emerald-700">{fmt(o.sum)}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href="#" className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Ko'rish"><Eye className="w-3.5 h-3.5" /></Link>
                        <Link href="#" className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="O'zgartirish"><Pencil className="w-3.5 h-3.5" /></Link>
                        <Link href="#" className="text-violet-600 hover:bg-violet-50 p-1 rounded" title="Yetkazish"><Truck className="w-3.5 h-3.5" /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={11} className="border border-slate-300 py-2 px-2 text-right">Итого:</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-700">{fmt(totalSum)}</td>
                  <td colSpan={2} className="border border-slate-300"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>1 - {filtered.length} / {ORDERS.length}</span>
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
