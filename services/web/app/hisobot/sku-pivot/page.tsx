"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Minimize2, Download, Settings, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { lvl: 1, label: "АГЕНТ", indent: 0, icon: "⚙" },
  { lvl: 2, label: "ТЕРРИТОРИЯ", indent: 1, icon: "⚙" },
  { lvl: 3, label: "КАТЕГОРИЯ КЛИЕНТА", indent: 2, icon: "⚙" },
  { lvl: 4, label: "БРЕНД", indent: 3, icon: "⚙" },
  { lvl: 5, label: "КАТЕГОРИЯ ПРОДУКТА", indent: 4, icon: "⚙" },
  { lvl: 6, label: "ГРУППА ТОВАРОВ", indent: 5, icon: "⚙" },
  { lvl: 7, label: "ПРОДУКТ", indent: 6, icon: "⚙" },
  { lvl: 8, label: "SKU", indent: 7, icon: "⚙" },
  { lvl: 9, label: "КОЛ-ВО", indent: 8, icon: "⚙" },
  { lvl: 10, label: "СУММА", indent: 9, icon: "⚙" },
  { lvl: 11, label: "ВОЗВРАТ КОЛ-ВО", indent: 10, icon: "⚙" },
  { lvl: 12, label: "ВОЗВРАТ СУММА", indent: 11, icon: "⚙" },
]

export default function SkuPivotPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">SKU 2.0 — Универсальный отчёт по SKU</h1>
          <span className="text-xs text-slate-400">v2.0 · 12 уровней иерархии</span>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            {["Агент", "Территория", "Категория клиента", "Бренд", "Категория продукта", "Группа товаров", "Продукт", "SKU"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 Дата отгрузки ▾</button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 апр 2 6 — май 2 ▾</button>
            <Button size="sm" className="gap-1 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[400px]">1</th>
                  <th className="border border-slate-300 py-2 px-2 text-right min-w-[140px]">2 (Кол-во)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right min-w-[140px]">3 (Сумма)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right min-w-[140px]">4 (Возврат сумма)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.lvl} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{r.lvl}</td>
                    <td className="border border-slate-300 py-2 px-2 font-bold text-slate-800" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>
                      {r.label} <span className="text-slate-400">{r.icon}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono">
                      {r.lvl === 9 ? "Итоговое кол-во" : ""}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono">
                      {r.lvl === 10 ? "Итоговая сумма" : ""}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono">
                      {r.lvl === 12 ? "Итоговая возврат сумма" : ""}
                    </td>
                  </tr>
                ))}
                <tr className="hover:bg-slate-50 bg-slate-50/30">
                  <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{ROWS.length + 1}</td>
                  <td className="border border-slate-300 py-2 px-2">▸ Berdiyev Rahmatillo</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">4 280</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">412 800 000</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">248 000</td>
                </tr>
                <tr className="hover:bg-slate-50 bg-slate-50/30">
                  <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{ROWS.length + 2}</td>
                  <td className="border border-slate-300 py-2 px-2">▸ Babadjanova Nargiza</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">2 840</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">286 400 000</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">168 000</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 py-2 px-2"></td>
                  <td className="border border-slate-300 py-2 px-2">Общий итог</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">7 120</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">699 200 000</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-800">416 000</td>
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
