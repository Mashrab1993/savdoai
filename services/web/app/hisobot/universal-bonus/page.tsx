"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Save, Maximize2, Minimize2, Download, Settings, Filter as FilterIcon, CheckCircle2, Clock, Award } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { idx: 1, brand: "Bonjur", agent: "Nurmatov A.", target: 50_000_000, fact: 42_800_000, rate: 4, bonus: 1_712_000, status: "in_progress" },
  { idx: 2, brand: "Coca-Cola", agent: "Karimov S.", target: 80_000_000, fact: 86_400_000, rate: 5, bonus: 4_320_000, status: "completed" },
  { idx: 3, brand: "Choco-Boom", agent: "Rasulov B.", target: 30_000_000, fact: 24_500_000, rate: 3, bonus: 735_000, status: "in_progress" },
  { idx: 4, brand: "Aqua-Plus", agent: "Yusupov D.", target: 20_000_000, fact: 18_400_000, rate: 2, bonus: 368_000, status: "in_progress" },
  { idx: 5, brand: "Hilol", agent: "Toxirov M.", target: 15_000_000, fact: 9_800_000, rate: 3, bonus: 294_000, status: "in_progress" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }
const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function UniversalBonusPage() {
  const totalBonus = ROWS.reduce((s, r) => s + r.bonus, 0)
  const totalTarget = ROWS.reduce((s, r) => s + r.target, 0)
  const totalFact = ROWS.reduce((s, r) => s + r.fact, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Universal bonus <span className="italic text-[#C75D3C]">otchet</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Nachal'niy otchet · {ROWS.length} ta yozuv · {fmt(totalBonus / 1000)}k so'm bonus</p>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {["Agent", "Brend", "Territoriya", "Klient kategoriyasi", "Тип бонуса", "Статус", "Период начисления"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between bg-[#FAF7F2]">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D]">Дата начисления ▾</button>
              <button className="px-3 py-2 border border-[#E8E0D3] bg-[#F0EAE0] rounded-md text-xs font-medium text-[#6B5B4D]">апр 26 — май 2 ▾</button>
              <Button className="gap-2 ml-auto" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#10B981" }}>Bajarildi</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{ROWS.filter(r => r.status === "completed").length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">target bajarilgan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Clock className="w-5 h-5 mb-2" style={{ color: "#D97706" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#D97706" }}>Davom etyapti</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{ROWS.filter(r => r.status === "in_progress").length}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">target hali to'lmagan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#D97706" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Award className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>Jami bonus</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{fmt(totalBonus)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">so'm hisoblangan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#7C3AED" }} />
            </Card>
          </div>

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
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-12">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Бренд</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Таргет</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Факт</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Бажариш %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ставка</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Бонус</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => {
                    const pct = (r.fact / r.target * 100)
                    return (
                      <tr key={r.idx} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{r.idx}</td>
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{r.brand}</td>
                        <td className="py-3 px-2 text-[#6B5B4D]">{r.agent}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(r.target)}</td>
                        <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${pct >= 100 ? "text-emerald-700" : "text-[#D97706]"}`}>{fmt(r.fact)}</td>
                        <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${pct >= 100 ? "text-emerald-700" : pct >= 80 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>{pct.toFixed(1)}%</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-[#6B5B4D]">{r.rate}%</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium" style={{ color: "#7C3AED" }}>{fmt(r.bonus)}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded ${r.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-[#FCE9DD] text-[#D97706]"}`}>
                            {r.status === "completed" ? "Bajarildi" : "Davom"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#FAF7F2] font-medium border-t-2 border-[#E8E0D3]">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-[#1A1A1A]" colSpan={2} style={SERIF}>Общий итог</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(totalTarget)}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(totalFact)}</td>
                    <td colSpan={2}></td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums" style={{ ...SERIF, color: "#7C3AED" }}>{fmt(totalBonus)}</td>
                    <td></td>
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
