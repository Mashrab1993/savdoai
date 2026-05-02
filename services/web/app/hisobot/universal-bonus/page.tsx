"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Minimize2, Download, Settings, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { idx: 1, brand: "Bonjur", agent: "Nurmatov A.", target: 50_000_000, fact: 42_800_000, rate: 4, bonus: 1_712_000, status: "in_progress" },
  { idx: 2, brand: "Coca-Cola", agent: "Karimov S.", target: 80_000_000, fact: 86_400_000, rate: 5, bonus: 4_320_000, status: "completed" },
  { idx: 3, brand: "Choco-Boom", agent: "Rasulov B.", target: 30_000_000, fact: 24_500_000, rate: 3, bonus: 735_000, status: "in_progress" },
  { idx: 4, brand: "Aqua-Plus", agent: "Yusupov D.", target: 20_000_000, fact: 18_400_000, rate: 2, bonus: 368_000, status: "in_progress" },
  { idx: 5, brand: "Hilol", agent: "Toxirov M.", target: 15_000_000, fact: 9_800_000, rate: 3, bonus: 294_000, status: "in_progress" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function UniversalBonusPage() {
  const totalBonus = ROWS.reduce((s, r) => s + r.bonus, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Universal otchet po bonusam: <span className="text-emerald-700">Nachal'niy otchet</span></h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {["Agent", "Brend", "Territoriya", "Klient kategoriyasi", "Тип бонуса", "Статус", "Период начисления"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 Дата начисления ▾</button>
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700">📅 апр 2 6 — май 2 ▾</button>
            <Button className="gap-2 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700">Bajarildi</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{ROWS.filter(r => r.status === "completed").length}</div>
            <div className="text-xs text-slate-600 mt-1">target bajarilgan</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-xs font-bold text-amber-700">Davom etyapti</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{ROWS.filter(r => r.status === "in_progress").length}</div>
            <div className="text-xs text-slate-600 mt-1">target hali to'lmagan</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700">Jami bonus</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalBonus)}</div>
            <div className="text-xs text-slate-600 mt-1">so'm hisoblangan</div>
          </Card>
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">№</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">БРЕНД</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">АГЕНТ</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">ТАРГЕТ</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">ФАКТ</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">БАЖАРИШ %</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">СТАВКА</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">БОНУС</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">СТАТУС</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => {
                  const pct = (r.fact / r.target * 100)
                  return (
                    <tr key={r.idx} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{r.idx}</td>
                      <td className="border border-slate-300 py-2 px-2 font-bold">{r.brand}</td>
                      <td className="border border-slate-300 py-2 px-2">{r.agent}</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(r.target)}</td>
                      <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${pct >= 100 ? "text-emerald-700" : "text-amber-700"}`}>{fmt(r.fact)}</td>
                      <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${pct >= 100 ? "text-emerald-700" : pct >= 80 ? "text-amber-700" : "text-rose-700"}`}>{pct.toFixed(1)}%</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono">{r.rate}%</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-violet-700">{fmt(r.bonus)}</td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {r.status === "completed" ? "✓ Bajarildi" : "⏳ Davom"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 py-2 px-2"></td>
                  <td className="border border-slate-300 py-2 px-2" colSpan={2}>Общий итог</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(ROWS.reduce((s, r) => s + r.target, 0))}</td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(ROWS.reduce((s, r) => s + r.fact, 0))}</td>
                  <td colSpan={2} className="border border-slate-300"></td>
                  <td className="border border-slate-300 py-2 px-2 text-right font-mono text-violet-800">{fmt(totalBonus)}</td>
                  <td className="border border-slate-300"></td>
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
