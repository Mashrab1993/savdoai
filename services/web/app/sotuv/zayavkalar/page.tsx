"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Calendar, Filter as FilterIcon, Eye, Pencil, Truck, Download } from "lucide-react"
import Link from "next/link"

type Order = {
  id: number; row: number; date: string; createdAt: string; agent: string; client: string;
  expeditor: string; orderType: string; payType: string;
  qty: number; sum: number; status: "novyy" | "podtv" | "v_obrabotke" | "vypolnen" | "otmenen";
  cashbox: string; territory: string;
}

const STATUS_BADGE: Record<string, string> = {
  novyy: "bg-[#F0EAE0] text-[#6B5B4D]",
  podtv: "bg-blue-50 text-blue-700",
  v_obrabotke: "bg-[#FCE9DD] text-[#D97706]",
  vypolnen: "bg-emerald-50 text-emerald-700",
  otmenen: "bg-[#F5E5D6] text-[#C75D3C]",
}
const STATUS_LABEL: Record<string, string> = {
  novyy: "Yangi",
  podtv: "✓ Tasdiq",
  v_obrabotke: "Ishlanmoqda",
  vypolnen: "Bajarildi",
  otmenen: "Bekor",
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Zayavkalar <span className="italic text-[#C75D3C]">jurnali</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{filtered.length} ta zayavka · <span className="font-medium text-[#1A1A1A] tabular-nums">{fmt(totalSum / 1_000_000)} M</span> so'm</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Link href="/sotuv/yangi"><Button className="gap-1" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi zakaz</Button></Link>
          </div>

          {/* Filters */}
          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-3">
              {["Агент", "Экспедитор", "Тип заказа", "Статус", "Способ оплаты", "Сумма от", "Сумма до"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="px-3 py-2 border border-[#C75D3C]/40 bg-[#FCE9DD] rounded-md text-xs font-medium text-[#C75D3C] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Дата заказа ▾
              </button>
              <button className="px-3 py-2 border border-[#C75D3C]/40 bg-[#FCE9DD] rounded-md text-xs font-medium text-[#C75D3C] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> апр 26 — май 2 ▾
              </button>
              <Button size="sm" className="gap-1 ml-auto" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
            </div>
          </Card>

          {/* Status tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "novyy", "podtv", "v_obrabotke", "vypolnen", "otmenen"].map(s => {
              const isActive = status === s
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${isActive ? "bg-[#C75D3C] text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}
                >
                  {s === "all" ? "Hammasi" : STATUS_LABEL[s]}
                  <span className={`ml-2 ${isActive ? "opacity-80" : "text-[#9C8A6E]"}`}>{s === "all" ? ORDERS.length : ORDERS.filter(o => o.status === s).length}</span>
                </button>
              )
            })}
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <button className="px-2.5 py-1 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D] hover:border-[#C75D3C]">По 20</button>
              <button className="px-2.5 py-1 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D] hover:border-[#C75D3C]">Столбцы</button>
              <button className="px-2.5 py-1 border border-[#E8E0D3] rounded text-xs text-[#6B5B4D] hover:border-[#C75D3C]">Excel</button>
              <span className="text-xs text-[#9C8A6E] ml-2">Поиск:</span>
              <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48 border-[#E8E0D3] bg-[#FAF7F2]" placeholder="Klient yoki #..." />
              <span className="text-xs text-[#9C8A6E] ml-auto">Tanlangan: <span className="font-medium text-[#C75D3C]">{selected.size}</span></span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 w-8">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-[#C75D3C]" />
                    </th>
                    <th className="py-3 px-2 w-10 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Заказ</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Дата</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Создан</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Клиент</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Эксп.</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Тип</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Оплата</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Кол.</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Сумма</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Статус</th>
                    <th className="py-3 px-2 text-center w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} className={`border-b border-[#F0EAE0] hover:bg-[#FAF7F2] ${selected.has(o.id) ? "bg-[#FCE9DD]/40" : ""}`}>
                      <td className="py-2 px-2 text-center">
                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} className="accent-[#C75D3C]" />
                      </td>
                      <td className="py-2 px-2 text-center text-[#9C8A6E]">{o.row}</td>
                      <td className="py-2 px-2 font-mono text-[#C75D3C] font-medium">#{o.id}</td>
                      <td className="py-2 px-2 font-mono text-[#1A1A1A]">{o.date}</td>
                      <td className="py-2 px-2 font-mono text-[#9C8A6E] text-[10px]">{o.createdAt}</td>
                      <td className="py-2 px-2 text-[#1A1A1A]">{o.agent}</td>
                      <td className="py-2 px-2 font-medium text-[#1A1A1A]">{o.client}</td>
                      <td className="py-2 px-2 text-[#6B5B4D]">{o.expeditor}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">{o.orderType}</span>
                      </td>
                      <td className="py-2 px-2 text-center text-[10px] text-[#6B5B4D]">{o.payType}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#1A1A1A]">{o.qty}</td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(o.sum)}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Ko'rish"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="O'zgartirish"><Pencil className="w-3.5 h-3.5" /></button>
                          <button className="text-[#C75D3C] hover:bg-[#FCE9DD] p-1 rounded" title="Yetkazish"><Truck className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] border-t border-[#E8E0D3]">
                    <td colSpan={11} className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Итого:</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalSum)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#9C8A6E]">
              <span>1 - {filtered.length} / {ORDERS.length}</span>
              <div className="flex gap-1">
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">Пред.</button>
                <button className="px-2.5 py-1 bg-[#C75D3C] text-white rounded">1</button>
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">2</button>
                <button className="px-2.5 py-1 border border-[#E8E0D3] rounded hover:border-[#C75D3C]">След.</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
