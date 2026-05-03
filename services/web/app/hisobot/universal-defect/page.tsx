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

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function UniversalDefectPage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Universal vozvrat <span className="italic text-[#C75D3C]">otchet</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Nachal'niy otchet · ierarxiya bo'yicha qaytarishlar</p>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {FILTERS.map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-[#FAF7F2]">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D]">Дата отгрузки ▾</button>
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D]">апр 26 — май 2 ▾</button>
              <Button className="gap-2 ml-auto" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-1 mb-4 pb-3 border-b border-[#E8E0D3]">
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-12">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[300px]">Параметр</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[180px]">Доставка</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[180px]">Возврат</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[180px]">Bонус</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => (
                    <tr key={r.lvl} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{r.lvl}</td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>
                        {r.label}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E] text-xs">
                        {r.lvl === 10 ? "Итоговая сумма Кол-во доставки" : ""}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E] text-xs">
                        {r.lvl === 10 ? "Итоговая сумма Кол-во возврата" : ""}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#9C8A6E]"></td>
                    </tr>
                  ))}
                  {CLIENTS_DATA.map((c, i) => (
                    <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{ROWS.length + i + 1}</td>
                      <td className="py-3 px-2 text-[#1A1A1A]">▸ {c.name}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{c.values[0]}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{c.values[1]}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{c.values[2]}</td>
                    </tr>
                  ))}
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
