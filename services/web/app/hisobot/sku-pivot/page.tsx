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

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function SkuPivotPage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                SKU 2.0 <span className="italic text-[#C75D3C]">универсальный pivot</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">v2.0 · 12 уровней иерархии</p>
            </div>
          </div>

          <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
              {["Агент", "Территория", "Категория клиента", "Бренд", "Категория продукта", "Группа товаров", "Продукт", "SKU"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-white">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border border-[#C75D3C] bg-[#F5E5D6] rounded-md text-xs font-medium text-[#C75D3C]">📅 Дата отгрузки ▾</button>
              <button className="px-3 py-2 border border-[#C75D3C] bg-[#F5E5D6] rounded-md text-xs font-medium text-[#C75D3C]">📅 апр 2 6 — май 2 ▾</button>
              <Button size="sm" className="gap-1 ml-auto" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
            </div>
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
                    <th className="py-3 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[400px]">1</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[140px]">2 (Кол-во)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[140px]">3 (Сумма)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[140px]">4 (Возврат сумма)</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => (
                    <tr key={r.lvl} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{r.lvl}</td>
                      <td className="py-2 px-2 font-medium text-[#1A1A1A]" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>
                        {r.label} <span className="text-[#9C8A6E]">{r.icon}</span>
                      </td>
                      <td className="py-2 px-2 text-right text-[#9C8A6E] font-mono tabular-nums">
                        {r.lvl === 9 ? "Итоговое кол-во" : ""}
                      </td>
                      <td className="py-2 px-2 text-right text-[#9C8A6E] font-mono tabular-nums">
                        {r.lvl === 10 ? "Итоговая сумма" : ""}
                      </td>
                      <td className="py-2 px-2 text-right text-[#9C8A6E] font-mono tabular-nums">
                        {r.lvl === 12 ? "Итоговая возврат сумма" : ""}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2] bg-[#FAF7F2]/50">
                    <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{ROWS.length + 1}</td>
                    <td className="py-2 px-2 text-[#1A1A1A]">▸ Berdiyev Rahmatillo</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-medium text-[#1A1A1A]">4 280</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">412 800 000</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-[#C75D3C]">248 000</td>
                  </tr>
                  <tr className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2] bg-[#FAF7F2]/50">
                    <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{ROWS.length + 2}</td>
                    <td className="py-2 px-2 text-[#1A1A1A]">▸ Babadjanova Nargiza</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-medium text-[#1A1A1A]">2 840</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">286 400 000</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-[#C75D3C]">168 000</td>
                  </tr>
                  <tr className="bg-[#FAF7F2] font-medium border-t border-[#E8E0D3]">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-[#1A1A1A]" style={SERIF}>Общий итог</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>7 120</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>699 200 000</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]" style={SERIF}>416 000</td>
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
