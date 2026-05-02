"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Search, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

const POSTAVSHIKS = [
  { id: 1, name: "Sladkiy Mir LLC", brands: ["Bonjur", "Choco-Boom"], orders: 28, sum: 412_800_000, lastDelivery: "2026-04-28", quality: 96, onTime: 92, debt: 24_500_000 },
  { id: 2, name: "Coca-Cola Uzbekistan", brands: ["Coca-Cola", "Fanta", "Sprite"], orders: 42, sum: 624_800_000, lastDelivery: "2026-04-30", quality: 98, onTime: 96, debt: 18_400_000 },
  { id: 3, name: "Aqua-Plus Distribution", brands: ["Aqua-Plus", "Eco-Drink"], orders: 18, sum: 156_400_000, lastDelivery: "2026-04-25", quality: 94, onTime: 88, debt: 6_200_000 },
  { id: 4, name: "Hilol Pechen'e", brands: ["Hilol"], orders: 12, sum: 84_200_000, lastDelivery: "2026-04-22", quality: 92, onTime: 84, debt: 12_800_000 },
  { id: 5, name: "Truffles Confectionery", brands: ["Truffles"], orders: 8, sum: 42_400_000, lastDelivery: "2026-04-15", quality: 90, onTime: 76, debt: 8_400_000 },
  { id: 6, name: "Yubileynoye Premium", brands: ["Yubileynoye"], orders: 14, sum: 96_800_000, lastDelivery: "2026-04-26", quality: 95, onTime: 90, debt: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function score(p: typeof POSTAVSHIKS[0]) {
  return Math.round((p.quality * 0.4 + p.onTime * 0.4 + (p.debt === 0 ? 100 : Math.max(0, 100 - (p.debt / p.sum * 100 * 5))) * 0.2))
}

export default function PostavshikAuditPage() {
  const [search, setSearch] = useState("")

  const ranked = [...POSTAVSHIKS].map(p => ({ ...p, score: score(p) })).sort((a, b) => b.score - a.score)
  const filtered = ranked.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const totalSum = POSTAVSHIKS.reduce((s, p) => s + p.sum, 0)
  const totalDebt = POSTAVSHIKS.reduce((s, p) => s + p.debt, 0)
  const avgQuality = POSTAVSHIKS.reduce((s, p) => s + p.quality, 0) / POSTAVSHIKS.length
  const avgOnTime = POSTAVSHIKS.reduce((s, p) => s + p.onTime, 0) / POSTAVSHIKS.length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Postavshik <span className="italic text-[#C75D3C]">audit</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{POSTAVSHIKS.length} ta postavshik · Sifat + Vaqt + Qarz tahlili</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiBig icon={Building2} accent="#10B981" label="Jami olish" value={`${fmt(totalSum / 1_000_000)} M`} sub="so'm · 4 oy" />
            <KpiBig icon={CheckCircle2} accent="#3B82F6" label="O'rtacha sifat" value={`${avgQuality.toFixed(0)}%`} sub="brak nisbat teskari" />
            <KpiBig icon={Clock} accent="#7C3AED" label="Vaqtida (on-time)" value={`${avgOnTime.toFixed(0)}%`} sub="yetkazib berish vaqti" />
            <KpiBig icon={AlertCircle} accent="#C75D3C" label="Bizning qarz" value={`${fmt(totalDebt / 1_000_000)} M`} sub="postavshikga to'lash" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Postavshik..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Postavshik</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Brendlar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Olish (4 oy)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sifat %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Vaqtida %</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qarz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Reyting</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const s = p.score
                    return (
                      <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#9C8A6E]">#{ranked.findIndex(r => r.id === p.id) + 1}</td>
                        <td className="py-3 px-2">
                          <div className="font-medium text-[#1A1A1A]">{p.name}</div>
                          <div className="text-xs text-[#9C8A6E]">So'nggi: {p.lastDelivery}</div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {p.brands.map(b => (
                              <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">{b}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(p.sum / 1_000_000)} M</td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${p.quality >= 95 ? "text-emerald-700" : p.quality >= 90 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>{p.quality}%</td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${p.onTime >= 90 ? "text-emerald-700" : p.onTime >= 80 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>{p.onTime}%</td>
                        <td className={`py-3 px-2 text-right font-mono ${p.debt > 0 ? "text-[#C75D3C] font-medium" : "text-[#9C8A6E]"}`}>
                          {p.debt > 0 ? fmt(p.debt) : "—"}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className={`inline-block px-3 py-1 rounded-md font-medium text-sm ${s >= 90 ? "bg-emerald-50 text-emerald-700" : s >= 75 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                            {s}/100
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiBig({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-7 h-7 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
