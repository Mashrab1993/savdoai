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

export default function UniversalSalesPage() {
  const [showZero, setShowZero] = useState(false)
  const totalQty = ROWS.reduce((s, r) => s + r.qty, 0)
  const totalSum = ROWS.reduce((s, r) => s + r.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Universal otchet po prodajam: <span className="text-emerald-700">Po klientam</span></h1>
          <Button variant="outline" className="gap-2"><Maximize className="w-4 h-4" /> Весь экран</Button>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {FILTERS.map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center justify-between min-w-[180px]">
              📅 Дата отгрузки <span className="ml-auto">▾</span>
            </button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center justify-between min-w-[180px]">
              📅 апр <span className="text-slate-500 ml-1">2 6</span> — май <span className="text-slate-500 ml-1">2</span> ▾
            </button>
            <Button className="gap-2"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showZero} onChange={e => setShowZero(e.target.checked)} className="rounded" />
            Показать не проданные товары
          </label>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-1 mb-4 pb-3 border-b border-slate-200">
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
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 w-12">№</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-left">КЛИЕНТ</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-left">АГЕНТ</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-right">КОЛИЧЕСТВО</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-right">СУММА</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-right">ПРОЦЕНТ СКИДКИ</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-center">СТАТУС</th>
                  <th className="border border-slate-300 py-2 px-2 font-bold text-slate-700 text-center">ДАТА</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-slate-500 font-mono text-center">{r.idx}</td>
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{r.klient}</td>
                    <td className="border border-slate-300 py-2 px-2 text-slate-700">{r.agent}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{r.qty}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(r.sum)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{r.discount}%</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${r.status === "Доставлен" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{r.status}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-xs">{r.date}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 py-2 px-2"></td>
                  <td className="border border-slate-300 py-2 px-2" colSpan={2}>Итого</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{totalQty}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{fmt(totalSum)}</td>
                  <td colSpan={3} className="border border-slate-300"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

function ToolbarBtn({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="px-2 py-1.5 hover:bg-slate-100 rounded flex flex-col items-center gap-0.5 group">
      <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-700" />
      <span className="text-[10px] text-slate-500">{label}</span>
    </button>
  )
}
