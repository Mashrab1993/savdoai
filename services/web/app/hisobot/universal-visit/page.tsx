"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Minimize2, Download, Settings, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"

const AGENTS = [
  { name: "BORIEV MIRJALOL", visited: 2337, posesh: 133, total: 2470 },
  { name: "Babadjanova Nargiza", visited: 1621, posesh: 169, total: 1790 },
  { name: "Berdiyev Rahmatillo", visited: 1209, posesh: 147, total: 1356 },
  { name: "Sayitqulov Mashrab.", visited: 1127, posesh: 101, total: 1228 },
  { name: "ДАВЛАТ.", visited: 1223, posesh: 180, total: 1403 },
  { name: "Турсунов Жамшед.", visited: 114, posesh: 9, total: 123 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function UniversalVisitPage() {
  const totalVisited = AGENTS.reduce((s, a) => s + a.visited, 0)
  const totalPosesh = AGENTS.reduce((s, a) => s + a.posesh, 0)
  const totalAll = AGENTS.reduce((s, a) => s + a.total, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Otchet · <span className="text-slate-500 text-base">Universal po vizitam</span></h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {["Agent", "Territoriya", "Параметры визита", "Статус заказа", "Все клиенты"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 апр 2 6 — май 2 ▾</button>
          </div>
          <div className="mt-3"><Button className="gap-2"><FilterIcon className="w-4 h-4" /> Filtr</Button></div>
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
                  <th className="border border-slate-300 py-3 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-3 px-2 text-left">АГЕНТ <span className="text-slate-400 ml-2">⚙ ПОСЕЩЕНИЕ ⚙ ЗАКАЗ ⚙</span></th>
                  <th className="border border-slate-300 py-3 px-2 text-right text-slate-700">▸ Непосещенные</th>
                  <th className="border border-slate-300 py-3 px-2 text-right text-slate-700">▸ Посещенные</th>
                  <th className="border border-slate-300 py-3 px-2 text-right text-slate-700">Итоговое кол-во Агент</th>
                </tr>
                <tr className="bg-slate-50 text-xs">
                  <th className="border border-slate-300 py-2 px-2"></th>
                  <th className="border border-slate-300 py-2 px-2 text-left text-slate-500">КЛИЕНТ ⚙</th>
                  <th className="border border-slate-300 py-2 px-2"></th>
                  <th className="border border-slate-300 py-2 px-2"></th>
                  <th className="border border-slate-300 py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">3</td>
                  <td className="border border-slate-300 py-2 px-2">▸</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono"></td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                </tr>
                {AGENTS.map((a, i) => (
                  <tr key={a.name} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{i + 4}</td>
                    <td className="border border-slate-300 py-2 px-2 font-semibold">▸ {a.name}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-rose-700">{fmt(a.visited)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{a.posesh}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">{fmt(a.total)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-500">10</td>
                  <td className="border border-slate-300 py-2 px-2">Общий Итог</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-800">{fmt(totalVisited)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{totalPosesh}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(totalAll)}</td>
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
