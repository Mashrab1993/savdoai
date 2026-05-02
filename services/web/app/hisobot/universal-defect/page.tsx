"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Download, Settings, Filter as FilterIcon, Settings2 } from "lucide-react"
import Link from "next/link"

const FILTERS = ["Agent", "Ekspeditor", "Способ оплаты", "Тип цены", "Sklad", "Territoriya", "Категория продукта", "Группа товаров", "Заказы с возвратами", "Возврат"]

const ROWS = [
  { lvl: 1, label: "КЛИЕНТ", indent: 0 },
  { lvl: 2, label: "ЭКСПЕДИТОР", indent: 1 },
  { lvl: 3, label: "АГЕНТ", indent: 2 },
  { lvl: 4, label: "ТОВАР", indent: 3 },
  { lvl: 5, label: "КОЛ-ВО ДОСТАВКИ", indent: 4 },
  { lvl: 6, label: "КОЛ-ВО ВОЗВРАТА", indent: 5 },
  { lvl: 7, label: "КОЛ-ВО ВОЗВРАТ. БОНУСА", indent: 6 },
  { lvl: 8, label: "КОЛ-ВО ОТГРУЗ", indent: 7 },
  { lvl: 9, label: "СУММА ДОСТАВКИ", indent: 8 },
  { lvl: 10, label: "СУММА ОТГРУЗ", indent: 9 },
]

const CLIENTS_DATA = [
  { id: 11, name: "Holyigid Aka Narimon Boqon", values: [0, 0, 0] },
  { id: 12, name: "Ismoil Aka Mingchinor Bulung'ur", values: [0, 0, 0] },
  { id: 13, name: "Majid Aka Loyish Banisa №118", values: [0, 0, 0] },
]

export default function UniversalDefectPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Universal otchet po vozvratam: <span className="text-emerald-700">Nachal'niy otchet</span></h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {FILTERS.map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 Дата отгрузки ▾</button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 апр 2 6 — май 2 ▾</button>
            <Button className="gap-2 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-1 mb-4 pb-3 border-b border-slate-200">
            <ToolbarBtn icon={FolderOpen} label="Отчёты" />
            <ToolbarBtn icon={Save} label="Сохран..." />
            <ToolbarBtn icon={Maximize2} label="Разверн..." />
            <ToolbarBtn icon={Download} label="Экспорт" />
            <div className="ml-auto flex items-center gap-1">
              <ToolbarBtn icon={Settings} label="Формат" />
              <ToolbarBtn icon={Settings2} label="Настрой..." />
              <ToolbarBtn icon={Settings} label="Поля" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[300px]">1</th>
                  <th className="border border-slate-300 py-2 px-2 text-right min-w-[180px]">2</th>
                  <th className="border border-slate-300 py-2 px-2 text-right min-w-[180px]">3</th>
                  <th className="border border-slate-300 py-2 px-2 text-right min-w-[180px]">4</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.lvl} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{r.lvl}</td>
                    <td className="border border-slate-300 py-2 px-2 font-bold text-slate-800" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>
                      {r.label} ⚙
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-500">
                      {r.lvl === 10 ? "Итоговая сумма Кол-во доставки" : ""}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-500">
                      {r.lvl === 10 ? "Итоговая сумма Кол-во возврата" : ""}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-500"></td>
                  </tr>
                ))}
                {CLIENTS_DATA.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{ROWS.length + i + 1}</td>
                    <td className="border border-slate-300 py-2 px-2">▸ {c.name}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{c.values[0]}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{c.values[1]}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{c.values[2]}</td>
                  </tr>
                ))}
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
