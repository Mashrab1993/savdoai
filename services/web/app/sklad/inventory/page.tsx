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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Inventarizatsiya</h1>
            <p className="text-base text-slate-500 mt-1">Sklad qoldig'ini hisoblash · {sklad}</p>
          </div>
          <Button variant="outline" className="gap-2"><FileText className="w-4 h-4" /> Eski hisoblar</Button>
          <Button onClick={() => toast.success(`Inventarizatsiya saqlandi: ${stats.match}/${ITEMS.length} mos`)} className="gap-2">
            <Save className="w-4 h-4" /> Yakunlash
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Sklad</label>
            <select value={sklad} onChange={e => setSklad(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium">
              {SKLADS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Card>
          <Card className="p-4">
            <label className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Inventar sanasi</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700 mb-1">Mos keldi</div>
            <div className="text-2xl font-bold text-emerald-900 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {stats.match}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <div className="text-xs font-bold text-rose-700 mb-1">Farq</div>
            <div className="text-2xl font-bold text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {stats.surplus + stats.shortage}
            </div>
            <div className="text-xs text-rose-600 mt-1">+{stats.surplus} ortiqcha · −{stats.shortage} kam</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar nomi yoki kod..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="gap-2"><Package className="w-4 h-4" /> Barcha tovarlar yuklash</Button>
            <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Tovar qo'shish</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Kod</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Tizimda</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Hisoblandi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Farq</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => {
                  const fact = counts[it.id] ?? it.fact
                  const diff = fact - it.system
                  const status = diff === 0 ? "match" : diff > 0 ? "surplus" : "shortage"
                  const statusBg = { match: "bg-emerald-100 text-emerald-700", surplus: "bg-blue-100 text-blue-700", shortage: "bg-rose-100 text-rose-700" }[status]
                  const statusLabel = { match: "✓ Mos", surplus: "↑ Ortiqcha", shortage: "↓ Kam" }[status]
                  return (
                    <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-semibold text-slate-900">{it.name}</td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-xs">{it.code}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{fmt(it.system)}</td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          value={fact}
                          onChange={e => setCounts({ ...counts, [it.id]: Number(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border-2 border-slate-300 rounded-md text-right font-mono font-bold focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${diff === 0 ? "text-slate-400" : diff > 0 ? "text-blue-700" : "text-rose-700"}`}>
                        {diff === 0 ? "—" : (diff > 0 ? "+" : "") + fmt(diff)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusBg}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-3 px-2 text-slate-700">Jami: {ITEMS.length} pozitsiya</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(ITEMS.reduce((s, i) => s + i.system, 0))}</td>
                  <td className="py-3 px-2 text-right font-mono">{fmt(Object.values(counts).reduce((s, n) => s + n, 0))}</td>
                  <td className={`py-3 px-2 text-right font-mono ${stats.diffSum === 0 ? "text-slate-700" : stats.diffSum > 0 ? "text-blue-700" : "text-rose-700"}`}>
                    {stats.diffSum === 0 ? "0" : (stats.diffSum > 0 ? "+" : "") + fmt(stats.diffSum)}
                  </td>
                  <td className="py-3 px-2 text-center text-xs text-slate-500">{stats.match}/{ITEMS.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
