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
const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function UniversalVisitPage() {
  const totalVisited = AGENTS.reduce((s, a) => s + a.visited, 0)
  const totalPosesh = AGENTS.reduce((s, a) => s + a.posesh, 0)
  const totalAll = AGENTS.reduce((s, a) => s + a.total, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Universal vizit <span className="italic text-[#C75D3C]">otchet</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{AGENTS.length} ta agent · jami {fmt(totalAll)} ta klient · {totalPosesh} tashrif</p>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {["Agent", "Territoriya", "Параметры визита", "Статус заказа", "Все клиенты"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-[#FAF7F2]">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D]">апр 26 — май 2 ▾</button>
            </div>
            <div className="mt-3"><Button className="gap-2" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button></div>
          </Card>

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
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-12">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент / Клиент</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Непосещённые</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Посещённые</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Итого</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">3</td>
                    <td className="py-3 px-2 text-[#6B5B4D]">▸</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]"></td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">0</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]">0</td>
                  </tr>
                  {AGENTS.map((a, i) => (
                    <tr key={a.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{i + 4}</td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">▸ {a.name}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-[#C75D3C]">{fmt(a.visited)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{a.posesh}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-[#1A1A1A]">{fmt(a.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t-2 border-[#E8E0D3]">
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">10</td>
                    <td className="py-3 px-2 text-[#1A1A1A]" style={SERIF}>Общий итог</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]" style={SERIF}>{fmt(totalVisited)}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{totalPosesh}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(totalAll)}</td>
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
