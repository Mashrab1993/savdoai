"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Minimize2, Download, Settings, Filter as FilterIcon, Maximize } from "lucide-react"
import Link from "next/link"

const FILTERS = [
  "Agent", "Ekspeditor", "Territoriya", "Kategoriya klienta", "Otgruzilgan, Доставлен", "Группа товаров",
  "Brend", "Kategoriya produkt", "Тип цены", "Skidka berilgan", "Sklad", "Klientlar"
]

const ROWS = [
  { idx: 1, klient: "Holyigid Aka Narimon Boqon", agent: "Babadjanova Nargiza", qty: 24, sum: 341_200_000, discount: 12.5, status: "Доставлен", date: "2026-04-28" },
  { idx: 2, klient: "Ismoil Aka Mingchinor Bulung'ur", agent: "Babadjanova Nargiza", qty: 18, sum: 286_400_000, discount: 8, status: "Отгружен", date: "2026-04-27" },
  { idx: 3, klient: "Majid Aka Loyish Banisa №118", agent: "Babadjanova Nargiza", qty: 16, sum: 248_600_000, discount: 5, status: "Доставлен", date: "2026-04-26" },
  { idx: 4, klient: "Asia Optom Market", agent: "Nurmatov A.", qty: 32, sum: 412_800_000, discount: 10, status: "Доставлен", date: "2026-04-25" },
  { idx: 5, klient: "Globus Plus", agent: "Rasulov B.", qty: 14, sum: 142_400_000, discount: 6, status: "Доставлен", date: "2026-04-24" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }
const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function UniversalSalesPage() {
  const [showZero, setShowZero] = useState(false)
  const totalQty = ROWS.reduce((s, r) => s + r.qty, 0)
  const totalSum = ROWS.reduce((s, r) => s + r.sum, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Universal sotuv <span className="italic text-[#C75D3C]">otchet</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Po klientam · {ROWS.length} ta yozuv · {fmt(totalSum / 1_000_000)} M so'm</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Maximize className="w-4 h-4" /> Весь экран</Button>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {FILTERS.map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-[#FAF7F2]">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D] flex items-center justify-between min-w-[180px]">
                Дата отгрузки <span className="ml-auto">▾</span>
              </button>
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D] flex items-center justify-between min-w-[180px]">
                апр 26 — май 2 ▾
              </button>
              <Button className="gap-2" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
            </div>
          </Card>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-[#6B5B4D]">
              <input type="checkbox" checked={showZero} onChange={e => setShowZero(e.target.checked)} className="rounded" />
              Показать не проданные товары
            </label>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-1 mb-4 pb-3 border-b border-[#E8E0D3]">
              <ToolbarBtn icon={FolderOpen} label="Отчёты" />
              <ToolbarBtn icon={Save} label="Сохран..." />
              <ToolbarBtn icon={Maximize2} label="Разверн..." />
              <ToolbarBtn icon={Minimize2} label="Свернуть" />
              <ToolbarBtn icon={Download} label="Экспорт" />
              <div className="ml-auto flex items-center gap-1">
                <ToolbarBtn icon={Settings} label="Формат" />
                <ToolbarBtn icon={Settings} label="Настрой..." />
                <ToolbarBtn icon={Settings} label="Поля" />
                <ToolbarBtn icon={Maximize} label="Весь экран" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-12">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Клиент</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Количество</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Сумма</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Скидка %</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Статус</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => (
                    <tr key={r.idx} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{r.idx}</td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{r.klient}</td>
                      <td className="py-3 px-2 text-[#6B5B4D]">{r.agent}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{r.qty}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{fmt(r.sum)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#6B5B4D]">{r.discount}%</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.status === "Доставлен" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{r.status}</span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-xs text-[#6B5B4D]">{r.date}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t-2 border-[#E8E0D3]">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-[#1A1A1A]" colSpan={2} style={SERIF}>Итого</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{totalQty}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{fmt(totalSum)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function ToolbarBtn({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="px-2 py-1.5 hover:bg-[#FAF7F2] rounded flex flex-col items-center gap-0.5 group">
      <Icon className="w-5 h-5 text-[#6B5B4D] group-hover:text-[#C75D3C]" />
      <span className="text-[10px] text-[#9C8A6E]">{label}</span>
    </button>
  )
}
