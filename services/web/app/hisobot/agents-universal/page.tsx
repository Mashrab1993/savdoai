"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Download, Settings, Filter as FilterIcon, Users, ShoppingCart, Layers } from "lucide-react"
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

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function AgentsUniversalPage() {
  const totalVisits = AGENTS.reduce((s, a) => s + a.visits, 0)
  const totalOrders = AGENTS.reduce((s, a) => s + a.orders, 0)
  const totalSum = AGENTS.reduce((s, a) => s + a.sum, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Универсальный отчёт <span className="italic text-[#C75D3C]">по агентам</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">9-darajali ierarxiya · vizit, zakaz, konversiya va summa</p>
            </div>
          </div>

          <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {["Агент", "Территория", "Категория клиента", "Бренд", "Период"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-white">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-1 mb-4 pb-3 border-b border-[#E8E0D3]">
              <ToolbarBtn icon={FolderOpen} label="Отчёты" />
              <ToolbarBtn icon={Save} label="Сохран..." />
              <ToolbarBtn icon={Maximize2} label="Разверн..." />
              <ToolbarBtn icon={Download} label="Экспорт" />
              <div className="ml-auto"><Button size="sm" className="gap-1" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[300px]">1</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">2</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">3</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">4</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => (
                    <tr key={r.lvl} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{r.lvl}</td>
                      <td className="py-2 px-2 font-medium text-[#1A1A1A]" style={{ paddingLeft: `${10 + r.indent * 16}px` }}>{r.label} <span className="text-[#9C8A6E]">⚙</span></td>
                      <td className="py-2 px-2 text-right text-[#9C8A6E] font-mono tabular-nums">{r.lvl === 6 ? "Сумма" : ""}</td>
                      <td className="py-2 px-2 text-right text-[#9C8A6E] font-mono tabular-nums">{r.lvl === 7 ? "Avg" : ""}</td>
                      <td className="py-2 px-2 text-right text-[#9C8A6E] font-mono tabular-nums"></td>
                    </tr>
                  ))}
                  {AGENTS.map((a, i) => (
                    <tr key={a.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{ROWS.length + i + 1}</td>
                      <td className="py-2 px-2">
                        <div className="text-xs text-[#9C8A6E] mb-0.5">{a.region}</div>
                        <div className="font-medium text-[#1A1A1A]">▸ {a.name}</div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{a.visits}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{a.orders}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-medium" style={{ color: a.conv >= 60 ? "#047857" : a.conv >= 50 ? "#D97706" : "#C75D3C" }}>{a.conv}%</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-[#1A1A1A]" style={SERIF}>Общий итог</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{totalVisits}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{totalOrders}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{(totalOrders / totalVisits * 100).toFixed(0)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Users className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#10B981" }}>Visits</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalVisits)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami tashriflar</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <ShoppingCart className="w-5 h-5 mb-2" style={{ color: "#3B82F6" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#3B82F6" }}>Orders</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalOrders)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami zakazlar</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Layers className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>Sum</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalSum / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami summa</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#7C3AED" }} />
            </Card>
          </div>
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
