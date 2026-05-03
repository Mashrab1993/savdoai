"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Edit2, Save, ArrowUp, ArrowDown, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const HISTORY = [
  { id: 1001, date: "2026-05-01", sklad: "Markaziy ombor", count: 8, total_diff: -340_000, user: "Mashrab S.", reason: "Inventarizatsiya farqi" },
  { id: 1002, date: "2026-04-28", sklad: "Sergeli filial", count: 4, total_diff: 1_240_000, user: "Nurmatov A.", reason: "Hisoblashda xato" },
  { id: 1003, date: "2026-04-25", sklad: "Markaziy ombor", count: 12, total_diff: -1_840_000, user: "Mashrab S.", reason: "Brak chiqarish" },
  { id: 1004, date: "2026-04-20", sklad: "Yangiyul filial", count: 3, total_diff: 480_000, user: "Yusupov D.", reason: "Topilgan tovar" },
]

const ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", current: 124, price: 5500 },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", current: 86, price: 11200 },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", current: 248, price: 8400 },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", current: 156, price: 12500 },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", current: 96, price: 6400 },
]

const REASONS = ["Inventarizatsiya farqi", "Hisoblashda xato", "Brak/Yaroqsiz", "Topilgan tovar", "Boshqa"]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function KorrektirovkaPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [adjustments, setAdjustments] = useState<Record<number, number>>({})
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState("")

  const filtered = ITEMS.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const totalDiff = ITEMS.reduce((s, it) => s + (adjustments[it.id] || 0) * it.price, 0)
  const changesCount = Object.values(adjustments).filter(v => v !== 0).length

  const handleSave = () => {
    if (changesCount === 0) {
      toast.error("Hech qanday o'zgartirish yo'q")
      return
    }
    toast.success(`${changesCount} ta korrektirovka saqlandi (${fmt(totalDiff)} so'm)`)
    setShowForm(false)
    setAdjustments({})
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Korrektirovka <span className="italic text-[#C75D3C]">(qoldiq tahrirlash)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Sklad qoldig'ini qo'lda to'g'rilash · Audit log saqlanadi</p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="gap-2" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi korrektirovka</Button>
            )}
          </div>

          {showForm ? (
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-light flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  <Edit2 className="w-5 h-5 text-[#C75D3C]" />
                  Yangi korrektirovka
                </h2>
                <span className="text-sm text-[#9C8A6E]">{changesCount} ta o'zgartirish · Jami: <span className={`font-medium ${totalDiff >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>{totalDiff >= 0 ? "+" : ""}{fmt(totalDiff)} so'm</span></span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1 block">Sabab *</label>
                  <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-lg text-sm font-medium text-[#1A1A1A] focus:border-[#C75D3C] focus:outline-none">
                    {REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1 block">Sklad</label>
                  <select className="w-full px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-lg text-sm font-medium text-[#1A1A1A] focus:border-[#C75D3C] focus:outline-none">
                    <option>Markaziy ombor</option>
                    <option>Sergeli filial</option>
                    <option>Yangiyul filial</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1 block">Izoh (audit log)</label>
                  <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Korrektirovka sababi haqida batafsil..." className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                      <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Joriy</th>
                      <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">+/− miqdor</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Yangi qoldiq</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Farq summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(it => {
                      const adj = adjustments[it.id] || 0
                      const newQty = it.current + adj
                      const diffSum = adj * it.price
                      return (
                        <tr key={it.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                          <td className="py-3 px-2">
                            <div className="font-medium text-[#1A1A1A]">{it.name}</div>
                            <div className="text-xs text-[#9C8A6E] font-mono">{it.code}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{it.current}</td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={adj || ""}
                              onChange={e => setAdjustments({ ...adjustments, [it.id]: Number(e.target.value) || 0 })}
                              placeholder="0"
                              className={`w-24 px-2 py-1 border rounded-md text-center font-mono font-medium focus:outline-none ${adj > 0 ? "border-emerald-400 bg-emerald-50 text-emerald-700" : adj < 0 ? "border-[#C75D3C]/50 bg-[#F5E5D6] text-[#C75D3C]" : "border-[#E8E0D3] bg-[#FAF7F2]"}`}
                            />
                          </td>
                          <td className={`py-3 px-2 text-right font-mono font-medium ${adj === 0 ? "text-[#1A1A1A]" : adj > 0 ? "text-emerald-700" : "text-[#C75D3C]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                            {newQty}
                          </td>
                          <td className={`py-3 px-2 text-right font-mono font-medium ${diffSum === 0 ? "text-[#9C8A6E]" : diffSum > 0 ? "text-emerald-700" : "text-[#C75D3C]"}`}>
                            {diffSum === 0 ? "—" : (diffSum > 0 ? "+" : "") + fmt(diffSum)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setShowForm(false); setAdjustments({}) }} className="border-[#E8E0D3] text-[#6B5B4D]">Bekor qilish</Button>
                <Button onClick={handleSave} disabled={changesCount === 0} className="gap-2" style={{ background: "#C75D3C" }}><Save className="w-4 h-4" /> Saqlash ({changesCount})</Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <KpiCard icon={FileText} accent="#3B82F6" label="Jami korrektirovka" value={HISTORY.length.toString()} />
                <KpiCard icon={ArrowUp} accent="#10B981" label="Ortish (jami)" value={`+${fmt(HISTORY.filter(h => h.total_diff > 0).reduce((s, h) => s + h.total_diff, 0))}`} />
                <KpiCard icon={ArrowDown} accent="#C75D3C" label="Kamayish (jami)" value={fmt(HISTORY.filter(h => h.total_diff < 0).reduce((s, h) => s + h.total_diff, 0))} />
              </div>

              <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Korrektirovka tarixi</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sklad</th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sabab</th>
                        <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                        <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Farq</th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HISTORY.map(h => (
                        <tr key={h.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                          <td className="py-3 px-2 text-[#9C8A6E] font-mono">#{h.id}</td>
                          <td className="py-3 px-2 text-[#6B5B4D] font-mono text-xs">{h.date}</td>
                          <td className="py-3 px-2 text-[#1A1A1A]">{h.sklad}</td>
                          <td className="py-3 px-2 text-[#6B5B4D]">{h.reason}</td>
                          <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{h.count}</td>
                          <td className={`py-3 px-2 text-right font-mono font-medium ${h.total_diff >= 0 ? "text-emerald-700" : "text-[#C75D3C]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                            {h.total_diff >= 0 ? "+" : ""}{fmt(h.total_diff)}
                          </td>
                          <td className="py-3 px-2 text-[#6B5B4D] text-xs">{h.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
