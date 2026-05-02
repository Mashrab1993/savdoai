"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Minimize2, Download, Settings, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { lvl: 1, label: "КАССА", indent: 0 },
  { lvl: 2, label: "ТИП ОПЕРАЦИИ", indent: 1 },
  { lvl: 3, label: "СПОСОБ ОПЛАТЫ", indent: 2 },
  { lvl: 4, label: "ВАЛЮТА", indent: 3 },
  { lvl: 5, label: "СУММА ВХОДА", indent: 4 },
  { lvl: 6, label: "СУММА ВЫХОДА", indent: 5 },
  { lvl: 7, label: "САЛЬДО НА НАЧАЛО", indent: 6 },
  { lvl: 8, label: "САЛЬДО НА КОНЕЦ", indent: 7 },
]

const KASSY = [
  { name: "Основная касса", in: 412_800_000, out: 286_400_000, balance: 90_660_886_071 },
  { name: "Sergeli филиал", in: 124_000_000, out: 84_200_000, balance: 6_240_000 },
  { name: "Yangiyul филиал", in: 86_400_000, out: 64_800_000, balance: 2_180_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function KassaPivotPage() {
  const totals = KASSY.reduce((acc, k) => ({
    in: acc.in + k.in, out: acc.out + k.out, balance: acc.balance + k.balance,
  }), { in: 0, out: 0, balance: 0 })

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/kassa" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Касса pivot — <span className="text-slate-500 text-base">Универсальный отчёт</span></h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
            {["Касса", "Тип операции", "Способ оплаты", "Валюта", "Период"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
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
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[280px]">1</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">2</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">3</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">4</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.lvl} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{r.lvl}</td>
                    <td className="border border-slate-300 py-2 px-2 font-bold text-slate-800" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>
                      {r.label} ⚙
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono">
                      {r.lvl === 7 ? "Итоговая сумма Сальдо начало" : ""}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono"></td>
                    <td className="border border-slate-300 py-2 px-2 text-right text-slate-400 font-mono"></td>
                  </tr>
                ))}
                {KASSY.map((k, i) => (
                  <tr key={k.name} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{ROWS.length + i + 1}</td>
                    <td className="border border-slate-300 py-2 px-2">▸ {k.name}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-700">{fmt(k.in)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">{fmt(k.out)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">{fmt(k.balance)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="border border-slate-300 py-2 px-2">Общий итог</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-emerald-800">{fmt(totals.in)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-800">{fmt(totals.out)}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(totals.balance)}</td>
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
