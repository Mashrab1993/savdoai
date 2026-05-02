"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Download, Settings, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { lvl: 1, label: "ТЕРРИТОРИЯ", indent: 0 },
  { lvl: 2, label: "АГЕНТ", indent: 1 },
  { lvl: 3, label: "VISIT КОЛ-ВО", indent: 2 },
  { lvl: 4, label: "ZAKAZ КОЛ-ВО", indent: 3 },
  { lvl: 5, label: "% КОНВЕРСИЯ", indent: 4 },
  { lvl: 6, label: "СУММА ПРОДАЖ", indent: 5 },
  { lvl: 7, label: "СРЕДНИЙ ЧЕК", indent: 6 },
  { lvl: 8, label: "SKU ШИРИНА", indent: 7 },
  { lvl: 9, label: "ФОТО REPORT", indent: 8 },
]

const AGENTS = [
  { region: "Sergeli", name: "Nurmatov A.", visits: 624, orders: 412, conv: 66, sum: 142_800_000, avg: 346_602, sku: 84, foto: 412 },
  { region: "Yashnobod", name: "Karimov S.", visits: 568, orders: 296, conv: 52, sum: 98_400_000, avg: 332_432, sku: 76, foto: 386 },
  { region: "Samarqand", name: "Rasulov B.", visits: 542, orders: 286, conv: 53, sum: 86_200_000, avg: 301_399, sku: 68, foto: 324 },
  { region: "Buxoro", name: "Yusupov D.", visits: 456, orders: 218, conv: 48, sum: 72_400_000, avg: 332_110, sku: 64, foto: 286 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function AgentsUniversalPage() {
  const totalVisits = AGENTS.reduce((s, a) => s + a.visits, 0)
  const totalOrders = AGENTS.reduce((s, a) => s + a.orders, 0)
  const totalSum = AGENTS.reduce((s, a) => s + a.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Универсальный отчёт по агентам</h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {["Агент", "Территория", "Категория клиента", "Бренд", "Период"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-1 mb-4 pb-3 border-b border-slate-200">
            <ToolbarBtn icon={FolderOpen} label="Отчёты" />
            <ToolbarBtn icon={Save} label="Сохран..." />
            <ToolbarBtn icon={Maximize2} label="Разверн..." />
            <ToolbarBtn icon={Download} label="Экспорт" />
            <div className="ml-auto"><Button size="sm" className="gap-1"><FilterIcon className="w-4 h-4" /> Filtr</Button></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[300px]">1</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">2</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">3</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">4</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.lvl} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{r.lvl}</td>
                    <td className="border border-slate-300 py-2 px-2 font-bold" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>{r.label} ⚙</td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono">{r.lvl === 6 ? "Сумма" : ""}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono">{r.lvl === 7 ? "Avg" : ""}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono"></td>
                  </tr>
                ))}
                {AGENTS.map((a, i) => (
                  <tr key={a.name} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{ROWS.length + i + 1}</td>
                    <td className="border border-slate-300 py-2 px-2">
                      <div className="text-xs text-slate-500 mb-0.5">{a.region}</div>
                      <div className="font-semibold">▸ {a.name}</div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{a.visits}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{a.orders}</td>
                    <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${a.conv >= 60 ? "text-emerald-700" : a.conv >= 50 ? "text-amber-700" : "text-rose-700"}`}>{a.conv}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 py-2 px-2"></td>
                  <td className="border border-slate-300 py-2 px-2">Общий итог</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{totalVisits}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{totalOrders}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{(totalOrders / totalVisits * 100).toFixed(0)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700">Visits</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalVisits)}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">Orders</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalOrders)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700">Sum</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalSum / 1_000_000)} M</div>
          </Card>
        </div>
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
