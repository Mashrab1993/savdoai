"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, AlertCircle, CheckCircle2, Package, Calendar, FileText, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SKLADS = ["Markaziy ombor", "Sergeli filial", "Yangiyul filial"]

const ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", system: 124, fact: 124, unit: "dona" },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", system: 86, fact: 84, unit: "dona" },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", system: 248, fact: 252, unit: "dona" },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", system: 156, fact: 153, unit: "dona" },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", system: 96, fact: 96, unit: "dona" },
  { id: 6, name: "Pechenye Yubileynoye 500г", code: "COOK-YUB-500", system: 64, fact: 60, unit: "dona" },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET", system: 184, fact: 188, unit: "dona" },
  { id: 8, name: "Fanta Orange 1.5L", code: "FT-15-PET", system: 124, fact: 124, unit: "dona" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function InventoryPage() {
  const [sklad, setSklad] = useState(SKLADS[0])
  const [date, setDate] = useState("2026-05-02")
  const [search, setSearch] = useState("")
  const [counts, setCounts] = useState<Record<number, number>>(Object.fromEntries(ITEMS.map(i => [i.id, i.fact])))

  const filtered = ITEMS.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))

  const stats = ITEMS.reduce((s, it) => {
    const fact = counts[it.id] ?? it.fact
    const diff = fact - it.system
    if (diff === 0) s.match += 1
    else if (diff > 0) s.surplus += 1
    else s.shortage += 1
    s.diffSum += diff
    return s
  }, { match: 0, surplus: 0, shortage: 0, diffSum: 0 })

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Inventarizatsiya
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Sklad qoldig'ini hisoblash · {sklad}</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><FileText className="w-4 h-4" /> Eski hisoblar</Button>
            <Button onClick={() => toast.success(`Inventarizatsiya saqlandi: ${stats.match}/${ITEMS.length} mos`)} className="gap-2" style={{ background: "#C75D3C" }}>
              <Save className="w-4 h-4" /> Yakunlash
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <label className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1 block">Sklad</label>
              <select value={sklad} onChange={e => setSklad(e.target.value)} className="w-full px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-lg text-sm font-medium text-[#1A1A1A] focus:border-[#C75D3C] focus:outline-none">
                {SKLADS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Card>
            <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <label className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Inventar sanasi</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-[#E8E0D3] bg-[#FAF7F2]" />
            </Card>
            <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <div className="text-xs uppercase tracking-[0.15em] font-medium text-emerald-700 mb-1">Mos keldi</div>
              <div className="text-3xl font-medium text-[#1A1A1A] flex items-center gap-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}><CheckCircle2 className="w-5 h-5 text-emerald-600" /> {stats.match}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </Card>
            <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C] mb-1">Farq</div>
              <div className="text-3xl font-medium text-[#1A1A1A] flex items-center gap-2 tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <AlertCircle className="w-5 h-5 text-[#C75D3C]" /> {stats.surplus + stats.shortage}
              </div>
              <div className="text-xs text-[#9C8A6E] mt-1">+{stats.surplus} ortiqcha · −{stats.shortage} kam</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar nomi yoki kod..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <Button variant="outline" size="sm" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Package className="w-4 h-4" /> Yuklash</Button>
              <Button variant="outline" size="sm" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Plus className="w-4 h-4" /> Tovar qo'shish</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kod</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tizimda</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Hisoblandi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Farq</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const fact = counts[it.id] ?? it.fact
                    const diff = fact - it.system
                    const status = diff === 0 ? "match" : diff > 0 ? "surplus" : "shortage"
                    const statusBg = { match: "bg-emerald-50 text-emerald-700", surplus: "bg-blue-50 text-blue-700", shortage: "bg-[#F5E5D6] text-[#C75D3C]" }[status]
                    const statusLabel = { match: "✓ Mos", surplus: "↑ Ortiqcha", shortage: "↓ Kam" }[status]
                    return (
                      <tr key={it.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{it.name}</td>
                        <td className="py-3 px-2 text-[#9C8A6E] font-mono text-xs">{it.code}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{fmt(it.system)}</td>
                        <td className="py-3 px-2 text-right">
                          <input
                            type="number"
                            value={fact}
                            onChange={e => setCounts({ ...counts, [it.id]: Number(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-[#E8E0D3] bg-[#FAF7F2] rounded-md text-right font-mono font-medium focus:border-[#C75D3C] focus:outline-none"
                          />
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${diff === 0 ? "text-[#9C8A6E]" : diff > 0 ? "text-blue-700" : "text-[#C75D3C]"}`}>
                          {diff === 0 ? "—" : (diff > 0 ? "+" : "") + fmt(diff)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBg}`}>{statusLabel}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                    <td colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami: {ITEMS.length} pozitsiya</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]">{fmt(ITEMS.reduce((s, i) => s + i.system, 0))}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]">{fmt(Object.values(counts).reduce((s, n) => s + n, 0))}</td>
                    <td className={`py-3 px-2 text-right font-mono font-medium ${stats.diffSum === 0 ? "text-[#1A1A1A]" : stats.diffSum > 0 ? "text-blue-700" : "text-[#C75D3C]"}`}>
                      {stats.diffSum === 0 ? "0" : (stats.diffSum > 0 ? "+" : "") + fmt(stats.diffSum)}
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-[#9C8A6E]">{stats.match}/{ITEMS.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
